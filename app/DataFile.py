import datetime
import logging
import os
import os.path
import json
from . import DateUtils


class DataFile:
    delta: datetime.timedelta
    __dir: str
    __extension: str
    __items: dict
    __last_check: datetime.datetime
    __logger: logging.Logger

    def __init__(self, directory: str, delta: datetime.timedelta = None, extension: str = ".pdf"):
        if delta is None:
            delta = datetime.timedelta(hours=1)
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

    def __contains__(self, item):
        raise NotImplementedError()

    def contains(self, lang, date):
        if date in self.__items:
            return lang in self.__items[date]
        else:
            return False

    def __save(self):
        content = {
            "LastCheck": DateUtils.to_string(self.__last_check),
            "Items": self.__items
        }
        with open(self.__file, 'w') as f:
            json.dump(content, f, indent=2)

    def add(self, lang, date):
        if self.contains(lang, date):
            return
        if date in self.__items:
            item = self.__items[date]
        else:
            item = list()
            self.__items[date] = item
        item.append(lang)
        self.touch()

    def touch(self):
        self.__last_check = DateUtils.utc_now()
        self.__save()

    def all(self):
        return {k: v for (k, v) in self.__items.items()}

    def path(self, lang, date):
        return os.path.join(self.__dir, date + "_" + lang + self.__extension)

    def last(self):
        if len(self.__items) <= 0:
            return None
        keys = list(self.__items.keys())
        keys.sort(reverse=True)
        key = keys[0]
        return key, self.__items[key]

    def last_check(self):
        return DateUtils.to_string(self.__last_check)

    def need_update(self):
        self.__logger.debug("Delta is %s", self.delta)
        return self.__last_check + self.delta < DateUtils.utc_now()
