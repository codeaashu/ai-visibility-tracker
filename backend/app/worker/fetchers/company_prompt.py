import logging

from app.crud.company import get_company_by_id
from app.crud.llm_costs import save_cost
from app.crud.prompts import save_monitored_prompt
from app.db import get_celery_db
from app.llm.prompt_suggestions import create_prompts
from app.models.monitored_prompt import MonitoredPrompt, MonitoredPromptType
from app.settings import settings
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="fetchers.company_prompt",
    acks_late=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=settings.celery_max_retries,
)
def fetch_company_prompt(company_id: int):
    logger.info(f"Company prompt for company(id={company_id})")
    with get_celery_db() as db:
        company = get_company_by_id(db, company_id)
        if company is None:
            logger.error(f"Can't find company(id={company_id})")
            return
        db.expunge(company)

    logger.info(f"Creating prompts and competitors for company(id={company_id}) website...")
    prompts, cost_prompts = create_prompts(company)
    with get_celery_db() as db:
        if cost_prompts is not None:
            save_cost(db, cost_prompts)
        company = get_company_by_id(db, company_id)
        if company is None:
            logger.error(f"Can't find company(id={company_id})")
            return
        for prompt in prompts.prompts_leading_to_product:
            save_monitored_prompt(
                db,
                MonitoredPrompt(
                    company_id=company_id,
                    prompt=prompt,
                    prompt_type=MonitoredPromptType.PRODUCT.value,
                    target_country="US",
                ),
            )
        for prompt in prompts.prompts_expertise:
            save_monitored_prompt(
                db,
                MonitoredPrompt(
                    company_id=company_id,
                    prompt=prompt,
                    prompt_type=MonitoredPromptType.EXPERTISE.value,
                    target_country="US",
                ),
            )
    logger.info(f"Finished company(id={company_id}) prompts generation.")
