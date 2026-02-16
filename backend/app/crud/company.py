from collections.abc import Sequence
from urllib.parse import urlparse

from sqlmodel import Session, col, func, select

from app.models import Company, CompanyCrawl, Competitor
from app.models.types import default_now


def get_company_by_id(db: Session, company_id: int) -> Company | None:
    return db.exec(select(Company).where(Company.id == company_id)).first()


def get_companies(db: Session) -> Sequence[Company]:
    statement = select(Company).where(
        col(Company.is_placeholder).is_(False),
    )
    return db.exec(statement).all()


def save_company(db: Session, company: Company):
    if company.website:
        parsed = urlparse(company.website)
        company.website = company.website if parsed.scheme else f"https://{company.website}"
    if company.id is not None:
        company = db.merge(company)
    else:
        db.add(company)
    db.flush()
    db.refresh(company)
    return company


def save_company_crawl(db: Session, company_crawl: CompanyCrawl):
    if company_crawl.id is not None:
        company_crawl = db.merge(company_crawl)
    else:
        db.add(company_crawl)
    db.flush()
    db.refresh(company_crawl)
    return company_crawl


def get_latest_company_crawl(db: Session, company_id: int) -> CompanyCrawl | None:
    statement = (
        select(CompanyCrawl)
        .where(CompanyCrawl.company_id == company_id)
        .order_by(col(CompanyCrawl.created_at).desc())
    )
    return db.exec(statement).first()


def delete_company_by_id(db: Session, company_id: int):
    company = get_company_by_id(db, company_id)
    if company is None:
        return
    db.delete(company)
    db.flush()


def list_competitors(db: Session, company_id: int) -> Sequence[Company]:
    statement = (
        select(Company)
        .join(Competitor, col(Competitor.competitor_id) == Company.id)
        .where(Competitor.company_id == company_id)
    )
    return db.exec(statement).all()


def add_competitor(db: Session, company: Company, name: str, website: str | None) -> Company:
    competitor_company = Company(
        name=name,
        description="",
        name_aliases=None,
        website=website or "",
        llm_understanding="",
        is_placeholder=True,
        created_at=default_now(),
        updated_at=default_now(),
    )
    competitor_company = save_company(db, competitor_company)
    assert competitor_company.id is not None
    relation = Competitor(company_id=company.id, competitor_id=competitor_company.id)
    db.add(relation)
    db.flush()
    return competitor_company


def delete_competitor(db: Session, company_id: int, competitor_id: int):
    relation = db.exec(
        select(Competitor).where(
            Competitor.company_id == company_id,
            Competitor.competitor_id == competitor_id,
        )
    ).first()
    if relation is None:
        return
    db.delete(relation)
    db.flush()
    competitor = get_company_by_id(db, competitor_id)
    if competitor is None:
        return
    count = db.exec(select(func.count()).where(Competitor.competitor_id == competitor_id)).one()
    if count == 0 and getattr(competitor, "is_placeholder", False):
        db.delete(competitor)
        db.flush()
