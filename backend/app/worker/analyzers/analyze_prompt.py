import datetime
import logging

from app.crud.company import get_company_by_id
from app.crud.prompts import save_monitored_prompt, save_monitored_prompt_run
from app.crud.quota import QuotaType, ensure_quota_available, increment_quota
from app.db import get_celery_db
from app.llm.prompt_analyzers import analyze_prompt as analyze_prompt_llm
from app.models.monitored_prompt import MonitoredPrompt, MonitoredPromptRun
from app.models.types import default_now
from app.settings import settings

from ..celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="analyzers.analyze_prompt",
    acks_late=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=settings.celery_max_retries,
)
def analyze_prompt(prompt_id: int):
    with get_celery_db() as db:
        prompt = db.get(MonitoredPrompt, prompt_id)
        if not prompt:
            logger.info(f"Prompt {prompt_id} not found.")
            return
        if prompt.is_active is False:
            logger.info(f"Prompt {prompt_id} is not active.")
            return
        if prompt.next_run_at.replace(tzinfo=datetime.UTC) > default_now():
            logger.info(f"Prompt {prompt_id} is not scheduled to run yet.")
            return
        db.expunge(prompt)
        company = get_company_by_id(db, prompt.company_id)
        if not company:
            logger.info(f"Company {prompt.company_id} not found.")
            return
        if not ensure_quota_available(db, company, QuotaType.LLM_CALLS):
            return
        db.expunge(company)
    to_save: list[MonitoredPromptRun] = []
    if settings.monitoring_channel_gemini:
        logger.info(f"Analyzing prompt {prompt_id} with Gemini...")
        to_save.append(
            analyze_prompt_llm(
                prompt,
                company,
                provider="gemini",
                analyzer_type=settings.monitoring_channel_gemini,
            )
        )
    if settings.monitoring_channel_openai:
        logger.info(f"Analyzing prompt {prompt_id} with OpenAI...")
        to_save.append(
            analyze_prompt_llm(
                prompt,
                company,
                provider="openai",
                analyzer_type=settings.monitoring_channel_openai,
            )
        )
    if not to_save:
        logger.info(f"All channels disabled for prompt {prompt_id}.")
        return
    now = default_now()
    logger.info(f"Saving prompt runs for prompt {prompt_id}...")
    with get_celery_db() as db:
        for run in to_save:
            prompt = db.get(MonitoredPrompt, prompt_id)
            if prompt is None:
                logger.info(f"Prompt {prompt_id} not found.")
                continue
            prompt.task_scheduled_at = None
            prompt.last_run_at = now
            prompt.next_run_at = prompt.next_run_at + datetime.timedelta(
                seconds=prompt.refresh_interval_seconds
            )
            run.run_at = now
            save_monitored_prompt(db, prompt)
            save_monitored_prompt_run(db, run)
        increment_quota(db, company, QuotaType.LLM_CALLS)
    logger.info(f"Finished analyzing prompt {prompt_id}.")
