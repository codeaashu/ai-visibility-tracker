import logging

from app.crud.company import add_competitor, get_company_by_id
from app.crud.llm_costs import save_cost
from app.db import get_celery_db
from app.llm.competitor_suggestions import create_competitors
from app.settings import settings
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="fetchers.company_competitor",
    acks_late=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=settings.celery_max_retries,
)
def fetch_company_competitor(company_id: int):
    logger.info(f"Company competitor for company(id={company_id})")
    with get_celery_db() as db:
        company = get_company_by_id(db, company_id)
        if company is None:
            logger.error(f"Can't find company(id={company_id})")
            return
        db.expunge(company)

    logger.info(f"Creating prompts and competitors for company(id={company_id}) website...")
    competitors, cost_competitors = create_competitors(company)
    with get_celery_db() as db:
        if cost_competitors is not None:
            save_cost(db, cost_competitors)
        company = get_company_by_id(db, company_id)
        if company is None:
            logger.error(f"Can't find company(id={company_id})")
            return
        for suggestion in competitors:
            add_competitor(db, company, suggestion.name, suggestion.website)
    logger.info(f"Finished company(id={company_id}) competitors generation.")
