from alembic import op
from sqlalchemy import text


def add_missing_enum_value(enum_name: str, value: str) -> None:
    res = op.get_bind().execute(
        text(f"""SELECT count(*) as cnt FROM pg_enum AS enum
        JOIN pg_type AS type
        ON (type.oid = enum.enumtypid)
        where type.typname = '{enum_name}' and enum.enumlabel = '{value}'
    """)
    )
    count = res.scalar()
    if count == 0:
        op.execute(f"""ALTER TYPE {enum_name} ADD VALUE '{value}'""")
