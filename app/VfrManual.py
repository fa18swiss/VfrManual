import datetime
import logging
import requests
from lxml import html
from urllib.parse import urljoin
from .DataFile import DataFile


class VfrManual:

    __URLs = {
        "en": "https://www.skybriefing.com/portal/en/evfr-manual-gen",
        "fr": "https://www.skybriefing.com/portal/fr/evfr-manual-gen",
        "de": "https://www.skybriefing.com/portal/de/evfr-manual-gen",
        "it": "https://www.skybriefing.com/portal/it/evfr-manual-gen"
    }

    data_file: DataFile
    __logger: logging.Logger

    def __init__(self, data_file):
        self.data_file = data_file
        self.__logger = logging.getLogger(__name__)

    def check(self):
        if not self.data_file.need_update():
            self.__logger.debug("No update need")
            return
        try:
            parseds = []
            for lang, url in self.__URLs.items():
                response = requests.get(url)
                parsed_body = html.fromstring(response.text)
                xpath_date = '//*[@id="column-1"]/table/tbody/tr/td[1]/strong/span'
                xpath_link = '//*[@id="column-1"]/table/tbody/tr/td[4]//a/@href'

                dates = parsed_body.xpath(xpath_date)
                links = parsed_body.xpath(xpath_link)

                self.__logger.debug("Raw dates=%s links=%s", dates, links)

                if len(dates) != len(links):
                    raise Exception("Invalid len date:%d link:%d" % (len(dates), len(links)))

                for i in range(len(dates) - 1, -1, -1):
                    date = dates[i].text_content().strip()
                    date = " ".join(date.split(" ")[-3:])
                    date = datetime.datetime.strptime(date, "%d %b %Y")
                    date = date.date()
                    date = date.isoformat()
                    link = urljoin(url, links[i])

                    self.__logger.debug("Decoded date=%s link=%s", date, link)
                    parseds.append((lang, date, link))

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
