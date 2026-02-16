from contextlib import contextmanager

from sqlalchemy import NullPool
from sqlmodel import Session, create_engine

from app.settings import settings

is_sqlite = "sqlite" in str(settings.db_dsn).lower()
if is_sqlite:
    # https://docs.python.org/3/library/sqlite3.html#transaction-control-via-the-autocommit-attribute
    engine = create_engine(
        str(settings.db_dsn),
        echo=settings.sqlalchemy_echo,
        connect_args={"autocommit": False, "timeout": 20},
        poolclass=NullPool,
    )
else:
    engine = create_engine(
        str(settings.db_dsn),
        pool_pre_ping=True,
        isolation_level="READ COMMITTED",
        echo=settings.sqlalchemy_echo,
    )


@contextmanager
def get_db():
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@contextmanager
def get_celery_db():
    session = Session(engine)
    try:
        session.info["skip_tenant"] = True
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db_dep():
    with get_db() as db:
        yield db
