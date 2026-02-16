from app.crud.company import (
    add_competitor,
    delete_competitor,
    get_companies,
    list_competitors,
)
from app.crud.prompts import (
    delete_monitored_prompt,
    get_company_prompts,
    save_monitored_prompt,
)
from app.models.monitored_prompt import MonitoredPrompt
from app.models.types import default_now


def test_competitor_crud(db_session, app_company) -> None:
    competitor = add_competitor(db_session, app_company, "Other", "other.example")
    assert competitor.website == "https://other.example"
    competitors = list_competitors(db_session, app_company.id)
    assert len(competitors) == 1
    assert competitors[0].website == "https://other.example"
    competitor_id = competitors[0].id
    assert competitor_id is not None
    delete_competitor(db_session, app_company.id, competitor_id)
    assert list_competitors(db_session, app_company.id) == []
    companies = get_companies(db_session)
    assert len(companies) == 1


def test_prompt_crud(db_session, app_company) -> None:
    mp = save_monitored_prompt(
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
    assert mp.id is not None
    assert len(get_company_prompts(db_session, app_company.id)) == 1
    delete_monitored_prompt(db_session, mp.id)
    assert get_company_prompts(db_session, app_company.id) == []
