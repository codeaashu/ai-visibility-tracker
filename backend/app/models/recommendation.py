import datetime

from sqlmodel import Field, SQLModel

from app.models.types import default_now


class Recommendation(SQLModel, table=True):
    __tablename__ = "recommendations"  # type: ignore
    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(
        foreign_key="companies.id", nullable=False, index=True, ondelete="CASCADE"
    )
    competitor_domain: str = Field(nullable=False, index=True)
    # List of prompts to analyze, as serialized json array of strings.
    # Not ids, since user can delete prompts to add new ones, but recommendation
    # should still be valid.
    prompts_to_analyze: str = Field()
    why_competitor: str | None = Field(default=None)
    why_not_user: str | None = Field(default=None)
    what_to_do: str | None = Field(default=None)
    created_at: datetime.datetime = Field(default_factory=default_now)
    completed_at: datetime.datetime | None = Field(default=None)
