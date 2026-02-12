from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    decode_token
)
from app.config import settings
from app.models.user import User
from app.models.subscription import Subscription, ProductType, PlanType
from app.services.email import email_service
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    Token,
    PasswordResetRequest,
    PasswordReset,
    GoogleAuthRequest
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Register a new user.

    Creates a new user account with the provided email and password.
    Also creates free subscriptions for both ArbScanner and NGX Radar.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone
    )
    db.add(user)
    db.flush()

    # Create free subscriptions for both products
    for product in [ProductType.ARBSCANNER, ProductType.NGXRADAR]:
        subscription = Subscription(
            user_id=user.id,
            product=product.value,
            plan=PlanType.FREE.value
        )
        db.add(subscription)

    db.commit()
    db.refresh(user)

    # Send welcome email in background
    background_tasks.add_task(
        email_service.send_welcome_email,
        to=user.email,
        name=user.first_name or user.email.split("@")[0]
    )

    return user


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login and get access tokens.

    Authenticates user with email and password, returns JWT tokens.
    """
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account uses Google sign-in. Please sign in with Google."
        )

    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    payload = decode_token(refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Create new tokens
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's information.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    """
    update_data = user_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return current_user


@router.post("/telegram/link")
async def link_telegram(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Link a Telegram chat ID to the user's account.
    """
    current_user.telegram_chat_id = chat_id
    db.commit()

    return {"message": "Telegram account linked successfully"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout user (client should discard tokens).
    """
    return {"message": "Logged out successfully"}


@router.post("/password-reset/request")
async def request_password_reset(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Request a password reset email.
    """
    user = db.query(User).filter(User.email == request.email).first()

    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If an account exists, a reset email has been sent."}

    # Create a reset token (expires in 1 hour)
    from datetime import timedelta
    reset_token = create_access_token(
        data={"sub": str(user.id), "purpose": "password_reset"},
        expires_delta=timedelta(hours=1)
    )

    # Send reset email
    background_tasks.add_task(
        email_service.send_password_reset_email,
        to=user.email,
        reset_token=reset_token
    )

    return {"message": "If an account exists, a reset email has been sent."}


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    request: PasswordReset,
    db: Session = Depends(get_db)
):
    """
    Reset password using the token from the email.
    """
    try:
        payload = decode_token(request.token)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    if payload.get("purpose") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token type"
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )

    # Update password
    user.password_hash = get_password_hash(request.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Password reset successfully"}


@router.post("/google", response_model=Token)
async def google_auth(
    request: GoogleAuthRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Authenticate with Google OAuth.

    Verifies the Google ID token, finds or creates the user, and returns JWT tokens.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google sign-in is not configured"
        )

    # Verify the Google ID token
    try:
        idinfo = google_id_token.verify_oauth2_token(
            request.token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )

    google_id = idinfo["sub"]
    email = idinfo.get("email")
    email_verified = idinfo.get("email_verified", False)

    if not email or not email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email is not verified"
        )

    # Look up user by google_id first, then by email
    user = db.query(User).filter(User.google_id == google_id).first()

    if not user:
        user = db.query(User).filter(User.email == email).first()

        if user:
            # Existing email/password user — link Google account
            user.google_id = google_id
            user.auth_provider = "google"
        else:
            # New user — create account
            user = User(
                email=email,
                first_name=idinfo.get("given_name"),
                last_name=idinfo.get("family_name"),
                auth_provider="google",
                google_id=google_id,
                is_verified=True,
            )
            db.add(user)
            db.flush()

            # Create free subscriptions for both products
            for product in [ProductType.ARBSCANNER, ProductType.NGXRADAR]:
                subscription = Subscription(
                    user_id=user.id,
                    product=product.value,
                    plan=PlanType.FREE.value
                )
                db.add(subscription)

            # Send welcome email in background
            background_tasks.add_task(
                email_service.send_welcome_email,
                to=user.email,
                name=user.first_name or user.email.split("@")[0]
            )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )
