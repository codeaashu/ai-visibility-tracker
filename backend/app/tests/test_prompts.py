from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.crud.prompts import (
    get_monitored_prompt_runs,
    save_monitored_prompt,
    save_monitored_prompt_run,
    update_monitored_prompt,
)
from app.models import MonitoredPrompt, MonitoredPromptRun
from app.models.types import default_now
from app.settings import settings


def test_crud_update_and_runs(db_session, app_company) -> None:
    prompt = save_monitored_prompt(
        db_session,
        MonitoredPrompt(
            company_id=app_company.id,
            prompt="p",
            prompt_type="product",
            refresh_interval_seconds=60,
            next_run_at=default_now(),
            created_at=default_now(),
        ),
    )
    assert prompt.id is not None
    now = default_now()
    save_monitored_prompt_run(
        db_session,
        MonitoredPromptRun(
            monitored_prompt_id=prompt.id,
            llm_provider="p",
            llm_model="m",
            raw_response="r1",
            top_domain="",
            company_domain_rank=1,
            brand_mentioned=True,
            run_at=now - timedelta(minutes=2),
        ),
    )
    r2 = save_monitored_prompt_run(
        db_session,
        MonitoredPromptRun(
            monitored_prompt_id=prompt.id,
            llm_provider="p",
            llm_model="m",
            raw_response="r2",
            top_domain="",
            company_domain_rank=1,
            brand_mentioned=False,
            run_at=now - timedelta(minutes=1),
        ),
    )
    r3 = save_monitored_prompt_run(
        db_session,
        MonitoredPromptRun(
            monitored_prompt_id=prompt.id,
            llm_provider="p",
            llm_model="m",
            raw_response="r3",
            top_domain="",
            company_domain_rank=1,
            brand_mentioned=True,
            run_at=now,
        ),
    )
    updated = update_monitored_prompt(db_session, prompt.id, app_company.id, "p2", 120)
    assert updated is not None
    assert updated.prompt == "p2"
    assert updated.refresh_interval_seconds == 120
    total, runs = get_monitored_prompt_runs(db_session, prompt.id, 0, 2)
    assert total == 3
    assert [runs[0].id, runs[1].id] == [r3.id, r2.id]


@pytest.mark.skipif(settings.license_type != "ce", reason="CE only")
def test_prompts_api(db_session, app_company, api_app) -> None:
    prompt = save_monitored_prompt(
        db_session,
        MonitoredPrompt(
            company_id=app_company.id,
            prompt="p",
            prompt_type="product",
            next_run_at=default_now(),
            created_at=default_now(),
        ),
    )
    assert prompt.id is not None
    run = save_monitored_prompt_run(
        db_session,
        MonitoredPromptRun(
            monitored_prompt_id=prompt.id,
            llm_provider="p",
            llm_model="m",
            raw_response="r1",
            top_domain="",
            company_domain_rank=1,
            brand_mentioned=True,
        ),
    )
    assert run.id is not None
    prompt_id = prompt.id
    run_id = run.id
    db_session.commit()

    client = TestClient(api_app)
    res = client.get(f"/api/v1/prompts/{app_company.id}/{prompt_id}")
    assert res.status_code == 200
    res = client.patch(
        f"/api/v1/prompts/{app_company.id}/{prompt_id}",
        json={"prompt": "p2", "refresh_interval_seconds": 120},
    )
    assert res.status_code == 200
    assert res.json()["prompt"] == "p2"
    res = client.get(
        f"/api/v1/prompts/{app_company.id}/{prompt_id}/runs",
        params={"skip": 0, "limit": 10},
    )
    assert res.status_code == 200
    assert res.json()["total"] == 1
    res = client.get(f"/api/v1/prompts/{app_company.id}/{prompt_id}/runs/{run_id}")
    assert res.status_code == 200
    assert res.json()["raw_response"] == "r1"


@pytest.mark.skipif(settings.license_type != "ce", reason="CE only")
def test_prompt_suggestions_endpoint(monkeypatch, db_session, app_company, api_app) -> None:
    for i in range(8):
        save_monitored_prompt(
            db_session,
            MonitoredPrompt(
                company_id=app_company.id,
                prompt=f"p{i}",
                prompt_type="product",
                next_run_at=default_now(),
                created_at=default_now(),
            ),
        )
    db_session.commit()

    from app.models.llm_costs import LLMCost

    def fake_create(company, guidance: str, limit: int):
        return [f"{guidance}-{i}" for i in range(limit)], LLMCost(
            model="m",
            call_type="prompt_suggestions",
            date=default_now(),
            cost=0,
            tokens_in=0,
            tokens_out=0,
            call_count=1,
        )

    monkeypatch.setattr("app.api.v1.prompts.create_prompts_from_guidance", fake_create)

    client = TestClient(api_app)
    res = client.post(
        f"/api/v1/prompts/{app_company.id}/suggestions",
        json={"guidance": "g"},
    )
    assert res.status_code == 200
