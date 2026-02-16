from importlib import import_module

from app.settings import settings


def noop():
    return 999


def noop_str():
    return ""


def get_available_prompts_count_dep():
    if settings.license_type == "ee":
        module = import_module("app.api.ee.deps")
        return module.get_available_prompts_count
    return noop


def get_min_monitored_prompt_refresh_interval_seconds_dep():
    if settings.license_type == "ee":
        module = import_module("app.api.ee.deps")
        return module.get_min_monitored_prompt_refresh_interval_seconds
    return noop


def get_available_companies_count_dep():
    if settings.license_type == "ee":
        module = import_module("app.api.ee.deps")
        return module.get_available_companies_count
    return noop


def get_available_recommendations_count_dep():
    if settings.license_type == "ee":
        module = import_module("app.api.ee.deps")
        return module.get_available_recommendations_count
    return noop


def get_current_user_name_dep():
    if settings.license_type == "ee":
        module = import_module("app.api.ee.deps")
        return module.get_current_user_name
    return noop_str
