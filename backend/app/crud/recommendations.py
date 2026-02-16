import datetime
import json

from pydantic import BaseModel
from sqlmodel import Session, col, func, select

from app.models.recommendation import Recommendation


class RecommendationListItem(BaseModel):
    id: int
    competitor_domain: str
    prompts_to_analyze: list[str]
    completed_at: datetime.datetime | None


def save_recommendation(db: Session, rec: Recommendation) -> Recommendation:
    if rec.id is not None:
        rec = db.merge(rec)
    else:
        db.add(rec)
    db.flush()
    db.refresh(rec)
    return rec


def get_recommendation(db: Session, rec_id: int) -> Recommendation | None:
    return db.get(Recommendation, rec_id)


def list_recommendations(
    db: Session, company_id: int, skip: int, limit: int
) -> tuple[int, list[RecommendationListItem]]:
    total = db.exec(
        select(func.count(col(Recommendation.id))).where(Recommendation.company_id == company_id)
    ).one()
    statement = (
        select(
            Recommendation.id,
            Recommendation.prompts_to_analyze,
            Recommendation.completed_at,
            Recommendation.competitor_domain,
        )
        .where(Recommendation.company_id == company_id)
        .order_by(col(Recommendation.created_at).desc(), col(Recommendation.id).desc())
        .offset(skip)
        .limit(limit)
    )
    rows = db.exec(statement).all()
    items = [
        RecommendationListItem(
            id=row[0],  # type: ignore
            prompts_to_analyze=json.loads(row[1]),
            completed_at=row[2],
            competitor_domain=row[3],
        )
        for row in rows
    ]
    return total, items
