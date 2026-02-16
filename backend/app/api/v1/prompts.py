from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlmodel import Session

from app.api.deps import (
    get_available_prompts_count_dep,
    get_min_monitored_prompt_refresh_interval_seconds_dep,
)
from app.crud.company import get_company_by_id
from app.crud.llm_costs import save_cost
from app.crud.prompts import (
    delete_monitored_prompt,
    delete_prompts,
    get_company_prompt_stats,
    get_company_prompts,
    get_monitored_prompt_by_id,
    get_monitored_prompt_run,
    get_monitored_prompt_runs,
    save_monitored_prompt,
    set_prompts_active,
    update_monitored_prompt,
)
from app.db import get_db_dep
from app.llm.prompt_suggestions import create_prompts_from_guidance
from app.models.monitored_prompt import MonitoredPrompt, MonitoredPromptRun
from app.models.prompt_monitoring import PromptMonitoringItem
from app.settings import settings
from app.worker.scheduled.trigger_prompt_monitoring import trigger_prompt_monitoring

router = APIRouter()


@router.post("/scheduled/trigger")
@router.get("/scheduled/trigger")
def trigger_prompt_monitoring_endpoint(
    x_cron_secret: Annotated[str | None, Header(alias="X-CRON-SECRET")] = None,
    authorization: Annotated[str | None, Header()] = None,
    token: str | None = None,
):
    bearer_token = None
    if authorization and authorization.lower().startswith("bearer "):
        bearer_token = authorization[7:]
    has_valid_secret = settings.cron_secret in {x_cron_secret, bearer_token, token}
    if settings.cron_secret and not has_valid_secret:
        raise HTTPException(status_code=401)
    trigger_prompt_monitoring()
    return {"status": "success"}


class PromptLimitResponse(BaseModel):
    used: int
    max: int


@router.get("/{company_id}", response_model=list[MonitoredPrompt])
def list_monitored_prompts(
    company_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    return get_company_prompts(db, company_id)


class PromptMonitoringResponse(BaseModel):
    total: int
    items: list[PromptMonitoringItem]


class PromptUpdatePayload(BaseModel):
    prompt: str
    refresh_interval_seconds: int


class PromptRunsResponse(BaseModel):
    total: int
    items: list[MonitoredPromptRun]


class PromptSuggestionsPayload(BaseModel):
    guidance: str


@router.get("/{company_id}/stats", response_model=PromptMonitoringResponse)
def list_prompt_monitoring(
    company_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
    skip: int = 0,
    limit: int = 50,
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    total, items = get_company_prompt_stats(db, company_id, skip, limit)
    return {"total": total, "items": items}


class PromptIn(BaseModel):
    prompt: str
    prompt_type: str
    target_country: str = "US"


@router.post("/{company_id}", response_model=MonitoredPrompt)
def add_monitored_prompt(
    company_id: int,
    prompt_in: PromptIn,
    db: Annotated[Session, Depends(get_db_dep)],
    available_prompts_count: int = Depends(get_available_prompts_count_dep()),
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    if available_prompts_count <= 0:
        raise HTTPException(status_code=400)
    mp = MonitoredPrompt(
        company_id=company_id,
        prompt=prompt_in.prompt,
        prompt_type=prompt_in.prompt_type,
        target_country=prompt_in.target_country,
    )
    saved = save_monitored_prompt(db, mp)
    return saved


@router.get("/{company_id}/{prompt_id}", response_model=MonitoredPrompt)
def get_monitored_prompt_endpoint(
    company_id: int,
    prompt_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    prompt = get_monitored_prompt_by_id(db, prompt_id)
    if prompt is None or prompt.company_id != company_id:
        raise HTTPException(status_code=404)
    return prompt


@router.get("/{company_id}/{prompt_id}/runs", response_model=PromptRunsResponse)
def list_prompt_runs(
    company_id: int,
    prompt_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
    skip: int = 0,
    limit: int = 50,
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    prompt = get_monitored_prompt_by_id(db, prompt_id)
    if prompt is None or prompt.company_id != company_id:
        raise HTTPException(status_code=404)
    total, items = get_monitored_prompt_runs(db, prompt_id, skip, limit)
    return {"total": total, "items": items}


@router.get("/{company_id}/{prompt_id}/runs/{run_id}", response_model=MonitoredPromptRun)
def get_prompt_run(
    company_id: int,
    prompt_id: int,
    run_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    prompt = get_monitored_prompt_by_id(db, prompt_id)
    if prompt is None or prompt.company_id != company_id:
        raise HTTPException(status_code=404)
    prompt = get_monitored_prompt_by_id(db, prompt_id)
    if prompt is None or prompt.company_id != company_id:
        raise HTTPException(status_code=404)
    run = get_monitored_prompt_run(db, run_id)
    if run is None or run.monitored_prompt_id != prompt_id:
        raise HTTPException(status_code=404)
    return run


class DeletePayload(BaseModel):
    ids: list[int]


@router.delete("/{company_id}/bulk")
def bulk_delete(
    company_id: int,
    payload: DeletePayload,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    delete_prompts(db, payload.ids, company_id)
    return {"status": "success"}


@router.delete("/{company_id}/{prompt_id}")
def delete_monitored_prompt_endpoint(
    company_id: int,
    prompt_id: int,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    prompt = get_monitored_prompt_by_id(db, prompt_id)
    if prompt is None or prompt.company_id != company_id:
        raise HTTPException(status_code=404)
    prompt = get_monitored_prompt_by_id(db, prompt_id)
    if prompt is None or prompt.company_id != company_id:
        raise HTTPException(status_code=404)
    delete_monitored_prompt(db, prompt_id)
    return {"status": "success"}


class ActivationPayload(BaseModel):
    ids: list[int]
    is_active: bool


@router.patch("/{company_id}/activation")
def bulk_activation(
    company_id: int,
    payload: ActivationPayload,
    db: Annotated[Session, Depends(get_db_dep)],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    set_prompts_active(db, payload.ids, payload.is_active, company_id)
    return {"status": "success"}


@router.patch("/{company_id}/{prompt_id}", response_model=MonitoredPrompt)
def update_monitored_prompt_endpoint(
    company_id: int,
    prompt_id: int,
    payload: PromptUpdatePayload,
    db: Annotated[Session, Depends(get_db_dep)],
    min_monitored_prompt_refresh_interval_seconds: Annotated[
        int, Depends(get_min_monitored_prompt_refresh_interval_seconds_dep())
    ],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    payload.refresh_interval_seconds = max(
        payload.refresh_interval_seconds,
        min_monitored_prompt_refresh_interval_seconds,
    )
    updated = update_monitored_prompt(
        db,
        prompt_id,
        company_id,
        payload.prompt,
        payload.refresh_interval_seconds,
    )
    if updated is None:
        raise HTTPException(status_code=404)
    return updated


@router.post("/{company_id}/suggestions", response_model=list[str])
def prompt_suggestions(
    company_id: int,
    payload: PromptSuggestionsPayload,
    db: Annotated[Session, Depends(get_db_dep)],
    available_prompts_count: Annotated[int, Depends(get_available_prompts_count_dep())],
):
    company = get_company_by_id(db, company_id)
    if company is None:
        raise HTTPException(status_code=404)
    if available_prompts_count <= 0:
        raise HTTPException(status_code=400)
    prompts, cost = create_prompts_from_guidance(
        company, guidance=payload.guidance, limit=min(available_prompts_count, 5)
    )
    if cost is not None:
        save_cost(db, cost)
    return prompts
