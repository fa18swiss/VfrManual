import datetime
import logging
import os
import os.path
import json


class DataFile:
    delta: datetime.timedelta
    __dir: str
    __extension: str
    __items: list
    __last_check: datetime.datetime
    __logger: logging.Logger

    def __init__(self, directory, delta=None, extension=".pdf"):
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
                self.__last_check = datetime.datetime.fromisoformat(content["LastCheck"])
                self.__items = content["Items"]
        else:
            self.__last_check = None
            self.__items = list()

    def __contains__(self, item):
        return item in self.__items

    def __save(self):
        content = {
            "LastCheck": self.__last_check.isoformat(),
            "Items": self.__items
        }
        with open(self.__file, 'w') as f:
            json.dump(content, f, indent=2)

    def add(self, item):
        if self.__contains__(item):
            return
        self.__items.append(item)
        self.__items.sort(reverse=True)
        self.touch()

    def touch(self):
        self.__last_check = datetime.datetime.now()
        self.__save()

    def path(self, item):
        return os.path.join(self.__dir, item+self.__extension)

    def last(self):
        if len(self.__items) <= 0:
            return None
        return self.__items[0]

    def last_check(self):
        return self.__last_check.isoformat()

    def need_update(self):
        if self.__last_check is None:
            return True
        self.__logger.debug("Delta is %s", self.delta)
        return self.__last_check + self.delta < datetime.datetime.now()
