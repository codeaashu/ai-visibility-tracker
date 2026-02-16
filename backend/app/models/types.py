import datetime
from functools import partial

default_now = partial(datetime.datetime.now, datetime.UTC)
