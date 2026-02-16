from datetime import UTC, datetime

from sqlalchemy.dialects import postgresql

from app.models.llm_costs import LLMCost


def save_cost(db, cost: LLMCost):
    date_rounded = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
    dialect = db.bind.dialect.name
    if dialect != "postgresql" and dialect != "sqlite":
        raise ValueError(f"Unsupported dialect: {dialect}")
    statement = (
        postgresql.insert(LLMCost)
        .values(
            model=cost.model,
            call_type=cost.call_type,
            date=date_rounded,
            cost=cost.cost,
            tokens_in=cost.tokens_in,
            tokens_out=cost.tokens_out,
            call_count=1,
        )
        .on_conflict_do_update(
            index_elements=["model", "call_type", "date"],
            set_={
                "cost": LLMCost.cost + cost.cost,
                "tokens_in": LLMCost.tokens_in + cost.tokens_in,
                "tokens_out": LLMCost.tokens_out + cost.tokens_out,
                "call_count": LLMCost.call_count + 1,
            },
        )
    )
    db.connection().execute(statement)
    # Explicit commit, since cost should be tracked even if we'd get an exception
    db.commit()
