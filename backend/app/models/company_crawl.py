import datetime

from sqlmodel import Field, ForeignKey, SQLModel

from app.models.types import default_now


class CompanyCrawl(SQLModel, table=True):
    __tablename__ = "company_crawls"  # type: ignore
    id: int | None = Field(default=None, primary_key=True)
    company_id: int | None = Field(
        default=None,
        sa_column_args=(ForeignKey("companies.id", ondelete="CASCADE"),),
        index=True,
    )
    url: str
    crawl_status: str
    raw_response: str
    created_at: datetime.datetime = Field(default_factory=default_now)
