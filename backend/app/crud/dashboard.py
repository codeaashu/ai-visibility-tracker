from __future__ import annotations

import json
from collections import Counter
from collections.abc import Sequence

from sqlmodel import Session, case, col, func, select

from app.crud.company import get_company_by_id, list_competitors
from app.llm.prompt_analyzers.helpers import normalize_domain
from app.models.dashboard import DashboardStats, ShareOfVoiceItem
from app.models.monitored_prompt import MonitoredPrompt, MonitoredPromptRun
from app.models.prompt_monitoring import PromptMonitoringItem


def get_dashboard_stats(db: Session, company_id: int) -> DashboardStats:
    company = get_company_by_id(db, company_id)
    if company is None:
        return DashboardStats(
            ai_visibility_score=0.0, website_citation_share=0.0, share_of_voice=[]
        )
    company_domain = normalize_domain(company.website)
    competitor_domains = {
        d
        for d in (normalize_domain(c.website) for c in list_competitors(db, company_id))
        if d is not None
    }

    latest_run_subq = (
        select(
            MonitoredPromptRun.monitored_prompt_id,
            func.max(MonitoredPromptRun.run_at).label("max_run_at"),
        )
        .group_by(col(MonitoredPromptRun.monitored_prompt_id))
        .subquery()
    )

    statement = (
        select(
            MonitoredPromptRun.brand_mentioned,
            MonitoredPromptRun.company_domain_rank,
            MonitoredPromptRun.top_domain,
            MonitoredPromptRun.mentioned_pages,
            MonitoredPrompt.prompt_type,
        )
        .join(
            latest_run_subq,
            (latest_run_subq.c.monitored_prompt_id == MonitoredPromptRun.monitored_prompt_id)
            & (latest_run_subq.c.max_run_at == MonitoredPromptRun.run_at),
        )
        .join(
            MonitoredPrompt,
            col(MonitoredPrompt.id) == col(MonitoredPromptRun.monitored_prompt_id),
        )
        .where(
            MonitoredPrompt.company_id == company_id,
            col(MonitoredPrompt.is_active).is_(True),
        )
    )

    runs: Sequence[tuple[bool, int | None, str | None, str | None, str | None]] = db.exec(
        statement
    ).all()
    total = len(runs)
    product_brand_mentions = sum(1 for r in runs if r[0] and r[4] == "product")
    product_total = sum(1 for r in runs if r[4] == "product")
    citations = sum(1 for r in runs if r[1] is not None)
    domain_counts = Counter()
    for run in runs:
        seen_in_run = set()
        if run[3] is not None:  # mentioned_pages
            for page in json.loads(run[3]):  # type: ignore
                domain = normalize_domain(page)
                if domain not in seen_in_run:
                    domain_counts[domain] += 1
                    seen_in_run.add(domain)

    share_of_voice: list[ShareOfVoiceItem] = []
    for domain, count in domain_counts.most_common():
        if domain.endswith(company_domain):
            domain_type = "company"
        elif any(domain.endswith(d) for d in competitor_domains):
            domain_type = "competitor"
        else:
            domain_type = "other"
        share_of_voice.append(ShareOfVoiceItem(domain=domain, count=count, type=domain_type))

    ai_visibility_score = product_brand_mentions / product_total if product_total else 0.0
    website_citation_share = citations / total if total else 0.0

    return DashboardStats(
        ai_visibility_score=ai_visibility_score,
        website_citation_share=website_citation_share,
        total_runs=total,
        share_of_voice=share_of_voice,
    )


def get_prompts_citing_domain(
    db: Session, company_id: int, domain: str, offset: int, limit: int
) -> tuple[int, list[PromptMonitoringItem]]:
    norm = normalize_domain(domain)
    total = db.exec(
        select(func.count(func.distinct(MonitoredPrompt.id)))
        .join(
            MonitoredPromptRun,
            MonitoredPromptRun.monitored_prompt_id == MonitoredPrompt.id,
        )
        .where(
            MonitoredPrompt.company_id == company_id,
            col(MonitoredPromptRun.mentioned_pages).ilike(f"%{norm}%"),
        )
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
        .join(
            MonitoredPromptRun,
            MonitoredPromptRun.monitored_prompt_id == MonitoredPrompt.id,
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
        .where(
            MonitoredPrompt.company_id == company_id,
            col(MonitoredPromptRun.mentioned_pages).ilike(f"%{norm}%"),
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
