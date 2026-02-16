import datetime
from enum import StrEnum

from sqlmodel import Field, ForeignKey, SQLModel

from app.models.types import default_now


class MonitoredPromptType(StrEnum):
    PRODUCT = "product"
    EXPERTISE = "expertise"


class MonitoredPrompt(SQLModel, table=True):
    __tablename__ = "monitored_prompts"  # type: ignore
    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(
        sa_column_args=(
            ForeignKey(
                "companies.id",
                name="monitored_prompts_company_id_fkey",
                ondelete="CASCADE",
            ),
        ),
        index=True,
        nullable=False,
    )
    prompt: str = Field(nullable=False)
    prompt_type: str = Field(nullable=False)  # e.g. "competitor", "product", "expertise"
    refresh_interval_seconds: int = Field(default=3600 * 24 * 7, nullable=False)
    # 2-letter country code, e.g. "US"
    # https://www.iban.com/country-codes
    target_country: str | None = Field(default=None, nullable=True)
    is_active: bool = Field(
        default=False, nullable=False, sa_column_kwargs={"server_default": "false"}
    )
    last_run_at: datetime.datetime | None = Field(default=None, nullable=True)
    next_run_at: datetime.datetime = Field(default_factory=default_now, nullable=False)
    # When was the celery task created.
    # Used to prevent scheduling multiple tasks for the same prompt
    task_scheduled_at: datetime.datetime | None = Field(default=None, nullable=True)
    created_at: datetime.datetime = Field(default_factory=default_now)


class MonitoredPromptRun(SQLModel, table=True):
    __tablename__ = "monitored_prompt_runs"  # type: ignore
    id: int | None = Field(default=None, primary_key=True)
    monitored_prompt_id: int = Field(
        sa_column_args=(
            ForeignKey(
                "monitored_prompts.id",
                name="monitored_prompt_runs_monitored_prompt_id_fkey",
                ondelete="CASCADE",
            ),
        ),
        index=True,
        nullable=False,
    )
    llm_provider: str = Field(nullable=False)
    llm_model: str = Field(nullable=False)
    run_at: datetime.datetime = Field(default_factory=default_now)
    raw_response: str = Field(nullable=False)  # to be able to reprocess if we need more info
    top_domain: str | None = Field(nullable=True)
    brand_mentioned: bool = Field(nullable=False)
    # If the company's domain is cited in the response,
    # what's the first position it's cited on, 1-based index
    company_domain_rank: int | None = Field(nullable=True)
    mentioned_pages: str | None = Field(
        default=None, nullable=True
    )  # serialized json array of strings (urls)
