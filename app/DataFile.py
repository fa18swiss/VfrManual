import datetime
import os
import os.path
import json


class DataFile:
    __dir: str
    __extension: str
    __delta: datetime.timedelta
    __last_check = datetime.datetime
    __items: list

    def __init__(self, directory, delta=None, extension=".pdf"):
        if delta is None:
            delta = datetime.timedelta(seconds=5)
        self.__dir = directory
        self.__extension = extension
        self.__delta = delta
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
        return self.__last_check + self.__delta < datetime.datetime.now()
