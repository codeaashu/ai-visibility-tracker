from importlib import import_module

from app.settings import settings

from .fetch_status import FetchStatus as FetchStatus


def get_fetcher(name: str):
    module = import_module(f"app.fetchers.{name}")
    return module.fetch


def fetch_url(url: str):
    return get_fetcher(settings.fetcher)(url)
