import datetime


def utc_now() -> datetime.datetime:
    date = datetime.datetime.now(tz=datetime.timezone.utc)
    print(date.tzinfo)
    return date


def to_string(date: datetime.datetime) -> str:
    print(date.tzinfo)
    res = date.isoformat(timespec="seconds")
    if res.endswith("+00:00") and (date.tzinfo is None or date.tzinfo == datetime.timezone.utc):
        res = res[:-6]+"Z"
    return res


def parse_string(string: str) -> datetime.datetime:
    if string.endswith("Z"):
        string = string[:-1]
        utc = True
    else:
        utc = False
    date = datetime.datetime.fromisoformat(string)
    if utc:
        date = date.replace(tzinfo=datetime.timezone.utc)
    print(date.tzinfo)
    return date
