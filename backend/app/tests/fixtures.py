from contextlib import contextmanager

import pytest
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.engine.base import Engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel

from app.api.router import get_api_router
from app.crud.company import save_company
from app.db import get_db_dep
from app.models import Company
from app.models.types import default_now
from app.settings import settings


@pytest.fixture()
def db_engine() -> Engine:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture()
def db_session(db_engine):
    session = Session(db_engine)
    session.info["skip_tenant"] = True
    try:
        yield session
    finally:
        session.close()


def create_company(
    db_session,
    name="c",
    description="",
    website="https://example.com",
    llm_understanding="",
):
    params = {
        "name": name,
        "description": description,
        "website": website,
        "llm_understanding": llm_understanding,
        "created_at": default_now(),
        "updated_at": default_now(),
    }
    company = save_company(
        db_session,
        Company(**params),
    )
    assert company.id is not None
    db_session.expunge(company)
    return company


@pytest.fixture()
def app_company(db_session):
    return create_company(db_session)


@pytest.fixture()
def api_app(db_session, mocker, db_engine):
    @contextmanager
    def get_db():
        session = Session(db_engine)
        try:
            yield session
            session.commit()
        finally:
            session.close()

    def get_db_dep_():
        return db_session

    app = FastAPI()
    app.include_router(get_api_router(), prefix=settings.api_v1_str)

    app.dependency_overrides[get_db_dep] = get_db_dep_
    return app
