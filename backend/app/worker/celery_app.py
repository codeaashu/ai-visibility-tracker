import logging

from celery import Celery
from celery.schedules import crontab

from app.settings import settings

logger = logging.getLogger(__name__)


Q_CRAWL = "crawl"
Q_PROMPT_WATCH = "prompt_watch"
Q_SCHEDULED = "scheduled"
Q_LLM_HIGH_PRIORITY = "llm_high_priority"


def create_celery_app(name: str, *, broker: str, backend: str, result_expires: int = 86400):
    """Celery app factory to unify configs across workers/services"""
    celery_app = Celery(name, broker=broker, backend=backend)
    celery_app.conf.task_track_started = True
    celery_app.conf.task_serializer = "json"
    celery_app.conf.result_serializer = "json"
    celery_app.conf.accept_content = ["json"]
    celery_app.conf.result_expires = result_expires
    celery_app.conf.broker_connection_retry_on_startup = True
    if "amqp" in broker:
        celery_app.conf.broker_transport_options = {"confirm_publish": True}
    celery_app.conf.worker_cancel_long_running_tasks_on_connection_loss = True

    celery_app.conf.worker_prefetch_multiplier = 1

    celery_app.conf.task_routes = {
        "scheduled.trigger_prompt_monitoring": Q_SCHEDULED,
        "fetchers.company_crawl": Q_CRAWL,
        "analyzers.analyze_prompt": Q_PROMPT_WATCH,
        "recommendations.generate": Q_LLM_HIGH_PRIORITY,
    }
    celery_app.conf.beat_schedule = {
        "trigger_prompt_monitoring": {
            "task": "scheduled.trigger_prompt_monitoring",
            "schedule": crontab(*settings.schedule_trigger_prompt_monitoring.split(" ")),
        },
    }
    return celery_app


# celery doesn't support valkey backend yet: https://github.com/celery/celery/issues/9092
backend = str(settings.celery_backend).replace("valkey://", "redis://")

celery_app = create_celery_app(
    "worker",
    broker=str(settings.celery_broker),
    backend=backend,
    result_expires=settings.celery_result_expires,
)
