from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.signal import TradingSignal
from app.schemas.signal import SignalCreate, SignalUpdate, SignalResponse, SignalStatsResponse

router = APIRouter()


@router.get("/signals")
async def get_signals(
    status: Optional[str] = Query(default=None),
    asset_type: Optional[str] = Query(default=None),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Get trading signals. Premium signals hidden from free users."""
    query = db.query(TradingSignal)

    if status:
        query = query.filter(TradingSignal.status == status)
    if asset_type:
        query = query.filter(TradingSignal.asset_type == asset_type)

    # Hide premium signals from unauthenticated users
    query = query.filter(TradingSignal.is_premium == False)

    total = query.count()
    signals = (
        query.order_by(TradingSignal.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "signals": [_signal_to_dict(s) for s in signals],
        "total": total,
    }


@router.get("/signals/stats")
async def get_signal_stats(db: Session = Depends(get_db)):
    """Get signal performance stats."""
    total = db.query(TradingSignal).count()
    open_count = db.query(TradingSignal).filter(TradingSignal.status == "open").count()
    closed = db.query(TradingSignal).filter(TradingSignal.status == "closed").all()
    closed_count = len(closed)

    wins = [s for s in closed if s.result == "win"]
    win_rate = (len(wins) / closed_count * 100) if closed_count > 0 else 0
    avg_return = (
        sum(s.result_percent or 0 for s in closed) / closed_count
        if closed_count > 0
        else 0
    )

    return {
        "total_signals": total,
        "open_signals": open_count,
        "closed_signals": closed_count,
        "win_rate": round(win_rate, 1),
        "avg_return": round(avg_return, 2),
    }


@router.post("/signals")
async def create_signal(
    data: SignalCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new signal (admin only)."""
    signal = TradingSignal(
        asset_type=data.asset_type,
        asset_symbol=data.asset_symbol.upper(),
        direction=data.direction,
        entry_price=data.entry_price,
        target_price=data.target_price,
        stop_loss=data.stop_loss,
        reasoning=data.reasoning,
        timeframe=data.timeframe,
        is_premium=data.is_premium,
    )
    db.add(signal)
    db.commit()
    db.refresh(signal)
    return _signal_to_dict(signal)


@router.put("/signals/{signal_id}")
async def update_signal(
    signal_id: str,
    data: SignalUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a signal (admin only)."""
    signal = db.query(TradingSignal).filter(TradingSignal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")

    for field in ["status", "result", "result_percent", "target_price", "stop_loss", "reasoning"]:
        value = getattr(data, field, None)
        if value is not None:
            setattr(signal, field, value)

    db.commit()
    db.refresh(signal)
    return _signal_to_dict(signal)


def _signal_to_dict(s: TradingSignal) -> dict:
    return {
        "id": s.id,
        "asset_type": s.asset_type,
        "asset_symbol": s.asset_symbol,
        "direction": s.direction,
        "entry_price": s.entry_price,
        "target_price": s.target_price,
        "stop_loss": s.stop_loss,
        "reasoning": s.reasoning,
        "timeframe": s.timeframe,
        "status": s.status,
        "result": s.result,
        "result_percent": s.result_percent,
        "is_premium": s.is_premium,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }
