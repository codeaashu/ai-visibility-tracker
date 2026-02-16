from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.crud.company import add_competitor
from app.crud.dashboard import get_dashboard_stats, get_prompts_citing_domain
from app.crud.prompts import (
    save_monitored_prompt,
    save_monitored_prompt_run,
)
from app.models import MonitoredPrompt, MonitoredPromptRun
from app.models.types import default_now


@pytest.fixture
def _setup_data(db_session: Session, app_company) -> int:
    add_competitor(db_session, app_company, "Rival", "https://rival.com")
    mp1 = save_monitored_prompt(
        db_session,
        MonitoredPrompt(
            company_id=app_company.id,
            prompt="p1",
            prompt_type="product",
            target_country="US",
            is_active=True,
            next_run_at=default_now(),
            created_at=default_now(),
        ),
    )
    assert mp1.id is not None
    mp2 = save_monitored_prompt(
        db_session,
        MonitoredPrompt(
            company_id=app_company.id,
            prompt="p2",
            prompt_type="product",
            target_country="US",
            is_active=True,
            next_run_at=default_now(),
            created_at=default_now(),
        ),
    )
    assert mp2.id is not None
    mp3 = save_monitored_prompt(
        db_session,
        MonitoredPrompt(
            company_id=app_company.id,
            prompt="p3",
            prompt_type="product",
            target_country="US",
            is_active=True,
            next_run_at=default_now(),
            created_at=default_now(),
        ),
    )
    assert mp3.id is not None
    save_monitored_prompt_run(
        db_session,
        MonitoredPromptRun(
            monitored_prompt_id=mp1.id,
            llm_provider="openai",
            llm_model="m",
            run_at=default_now(),
            raw_response="r",
            mentioned_pages='["https://example.com"]',
            top_domain="example.com",
            brand_mentioned=True,
            company_domain_rank=1,
        ),
    )
    save_monitored_prompt_run(
        db_session,
        MonitoredPromptRun(
            monitored_prompt_id=mp2.id,
            llm_provider="openai",
            llm_model="m",
            run_at=default_now(),
            raw_response="r",
            mentioned_pages='["https://rival.com"]',
            top_domain="rival.com",
            brand_mentioned=False,
            company_domain_rank=None,
        ),
    )
    save_monitored_prompt_run(
        db_session,
        MonitoredPromptRun(
            monitored_prompt_id=mp3.id,
            llm_provider="openai",
            llm_model="m",
            run_at=default_now(),
            raw_response="r",
            mentioned_pages='["https://other.com"]',
            top_domain="other.com",
            brand_mentioned=True,
            company_domain_rank=None,
        ),
    )
    assert app_company.id is not None
    return app_company.id


def test_get_dashboard_stats(db_session, _setup_data) -> None:
    company_id = _setup_data
    stats = get_dashboard_stats(db_session, company_id)
    assert stats.ai_visibility_score == pytest.approx(2 / 3)
    assert stats.website_citation_share == pytest.approx(1 / 3)
    types = {item.domain: item.type for item in stats.share_of_voice}
    assert types["example.com"] == "company"
    assert types["rival.com"] == "competitor"
    assert types["other.com"] == "other"


def test_dashboard_endpoint(_setup_data, api_app) -> None:
    company_id = _setup_data
    client = TestClient(api_app)
    res = client.get(f"/api/v1/dashboard/{company_id}")
    assert res.status_code == 200
    assert res.json()["ai_visibility_score"] == pytest.approx(2 / 3)


def test_get_prompts_citing_domain(db_session, _setup_data) -> None:
    company_id = _setup_data
    total, items = get_prompts_citing_domain(db_session, company_id, "rival.com", 0, 10)
    assert total == 1
    assert items[0].prompt == "p2"


def test_share_of_voice_endpoint(_setup_data, api_app) -> None:
    company_id = _setup_data
    client = TestClient(api_app)
    res = client.get(f"/api/v1/dashboard/{company_id}/share_of_voice/rival.com")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["prompt"] == "p2"
