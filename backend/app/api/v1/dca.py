from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.dca.dca_service import DcaService
from app.schemas.dca import DcaPlanCreate, DcaPlanUpdate, DcaEntryCreate

router = APIRouter()


@router.get("/plans")
async def get_plans(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DcaService(db)
    plans = service.get_plans(current_user.id)
    # Return summaries for each plan
    return {
        "plans": [
            service.get_plan_summary(p.id, current_user.id)
            for p in plans
        ]
    }


@router.post("/plans")
async def create_plan(
    data: DcaPlanCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DcaService(db)
    plan = service.create_plan(
        user_id=current_user.id,
        name=data.name,
        crypto=data.crypto.upper(),
        target_amount_ngn=data.target_amount_ngn,
        frequency=data.frequency,
        start_date=data.start_date,
    )
    return {"id": plan.id, "name": plan.name, "crypto": plan.crypto}


@router.get("/plans/{plan_id}")
async def get_plan(
    plan_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DcaService(db)
    summary = service.get_plan_summary(plan_id, current_user.id)
    if not summary:
        raise HTTPException(status_code=404, detail="Plan not found")
    return summary


@router.put("/plans/{plan_id}")
async def update_plan(
    plan_id: str,
    data: DcaPlanUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DcaService(db)
    plan = service.update_plan(
        plan_id=plan_id,
        user_id=current_user.id,
        name=data.name,
        target_amount_ngn=data.target_amount_ngn,
        frequency=data.frequency,
        is_active=data.is_active,
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"id": plan.id, "name": plan.name}


@router.delete("/plans/{plan_id}")
async def delete_plan(
    plan_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DcaService(db)
    if not service.delete_plan(plan_id, current_user.id):
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Plan deleted"}


@router.post("/plans/{plan_id}/entries")
async def add_entry(
    plan_id: str,
    data: DcaEntryCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DcaService(db)
    entry = service.add_entry(
        plan_id=plan_id,
        user_id=current_user.id,
        date=data.date,
        amount_ngn=data.amount_ngn,
        price_per_unit_ngn=data.price_per_unit_ngn,
        crypto_amount=data.crypto_amount,
        exchange=data.exchange,
        notes=data.notes,
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"id": entry.id, "amount_ngn": entry.amount_ngn}


@router.delete("/entries/{entry_id}")
async def delete_entry(
    entry_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DcaService(db)
    if not service.delete_entry(entry_id, current_user.id):
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted"}
