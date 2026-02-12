from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.portfolio.portfolio_service import PortfolioService
from app.schemas.portfolio import HoldingCreate, HoldingUpdate

router = APIRouter()


@router.get("/portfolio")
async def get_portfolio(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    return service.get_portfolio_summary(current_user.id)


@router.post("/portfolio")
async def create_portfolio(
    name: str = "My Portfolio",
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    portfolio = service.get_or_create_portfolio(current_user.id, name)
    return {"id": portfolio.id, "name": portfolio.name}


@router.post("/portfolio/holdings")
async def add_holding(
    data: HoldingCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    portfolio = service.get_or_create_portfolio(current_user.id)
    holding = service.add_holding(
        portfolio_id=portfolio.id,
        crypto=data.crypto,
        amount=data.amount,
        buy_price_ngn=data.buy_price_ngn,
        notes=data.notes,
    )
    return {
        "id": holding.id,
        "crypto": holding.crypto,
        "amount": holding.amount,
        "buy_price_ngn": holding.buy_price_ngn,
    }


@router.put("/portfolio/holdings/{holding_id}")
async def update_holding(
    holding_id: str,
    data: HoldingUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    holding = service.update_holding(
        holding_id=holding_id,
        user_id=current_user.id,
        amount=data.amount,
        buy_price_ngn=data.buy_price_ngn,
        notes=data.notes,
    )
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    return {"id": holding.id, "crypto": holding.crypto, "amount": holding.amount}


@router.delete("/portfolio/holdings/{holding_id}")
async def delete_holding(
    holding_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    if not service.delete_holding(holding_id, current_user.id):
        raise HTTPException(status_code=404, detail="Holding not found")
    return {"message": "Holding deleted"}
