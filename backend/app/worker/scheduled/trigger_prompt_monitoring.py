import logging

from app.crud.prompts import get_prompt_ids_to_refresh, mark_prompts_as_scheduled
from app.db import get_celery_db
from app.settings import settings
from app.worker.task_dispatcher import dispatch_task

from ..celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="scheduled.trigger_prompt_monitoring",
    acks_late=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=settings.celery_max_retries,
)
def trigger_prompt_monitoring():
    scheduled_count = 0
    with get_celery_db() as db:
        scheduled_ids = list(get_prompt_ids_to_refresh(db, limit=500))
        if not scheduled_ids:
            logger.info("No prompts for monitoring.")
            return
        for prompt_id in scheduled_ids:
            dispatch_task("analyzers.analyze_prompt", args=(prompt_id,))
        scheduled_count += len(scheduled_ids)
        mark_prompts_as_scheduled(db, scheduled_ids)
    logger.info(f"Scheduled {scheduled_count:,} prompts for monitoring.")
