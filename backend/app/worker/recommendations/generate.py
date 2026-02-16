import json
import logging

from app.crud.company import get_company_by_id
from app.crud.llm_costs import save_cost
from app.crud.quota import QuotaType, ensure_quota_available
from app.crud.recommendations import get_recommendation, save_recommendation
from app.db import get_celery_db
from app.llm.recommendations import generate_recommendation
from app.models.types import default_now
from app.settings import settings

from ..celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="recommendations.generate",
    acks_late=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=settings.celery_max_retries,
)
def generate(recommendation_id: int):
    with get_celery_db() as db:
        rec = get_recommendation(db, recommendation_id)
        if rec is None:
            logger.info(f"Recommendation {recommendation_id} not found.")
            return
        if rec.completed_at is not None:
            logger.info(f"Recommendation {recommendation_id} already completed.")
            return
        company = get_company_by_id(db, rec.company_id)
        if company is None:
            logger.info(
                f"Company(id={rec.company_id}) not found for "
                f"recommendation(id={recommendation_id})."
            )
            return
        if not ensure_quota_available(db, company, QuotaType.RECOMMENDATIONS):
            return
        db.expunge(company)
        db.expunge(rec)
    result, cost = generate_recommendation(
        company, rec.competitor_domain, json.loads(rec.prompts_to_analyze)
    )
    with get_celery_db() as db:
        rec = get_recommendation(db, recommendation_id)
        if rec is None:
            logger.info(f"Recommendation {recommendation_id} not found on save.")
            return
        rec.why_competitor = result.why_competitor
        rec.why_not_user = result.why_not_user
        rec.what_to_do = result.what_to_do
        rec.completed_at = default_now()
        save_recommendation(db, rec)
        if cost is not None:
            save_cost(db, cost)
    logger.info(f"Finished recommendation {recommendation_id} generation.")
