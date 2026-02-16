from sqlmodel import Field, ForeignKey, SQLModel, UniqueConstraint


class Competitor(SQLModel, table=True):
    __tablename__ = "competitors"  # type: ignore
    __table_args__ = (UniqueConstraint("company_id", "competitor_id"),)
    id: int | None = Field(default=None, primary_key=True)
    # competitors are directional.
    # E.g. Company A considers company B as competitor does not mean company
    # B considers company A as competitor
    company_id: int | None = Field(
        default=None,
        sa_column_args=(
            ForeignKey("companies.id", name="competitors_company_id_fkey", ondelete="CASCADE"),
        ),
        index=True,
    )
    competitor_id: int | None = Field(
        default=None,
        sa_column_args=(
            ForeignKey(
                "companies.id",
                name="competitors_competitor_id_fkey",
                ondelete="CASCADE",
            ),
        ),
        index=True,
    )
    weight: float = Field(default=1.0)  #  0 - if user marks as non-competitor
