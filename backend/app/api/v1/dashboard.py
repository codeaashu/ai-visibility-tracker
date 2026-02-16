from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api.v1.prompts import PromptMonitoringResponse
from app.crud.company import get_company_by_id
from app.crud.dashboard import get_dashboard_stats, get_prompts_citing_domain
from app.db import get_db_dep
from app.models.dashboard import DashboardStats

router = APIRouter()


@router.get("/{company_id}", response_model=DashboardStats)
def read_dashboard_stats(
    company_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
) -> DashboardStats:
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    return get_dashboard_stats(db, company_id)


@router.get(
    "/{company_id}/share_of_voice/{domain}",
    response_model=PromptMonitoringResponse,
)
def list_prompts_citing_domain(
    company_id: int,
    domain: str,
    db: Annotated[Session, Depends(get_db_dep)],
    skip: int = 0,
    limit: int = 50,
) -> PromptMonitoringResponse:
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    total, items = get_prompts_citing_domain(db, company_id, domain, skip, limit)
    return {"total": total, "items": items}
