from datetime import timedelta

from fastapi.testclient import TestClient

from app.crud.prompts import (
    get_company_prompt_stats,
    save_monitored_prompt,
    save_monitored_prompt_run,
)
from app.models import MonitoredPrompt, MonitoredPromptRun
from app.models.types import default_now


def test_get_company_prompt_stats(db_session, app_company) -> None:
    now = default_now()
    p1 = save_monitored_prompt(
        db_session,
        MonitoredPrompt(
            company_id=app_company.id,
            prompt="p1",
            prompt_type="product",
            is_active=True,
            created_at=now,
            next_run_at=now,
        ),
    )
    assert p1.id is not None
    p2 = save_monitored_prompt(
        db_session,
        MonitoredPrompt(
            company_id=app_company.id,
            prompt="p2",
            prompt_type="product",
            is_active=False,
            created_at=now - timedelta(seconds=1),
            next_run_at=now,
        ),
    )
    assert p2.id is not None
    p3 = save_monitored_prompt(
        db_session,
        MonitoredPrompt(
            company_id=app_company.id,
            prompt="p3",
            prompt_type="product",
            is_active=True,
            created_at=now - timedelta(seconds=2),
            next_run_at=now,
        ),
    )
    assert p3.id is not None
    save_monitored_prompt_run(
        db_session,
        MonitoredPromptRun(
            monitored_prompt_id=p1.id,
            llm_provider="openai",
            llm_model="m",
            raw_response="r",
            top_domain="example.com",
            company_domain_rank=None,
            brand_mentioned=True,
        ),
    )
    save_monitored_prompt_run(
        db_session,
        MonitoredPromptRun(
            monitored_prompt_id=p1.id,
            llm_provider="gemini",
            llm_model="m",
            raw_response="r",
            top_domain="example.com",
            company_domain_rank=None,
            brand_mentioned=False,
        ),
    )
    save_monitored_prompt_run(
        db_session,
        MonitoredPromptRun(
            monitored_prompt_id=p2.id,
            llm_provider="openai",
            llm_model="m",
            raw_response="r",
            top_domain="example.com",
            company_domain_rank=1,
            brand_mentioned=False,
        ),
    )
    total, items = get_company_prompt_stats(db_session, app_company.id, 0, 10)
    assert total == 3
    assert [i.id for i in items] == [p1.id, p2.id, p3.id]
    assert items[0].openai_last_result is True
    assert items[0].gemini_last_result is False
    assert items[0].visibility == 0.5
    assert items[1].openai_last_result is True
    assert items[1].gemini_last_result is None
    assert items[1].visibility == 0.0
    assert items[2].openai_last_result is None
    assert items[2].gemini_last_result is None
    assert items[2].visibility == 0.0


def test_prompt_monitoring_api(db_session, app_company, api_app) -> None:
    prompt = save_monitored_prompt(
        db_session,
        MonitoredPrompt(
            company_id=app_company.id,
            prompt="p",
            prompt_type="product",
            target_country="US",
            next_run_at=default_now(),
            created_at=default_now(),
        ),
    )
    assert prompt.id is not None
    company_id = app_company.id
    prompt_id = prompt.id
    db_session.commit()

    client = TestClient(api_app)
    res = client.get(f"/api/v1/prompts/{company_id}/stats")
    assert res.status_code == 200
    assert res.json()["total"] == 1
    res = client.patch(
        f"/api/v1/prompts/{company_id}/activation",
        json={"ids": [prompt_id], "is_active": True},
    )
    assert res.status_code == 200
    stored = db_session.get(MonitoredPrompt, prompt_id)
    assert stored is not None
    assert stored.is_active is True
    res = client.request(
        "DELETE",
        f"/api/v1/prompts/{company_id}/bulk",
        json={"ids": [prompt_id]},
    )
    assert res.status_code == 200
    assert db_session.get(MonitoredPrompt, prompt_id) is None
