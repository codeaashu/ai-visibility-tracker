import logging

from app.crud.company import (
    get_company_by_id,
    get_latest_company_crawl,
    save_company,
    save_company_crawl,
)
from app.crud.llm_costs import save_cost
from app.db import get_celery_db
from app.fetchers import FetchStatus, fetch_url
from app.llm.company_crawl import create_site_summary
from app.models import CompanyCrawl
from app.settings import settings
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="fetchers.company_crawl",
    acks_late=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=settings.celery_max_retries,
)
def fetch_company_crawl(company_id: int):
    logger.info(f"Company crawl for company_id={company_id}")
    with get_celery_db() as db:
        company = get_company_by_id(db, company_id)
        if company is None:
            logger.error(f"Can't find company with id {company_id}")
            return
        url = company.website
        if url is None:
            logger.error(f"Company {company_id} has no website")
            return
        crawl = get_latest_company_crawl(db, company_id)
        if crawl is None or crawl.crawl_status != FetchStatus.PENDING.value:
            # No scheduled crawl
            crawl = CompanyCrawl(
                company_id=company_id,
                url=url,
                crawl_status=FetchStatus.IN_PROGRESS.value,
                raw_response="",
            )
        else:
            crawl.crawl_status = FetchStatus.IN_PROGRESS.value
        crawl = save_company_crawl(db, crawl)
        db.expunge(crawl)

    status, content = fetch_url(url)
    if status != FetchStatus.SUCCESS:
        with get_celery_db() as db:
            crawl.crawl_status = status.value
            crawl.raw_response = content or ""
            save_company_crawl(db, crawl)
        logger.error(
            f"Failed to crawl company(id={company_id}) with url '{url}', status={status.value}"
        )
        return

    logger.info(f"Extracting data from company(id={company_id}) website...")
    summary, cost_summary = create_site_summary(content)
    logger.info(f"Saving data for company(id={company_id})...")
    with get_celery_db() as db:
        if cost_summary is not None:
            save_cost(db, cost_summary)
        company = get_company_by_id(db, company_id)
        if company is None:
            logger.error(f"Can't find company(id={company_id})")
            return
        company.name = summary.company_name
        company.description = summary.company_description or ""
        company.llm_understanding = summary.model_dump_json()
        company.products = "\n".join(f"- {product}" for product in summary.main_products)
        save_company(db, company)
        crawl.crawl_status = FetchStatus.SUCCESS.value
        crawl.raw_response = content
        save_company_crawl(db, crawl)
    logger.info(f"Finished company(id={company_id}) crawl.")
