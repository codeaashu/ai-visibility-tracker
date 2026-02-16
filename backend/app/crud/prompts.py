from collections.abc import Sequence

from sqlmodel import Session, case, col, delete, func, select, update

from app.models.monitored_prompt import MonitoredPrompt, MonitoredPromptRun
from app.models.prompt_monitoring import PromptMonitoringItem
from app.models.types import default_now


def get_company_prompts(db: Session, company_id: int):
    return db.exec(select(MonitoredPrompt).where(MonitoredPrompt.company_id == company_id)).all()


def get_monitored_prompt_by_id(db: Session, prompt_id: int) -> MonitoredPrompt | None:
    return db.get(MonitoredPrompt, prompt_id)


def get_monitored_prompt_by_ids(db: Session, prompt_ids: list[int]) -> Sequence[MonitoredPrompt]:
    return db.exec(select(MonitoredPrompt).where(col(MonitoredPrompt.id).in_(prompt_ids))).all()


def save_monitored_prompt(db: Session, monitored_prompt: MonitoredPrompt):
    if monitored_prompt.id is not None:
        monitored_prompt = db.merge(monitored_prompt)
    else:
        db.add(monitored_prompt)
    db.flush()
    db.refresh(monitored_prompt)
    return monitored_prompt


def delete_monitored_prompt(db: Session, prompt_id: int):
    prompt = db.get(MonitoredPrompt, prompt_id)
    if prompt is None:
        return
    db.delete(prompt)
    db.flush()


def update_monitored_prompt(
    db: Session,
    prompt_id: int,
    company_id: int,
    prompt: str,
    refresh_interval_seconds: int,
) -> MonitoredPrompt | None:
    mp = db.exec(
        select(MonitoredPrompt).where(
            MonitoredPrompt.id == prompt_id,
            MonitoredPrompt.company_id == company_id,
        )
    ).one_or_none()
    if mp is None:
        return None
    mp.prompt = prompt
    mp.refresh_interval_seconds = refresh_interval_seconds
    db.flush()
    db.refresh(mp)
    return mp


def get_monitored_prompt_runs(
    db: Session, prompt_id: int, offset: int, limit: int
) -> tuple[int, Sequence[MonitoredPromptRun]]:
    total = db.exec(
        select(func.count(col(MonitoredPromptRun.id))).where(
            MonitoredPromptRun.monitored_prompt_id == prompt_id
        )
    ).one()
    statement = (
        select(MonitoredPromptRun)
        .where(MonitoredPromptRun.monitored_prompt_id == prompt_id)
        .order_by(col(MonitoredPromptRun.run_at).desc())
        .offset(offset)
        .limit(limit)
    )
    runs = db.exec(statement).all()
    return total, runs


def get_monitored_prompt_run(db: Session, run_id: int) -> MonitoredPromptRun | None:
    return db.get(MonitoredPromptRun, run_id)


def get_prompt_ids_to_refresh(db: Session, limit: int = 500) -> Sequence[int]:
    now = default_now()
    statement = (
        select(MonitoredPrompt.id)
        .where(
            MonitoredPrompt.next_run_at <= now,
            col(MonitoredPrompt.task_scheduled_at).is_(None),
            col(MonitoredPrompt.is_active).is_(True),
        )
        .order_by(col(MonitoredPrompt.next_run_at).asc())
        .limit(limit)
    )
    return db.exec(statement).all()  # type: ignore


def mark_prompts_as_scheduled(db: Session, prompt_ids: Sequence[int]):
    statement = (
        update(MonitoredPrompt)
        .where(col(MonitoredPrompt.id).in_(prompt_ids))
        .values(task_scheduled_at=default_now())
    )
    db.exec(statement)  # type: ignore
    db.flush()


def save_monitored_prompt_run(db: Session, monitored_prompt_run: MonitoredPromptRun):
    if monitored_prompt_run.id is not None:
        monitored_prompt_run = db.merge(monitored_prompt_run)
    else:
        db.add(monitored_prompt_run)
    db.flush()
    db.refresh(monitored_prompt_run)
    return monitored_prompt_run


def get_company_prompt_stats(
    db: Session, company_id: int, offset: int, limit: int
) -> tuple[int, list[PromptMonitoringItem]]:
    total = db.exec(
        select(func.count(col(MonitoredPrompt.id))).where(MonitoredPrompt.company_id == company_id)
    ).one()
    openai_latest = (
        select(
            MonitoredPromptRun.monitored_prompt_id,
            func.max(MonitoredPromptRun.run_at).label("max_run_at"),
        )
        .where(MonitoredPromptRun.llm_provider == "openai")
        .group_by(MonitoredPromptRun.monitored_prompt_id)
        .subquery()
    )

    openai_subq = (
        select(
            MonitoredPromptRun.monitored_prompt_id.label("monitored_prompt_id"),
            case(
                (col(MonitoredPromptRun.brand_mentioned).is_(True), True),
                (
                    col(MonitoredPromptRun.company_domain_rank).is_not(None),
                    True,
                ),
                else_=False,
            ).label("openai_last_result"),
        )
        .join(
            openai_latest,
            (MonitoredPromptRun.monitored_prompt_id == openai_latest.c.monitored_prompt_id)
            & (MonitoredPromptRun.run_at == openai_latest.c.max_run_at),
        )
        .where(MonitoredPromptRun.llm_provider == "openai")
        .subquery()
    )

    gemini_latest = (
        select(
            MonitoredPromptRun.monitored_prompt_id,
            func.max(MonitoredPromptRun.run_at).label("max_run_at"),
        )
        .where(MonitoredPromptRun.llm_provider == "gemini")
        .group_by(MonitoredPromptRun.monitored_prompt_id)
        .subquery()
    )

    gemini_subq = (
        select(
            MonitoredPromptRun.monitored_prompt_id.label("monitored_prompt_id"),
            case(
                (col(MonitoredPromptRun.brand_mentioned).is_(True), True),
                (
                    col(MonitoredPromptRun.company_domain_rank).is_not(None),
                    True,
                ),
                else_=False,
            ).label("gemini_last_result"),
        )
        .join(
            gemini_latest,
            (MonitoredPromptRun.monitored_prompt_id == gemini_latest.c.monitored_prompt_id)
            & (MonitoredPromptRun.run_at == gemini_latest.c.max_run_at),
        )
        .where(MonitoredPromptRun.llm_provider == "gemini")
        .subquery()
    )

    statement = (
        select(
            MonitoredPrompt.id,
            MonitoredPrompt.prompt,
            MonitoredPrompt.prompt_type,
            MonitoredPrompt.is_active,
            MonitoredPrompt.created_at,
            openai_subq.c.openai_last_result,
            gemini_subq.c.gemini_last_result,
            func.coalesce(
                func.avg(
                    case(
                        (col(MonitoredPromptRun.brand_mentioned).is_(True), 1.0),
                        else_=0.0,
                    )
                ),
                0.0,
            ).label("visibility"),
        )
        .where(MonitoredPrompt.company_id == company_id)
        .join(
            MonitoredPromptRun,
            MonitoredPromptRun.monitored_prompt_id == MonitoredPrompt.id,
            isouter=True,
        )
        .join(
            openai_subq,
            openai_subq.c.monitored_prompt_id == MonitoredPrompt.id,
            isouter=True,
        )
        .join(
            gemini_subq,
            gemini_subq.c.monitored_prompt_id == MonitoredPrompt.id,
            isouter=True,
        )
        .group_by(
            MonitoredPrompt.id,
            openai_subq.c.openai_last_result,
            gemini_subq.c.gemini_last_result,
        )
        .order_by(col(MonitoredPrompt.created_at).desc(), col(MonitoredPrompt.id).desc())
        .offset(offset)
        .limit(limit)
    )
    rows = db.exec(statement).all()
    items = [
        PromptMonitoringItem(
            id=row.id,
            prompt=row.prompt,
            prompt_type=row.prompt_type,
            is_active=row.is_active,
            created_at=row.created_at,
            openai_last_result=row.openai_last_result,
            gemini_last_result=row.gemini_last_result,
            visibility=row.visibility,
        )
        for row in rows
    ]
    return total, items


def set_prompts_active(
    db: Session, prompt_ids: Sequence[int], is_active: bool, company_id: int
) -> None:
    if not prompt_ids:
        return
    statement = (
        update(MonitoredPrompt)
        .where(
            col(MonitoredPrompt.id).in_(prompt_ids),
            col(MonitoredPrompt.company_id) == company_id,
        )
        .values(is_active=is_active)
    )
    db.exec(statement)  # type: ignore
    db.flush()


def delete_prompts(db: Session, prompt_ids: Sequence[int], company_id: int) -> None:
    if not prompt_ids:
        return
    db.exec(
        delete(MonitoredPrompt).where(
            col(MonitoredPrompt.id).in_(prompt_ids),
            col(MonitoredPrompt.company_id) == company_id,
        )
    )  # type: ignore
    db.flush()
