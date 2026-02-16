from collections.abc import Sequence

from app.settings import settings
from app.worker.analyzers.analyze_prompt import analyze_prompt
from app.worker.celery_app import celery_app
from app.worker.fetchers.company_crawl import fetch_company_crawl
from app.worker.recommendations.generate import generate


def _run_inline(task_name: str, args: Sequence[object]):
    if task_name == "fetchers.company_crawl":
        fetch_company_crawl(*args)
        return
    if task_name == "analyzers.analyze_prompt":
        analyze_prompt(*args)
        return
    if task_name == "recommendations.generate":
        generate(*args)
        return
    raise ValueError(f"Unsupported inline task: {task_name}")


def dispatch_task(task_name: str, args: Sequence[object] = ()):
    if settings.task_mode == "inline":
        _run_inline(task_name, args)
        return
    celery_app.send_task(task_name, args=list(args))
