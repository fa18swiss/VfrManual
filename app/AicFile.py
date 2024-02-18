import datetime
import logging
import os
import os.path
import json
from typing import Optional
from . import DateUtils


class AicFile:
    delta: datetime.timedelta
    cleanup_delta: datetime.timedelta
    __KEY = "key"
    __LANG = "lang"
    __CODE = "code"
    __TEXT = "text"
    __dir: str
    __extension: str
    __items: dict[str, dict[str, str]]
    __last_check: datetime.datetime
    __logger: logging.Logger

    def __init__(self, directory: str, delta: datetime.timedelta, extension: str = ".pdf"):
        self.__logger = logging.getLogger(__name__)
        self.__dir = directory
        self.__extension = extension
        self.delta = delta
        self.__file = os.path.join(self.__dir, "_.json")
        os.makedirs(self.__dir, exist_ok=True)
        if os.path.isfile(self.__file):
            with open(self.__file, 'r') as f:
                content = json.load(f)
                self.__last_check = DateUtils.parse_string(content["LastCheck"])
                self.__items = content["Items"]
        else:
            self.__last_check = datetime.datetime(1900, 1, 1, tzinfo=datetime.timezone.utc)
            self.__items = dict()

    def __contains__(self, item) -> bool:
        raise NotImplementedError()

    def contains(self, code: str) -> bool:
        return code in self.__items

    def __save(self):
        content = {
            "LastCheck": DateUtils.to_string(self.__last_check),
            "Items": self.__items
        }
        with open(self.__file, 'w') as f:
            json.dump(content, f, indent=2)

    def add(self, key: str, lang: str, code: str, text: str):
        item = dict()
        item[self.__LANG] = lang
        item[self.__CODE] = code
        item[self.__TEXT] = text
        self.__items[key] = item
        self.__save()

    def remove(self, key: str):
        path = self.path(key)
        if os.path.exists(path):
            try:
                os.remove(path)
            except:
                self.__logger.exception(f"Fail to delete path {path}", exc_info=True)
        del self.__items[key]
        self.__save()

    def touch(self):
        self.__last_check = DateUtils.utc_now()
        self.__save()

    def all(self) -> dict[str, str]:
        return {k: v for (k, v) in self.__items.items()}

    def all_sorted(self) -> list[dict[str, str]]:
        return [self.__item_full(k, v) for (k, v) in sorted(self.__items.items(), reverse=True)]

    def __item_full(self, key: str, item: dict[str, str]) -> dict[str, str]:
        copy = item.copy()
        copy[self.__KEY] = key
        return copy

    def keys(self) -> list[str]:
        return list(self.__items.keys())

    def path(self, code: str) -> str:
        return os.path.join(self.__dir, f"{code}{self.__extension}")

    def last_check(self) -> str:
        return DateUtils.to_string(self.__last_check)

    def need_update(self) -> bool:
        next_check = self.__last_check + self.delta
        self.__logger.debug("__last_check:'%s' delta:'%s' next_check:'%s' now:'%s'", self.__last_check, self.delta,
                            next_check, DateUtils.utc_now())
        return next_check < DateUtils.utc_now()
