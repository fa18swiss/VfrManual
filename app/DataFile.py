import datetime
import logging
import os
import os.path
import json
from typing import Optional
from . import DateUtils


class DataFile:
    delta: datetime.timedelta
    cleanup_delta: datetime.timedelta
    __dir: str
    __extension: str
    __items: dict[str, list[str]]
    __last_check: datetime.datetime
    __last_cleanup: datetime.datetime
    __logger: logging.Logger

    def __init__(self, directory: str, delta: datetime.timedelta, cleanup_delta: datetime.timedelta,
                 extension: str = ".pdf"):
        self.__logger = logging.getLogger(__name__)
        self.__dir = directory
        self.__extension = extension
        self.delta = delta
        self.cleanup_delta = cleanup_delta
        self.__file = os.path.join(self.__dir, "_.json")
        os.makedirs(self.__dir, exist_ok=True)
        if os.path.isfile(self.__file):
            with open(self.__file, 'r') as f:
                content = json.load(f)
                self.__last_check = DateUtils.parse_string(content["LastCheck"])
                if "LastCleanup" in content:
                    self.__last_cleanup = DateUtils.parse_string(content["LastCleanup"])
                else:
                    self.__last_cleanup = datetime.datetime(1900, 1, 1, tzinfo=datetime.timezone.utc)
                self.__items = content["Items"]
        else:
            self.__last_check = datetime.datetime(1900, 1, 1, tzinfo=datetime.timezone.utc)
            self.__last_cleanup = datetime.datetime(1900, 1, 1, tzinfo=datetime.timezone.utc)
            self.__items = dict()

    def __contains__(self, item) -> bool:
        raise NotImplementedError()

    def contains(self, lang: str, date: str) -> bool:
        if date in self.__items:
            return lang in self.__items[date]
        else:
            return False

    def __save(self):
        content = {
            "LastCheck": DateUtils.to_string(self.__last_check),
            "LastCleanup": DateUtils.to_string(self.__last_cleanup),
            "Items": self.__items
        }
        with open(self.__file, 'w') as f:
            json.dump(content, f, indent=2)

    def add(self, lang: str, date: str):
        if self.contains(lang, date):
            return
        if date in self.__items:
            item = self.__items[date]
        else:
            item = list()
            self.__items[date] = item
        item.append(lang)
        self.__save()

    def remove(self, lang: str, date: str):
        path = self.path(lang, date)
        if os.path.exists(path):
            try:
                os.remove(path)
            except:
                self.__logger.exception(f"Fail to delete path {path}", exc_info=True)
        if not self.contains(lang, date):
            return
        item = self.__items[date]
        item.remove(lang)
        if len(item) <= 0:
            del self.__items[date]
        self.__save()

    def touch(self):
        self.__last_check = DateUtils.utc_now()
        self.__save()

    def cleanup(self):
        self.__last_cleanup = DateUtils.utc_now()
        self.__save()

    def all(self) -> dict[str, list[str]]:
        return {k: v for (k, v) in self.__items.items()}

    def path(self, lang: str, date: str) -> str:
        return os.path.join(self.__dir, f"{date}_{lang}{self.__extension}")

    def last(self) -> Optional[tuple[str, list[str]]]:
        if len(self.__items) <= 0:
            return None
        keys = list(self.__items.keys())
        keys.sort(reverse=True)
        key = keys[0]
        return key, self.__items[key]

    def last_check(self) -> str:
        return DateUtils.to_string(self.__last_check)

    def last_cleanup(self) -> str:
        return DateUtils.to_string(self.__last_cleanup)

    def need_update(self) -> bool:
        next_check = self.__last_check + self.delta
        self.__logger.debug("__last_check:'%s' delta:'%s' next_check:'%s' now:'%s'", self.__last_check, self.delta,
                            next_check, DateUtils.utc_now())
        return next_check < DateUtils.utc_now()

    def need_cleanup(self) -> bool:
        self.__logger.debug("Cleanup delta is %s", self.cleanup_delta)
        return self.__last_cleanup + self.cleanup_delta < DateUtils.utc_now()
