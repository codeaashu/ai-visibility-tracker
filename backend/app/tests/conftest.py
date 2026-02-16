from .fixtures import *  # noqa
from app.settings import settings

if settings.license_type == "ee":
    from .ee.fixtures import *  # noqa

settings.admin_notification_channel = ""
settings.admin_token = "test-token"
settings.smtp_host = ""
settings.require_email_verification = False
