from datetime import datetime

from sqlmodel import BigInteger, Field, SQLModel, UniqueConstraint


class LLMCost(SQLModel, table=True):
    __tablename__ = "llm_costs"  # type: ignore
    __table_args__ = (
        UniqueConstraint("model", "call_type", "date", name="llm_costs_model_call_type_date"),
    )
    id: int | None = Field(default=None, primary_key=True)
    model: str
    call_type: str
    # Rounded to hours
    date: datetime
    # cost in 0.1 of nano-dollar (one ten billionth, 1e-10). Stored as an int
    # to prevent floating point error accumulation. At the time of writing,
    # there are models with $0.01 per million tokens => 1e-8 per token.
    # So we go with 1e-10 to have enough precision for 100x price reduction.
    cost: int = Field(sa_type=BigInteger, default=0)
    call_count: int = Field(default=0)
    tokens_in: int = Field(default=0, sa_column_kwargs={"server_default": "0"})
    tokens_out: int = Field(default=0, sa_column_kwargs={"server_default": "0"})
