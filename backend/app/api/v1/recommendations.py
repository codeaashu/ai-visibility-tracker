import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.api.deps import get_available_recommendations_count_dep
from app.crud.company import get_company_by_id
from app.crud.prompts import get_monitored_prompt_by_ids
from app.crud.recommendations import (
    RecommendationListItem,
    get_recommendation,
    list_recommendations,
    save_recommendation,
)
from app.db import get_db_dep
from app.models.recommendation import Recommendation
from app.worker.task_dispatcher import dispatch_task

router = APIRouter()


class RecommendationListResponse(BaseModel):
    total: int
    items: list[RecommendationListItem]


class RecommendationCreatePayload(BaseModel):
    competitor_domain: str
    prompt_ids: list[int]


@router.get("/{company_id}", response_model=RecommendationListResponse)
def list_recommendations_endpoint(
    company_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
    skip: int = 0,
    limit: int = 50,
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    total, items = list_recommendations(db, company_id, skip, limit)
    return {"total": total, "items": items}


@router.post("/{company_id}", response_model=Recommendation)
def create_recommendation_endpoint(
    company_id: int,
    payload: RecommendationCreatePayload,
    db: Annotated[Session, Depends(get_db_dep)],
    available_recommendations_count: Annotated[
        int, Depends(get_available_recommendations_count_dep())
    ],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    if available_recommendations_count <= 0:
        raise HTTPException(status_code=400)
    prompts = get_monitored_prompt_by_ids(db, payload.prompt_ids)

    rec = Recommendation(
        company_id=company_id,
        competitor_domain=payload.competitor_domain,
        prompts_to_analyze=json.dumps([x.prompt for x in prompts]),
    )
    rec = save_recommendation(db, rec)
    assert rec.id is not None
    dispatch_task("recommendations.generate", args=(rec.id,))
    return rec


@router.get("/{company_id}/{rec_id}", response_model=Recommendation)
def get_recommendation_endpoint(
    company_id: int,
    rec_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    rec = get_recommendation(db, rec_id)
    if rec is None or rec.company_id != company_id:
        raise HTTPException(status_code=404)
    return rec
