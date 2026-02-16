import datetime

from sqlmodel import Field, SQLModel

from app.models.types import default_now
from app.settings import settings


class CompanyBase(SQLModel):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    description: str
    name_aliases: str | None = Field(
        default=None, nullable=True
    )  # serialized json array of strings
    website: str
    llm_understanding: str
    products: str | None = Field(default=None, nullable=True)
    is_placeholder: bool = Field(default=False, index=True)
    created_at: datetime.datetime = Field(default_factory=default_now)
    updated_at: datetime.datetime = Field(default_factory=default_now)


if settings.license_type == "ce":

    class Company(CompanyBase, table=True):
        __tablename__ = "companies"  # type: ignore
