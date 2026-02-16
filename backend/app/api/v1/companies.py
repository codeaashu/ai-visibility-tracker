from typing import Annotated
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.api.deps import get_available_companies_count_dep
from app.crud.company import (
    add_competitor,
    delete_company_by_id,
    delete_competitor,
    get_companies,
    get_company_by_id,
    get_latest_company_crawl,
    list_competitors,
    save_company,
    save_company_crawl,
)
from app.crud.llm_costs import save_cost
from app.crud.prompts import save_monitored_prompt
from app.db import get_db_dep
from app.fetchers.fetch_status import FetchStatus
from app.llm.competitor_suggestions import create_competitors
from app.llm.prompt_suggestions import create_prompts
from app.models import Company, CompanyCrawl
from app.models.monitored_prompt import MonitoredPrompt, MonitoredPromptType
from app.models.types import default_now
from app.worker.task_dispatcher import dispatch_task

router = APIRouter()
logger = logging.getLogger(__name__)


def _start_company_crawl(company_id: int):
    dispatch_task("fetchers.company_crawl", args=(company_id,))


@router.get("/", response_model=list[Company])
def list_companies(
    db: Annotated[Session, Depends(get_db_dep)],
):
    return get_companies(db)


@router.get("/{company_id}", response_model=Company)
def get_company(
    company_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    return company


@router.post("/", response_model=Company)
def create_company(
    company: Company,
    db: Annotated[Session, Depends(get_db_dep)],
    available_companies_count: int = Depends(get_available_companies_count_dep()),
):
    if available_companies_count <= 0:
        raise HTTPException(status_code=400, detail="Company limit reached")
    company = save_company(db, company)
    assert company.id is not None
    company_id = company.id
    db.commit()
    try:
        _start_company_crawl(company_id)
    except Exception:
        logger.exception("Failed to start crawl for company_id=%s", company_id)
    company_db = get_company_by_id(db, company_id)
    assert company_db is not None
    return company_db


@router.post("/{company_id}/recrawl", response_model=Company)
def recrawl_company(
    company_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company: Company | None = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    crawl = CompanyCrawl(
        company_id=company_id,
        url=company.website,
        crawl_status=FetchStatus.PENDING.value,
        raw_response="",
    )
    save_company_crawl(db, crawl)
    try:
        _start_company_crawl(company_id)
    except Exception:
        logger.exception("Failed to recrawl company_id=%s", company_id)
    return company


@router.get("/{company_id}/crawl-status")
def get_crawl_status(
    company_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    crawl = get_latest_company_crawl(db, company_id)
    if crawl is None:
        return {"status": "pending"}
    return {"status": crawl.crawl_status}


class CompetitorIn(BaseModel):
    name: str
    website: str | None = None


@router.get("/{company_id}/competitors", response_model=list[Company])
def list_company_competitors(
    company_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    return list_competitors(db, company_id)


@router.post("/{company_id}/suggestions/competitors", response_model=list[Company])
def create_company_competitor_suggestions(
    company_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    competitors, cost_competitors = create_competitors(company)
    if cost_competitors is not None:
        save_cost(db, cost_competitors)
    res = []
    for suggestion in competitors:
        res.append(add_competitor(db, company, suggestion.name, suggestion.website))
    return res


@router.post("/{company_id}/suggestions/prompts", response_model=list[MonitoredPrompt])
def create_company_prompt_suggestions(
    company_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    prompts, cost_prompts = create_prompts(company)
    if cost_prompts is not None:
        save_cost(db, cost_prompts)
    res = []
    for prompt in prompts.prompts_leading_to_product:
        res.append(
            save_monitored_prompt(
                db,
                MonitoredPrompt(
                    company_id=company_id,
                    prompt=prompt,
                    prompt_type=MonitoredPromptType.PRODUCT.value,
                    target_country="US",
                ),
            )
        )
    for prompt in prompts.prompts_expertise:
        res.append(
            save_monitored_prompt(
                db,
                MonitoredPrompt(
                    company_id=company_id,
                    prompt=prompt,
                    prompt_type=MonitoredPromptType.EXPERTISE.value,
                    target_country="US",
                ),
            )
        )
    return res


@router.post("/{company_id}/competitors", response_model=Company)
def add_company_competitor(
    company_id: int,
    competitor: CompetitorIn,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    return add_competitor(db, company, competitor.name, competitor.website)


@router.delete("/{company_id}/competitors/{competitor_id}")
def delete_company_competitor(
    company_id: int,
    competitor_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    delete_competitor(db, company_id, competitor_id)
    return {"status": "success"}


@router.put("/{company_id}", response_model=Company)
def update_company(
    company_id: int,
    company: Company,
    db: Annotated[Session, Depends(get_db_dep)],
):
    db_company = get_company_by_id(db, company_id)
    if db_company is None:
        raise HTTPException(status_code=404)
    company.id = company_id
    company.created_at = db_company.created_at
    company.updated_at = default_now()
    company.llm_understanding = db_company.llm_understanding
    updated_company = save_company(db, company)
    assert updated_company.id is not None
    # todo: think if we need to restart crawl if website changes
    #       we don't want to override user's changes
    # if updated_company.website != db_company.website:
    #     _start_company_crawl(updated_company.id)
    return updated_company


@router.delete("/{company_id}")
def delete_company(
    company_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    delete_company_by_id(db, company_id)
    return {"status": "success"}
