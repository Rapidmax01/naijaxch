from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_admin_user
from app.models.airdrop import Airdrop
from app.schemas.airdrop import AirdropCreate, AirdropUpdate

router = APIRouter()


@router.get("/airdrops")
async def get_airdrops(
    status: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    difficulty: Optional[str] = Query(default=None),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Get airdrops with optional filters. Featured first."""
    query = db.query(Airdrop)

    if status:
        query = query.filter(Airdrop.status == status)
    if category:
        query = query.filter(Airdrop.category == category)
    if difficulty:
        query = query.filter(Airdrop.difficulty == difficulty)

    total = query.count()
    airdrops = (
        query.order_by(Airdrop.is_featured.desc(), Airdrop.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "airdrops": [_airdrop_to_dict(a) for a in airdrops],
        "total": total,
    }


@router.get("/airdrops/{airdrop_id}")
async def get_airdrop(airdrop_id: str, db: Session = Depends(get_db)):
    airdrop = db.query(Airdrop).filter(Airdrop.id == airdrop_id).first()
    if not airdrop:
        raise HTTPException(status_code=404, detail="Airdrop not found")
    return _airdrop_to_dict(airdrop)


@router.post("/airdrops")
async def create_airdrop(
    data: AirdropCreate,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new airdrop (admin only)."""
    airdrop = Airdrop(**data.model_dump())
    db.add(airdrop)
    db.commit()
    db.refresh(airdrop)
    return _airdrop_to_dict(airdrop)


@router.put("/airdrops/{airdrop_id}")
async def update_airdrop(
    airdrop_id: str,
    data: AirdropUpdate,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update an airdrop (admin only)."""
    airdrop = db.query(Airdrop).filter(Airdrop.id == airdrop_id).first()
    if not airdrop:
        raise HTTPException(status_code=404, detail="Airdrop not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(airdrop, field, value)

    db.commit()
    db.refresh(airdrop)
    return _airdrop_to_dict(airdrop)


@router.delete("/airdrops/{airdrop_id}")
async def delete_airdrop(
    airdrop_id: str,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Delete an airdrop (admin only)."""
    airdrop = db.query(Airdrop).filter(Airdrop.id == airdrop_id).first()
    if not airdrop:
        raise HTTPException(status_code=404, detail="Airdrop not found")
    db.delete(airdrop)
    db.commit()
    return {"message": "Airdrop deleted"}


def _airdrop_to_dict(a: Airdrop) -> dict:
    return {
        "id": a.id,
        "name": a.name,
        "project": a.project,
        "description": a.description,
        "category": a.category,
        "reward_estimate": a.reward_estimate,
        "reward_token": a.reward_token,
        "requirements": a.requirements,
        "steps": a.steps,
        "url": a.url,
        "image_url": a.image_url,
        "status": a.status,
        "difficulty": a.difficulty,
        "deadline": a.deadline.isoformat() if a.deadline else None,
        "start_date": a.start_date.isoformat() if a.start_date else None,
        "is_verified": a.is_verified,
        "is_featured": a.is_featured,
        "is_auto_curated": a.is_auto_curated,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }
