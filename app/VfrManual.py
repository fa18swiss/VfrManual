import datetime
import logging
import requests
from lxml import html
from urllib.parse import urljoin
from typing import Tuple
from .DataFile import DataFile


class VfrManual:

    __URLs = {
        "en": "https://www.skybriefing.com/portal/en/evfr-manual-gen",
        "fr": "https://www.skybriefing.com/portal/fr/evfr-manual-gen",
        "de": "https://www.skybriefing.com/portal/de/evfr-manual-gen",
        "it": "https://www.skybriefing.com/portal/it/evfr-manual-gen"
    }
    __xpath_tr = '//div[@class="portlet-body"]//table/tbody/tr'
    __xpath_date = '//div[@class="portlet-body"]//table/tbody/tr[%d]/td[1]/strong/text()'
    __xpath_link = '//div[@class="portlet-body"]//table/tbody/tr[%d]/td[2]//a/@href'

    data_file: DataFile
    __logger: logging.Logger

    def __init__(self, data_file: DataFile):
        self.data_file = data_file
        self.__logger = logging.getLogger(__name__)

    def check(self) -> bool:
        if not self.data_file.need_update():
            self.__logger.debug("No update need")
            return True
        try:
            parseds = []
            for lang, url in self.__URLs.items():
                response = requests.get(url)
                parsed_body = html.fromstring(response.text)

                tr = parsed_body.xpath(self.__xpath_tr)
                nb_tr = len(tr)
                self.__logger.debug("Nb tr=%d", nb_tr)
                for i in range(nb_tr, 0, -1):
                    dates = parsed_body.xpath(self.__xpath_date % i)
                    links = parsed_body.xpath(self.__xpath_link % i)
                    self.__logger.debug("Raw tr=%d date=%s link=%s", i, dates, links)
                    nb_date = len(dates)
                    nb_link = len(links)

                    if nb_date == 1 and nb_link == 1:
                        date = str(dates[0]).strip()
                        date = " ".join(date.split(" ")[-3:])
                        date = datetime.datetime.strptime(date, "%d %b %Y")
                        date = date.date()
                        date = date.isoformat()
                        link = urljoin(url, links[0])
                        self.__logger.debug("Decoded date=%s link=%s", dates, links)
                        parseds.append((lang, date, link))
                    elif nb_date == 1 and nb_link == 0:
                        self.__logger.warning("No link found i:%d" % i)
                    else:
                        raise Exception("Invalid len i:%d date:%d link:%d" % (i, nb_date, nb_link))

            for lang, date, link in parseds:
                if self.data_file.contains(lang, date):
                    self.__logger.info("Date %s ok for %s", date, lang)
                    self.data_file.touch()
                else:
                    self.__logger.info("Date %s unknown for %s, start downloading %s", date, lang, link)
                    file = requests.get(link)
                    path = self.data_file.path(lang, date)
                    open(path, "wb").write(file.content)
                    self.data_file.add(lang, date)

        except Exception:
            self.__logger.exception("Fail to update", exc_info=True)
        return not self.data_file.need_update()

    def cleanup(self):
        if not self.data_file.need_cleanup():
            self.__logger.debug("No cleanup need")
            return
        try:
            limit = datetime.date.today() - datetime.timedelta(days=130)
            self.__logger.info("clean limit %s", limit)
            data = self.data_file.all()
            to_delete: list[Tuple[str, str]] = list()
            for key in data:
                key_date = datetime.date.fromisoformat(key)
                if key_date > limit:
                    continue
                for lang in data[key]:
                    to_delete.append((key, lang))
            for date, lang in to_delete:
                self.data_file.remove(lang, date)
                self.__logger.info("Remove date:%s lang:%s", date, lang)
            self.data_file.cleanup()
        except:
            self.__logger.exception("Fail to update", exc_info=True)
