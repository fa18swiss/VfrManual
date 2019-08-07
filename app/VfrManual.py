import datetime
import logging
import requests
from lxml import html
from urllib.parse import urljoin
from .DataFile import DataFile


class VfrManual:
    __URL = "https://www.skybriefing.com/portal/evfr-manual-gen"
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
            response = requests.get(self.__URL)
            parsed_body = html.fromstring(response.text)
            xpath_date = '//*[@id="column-1"]/table/tbody/tr/td[1]/strong/span'
            xpath_link = '//*[@id="column-1"]/table/tbody/tr/td[4]/a/@href'

            date = parsed_body.xpath(xpath_date)
            link = parsed_body.xpath(xpath_link)

            self.__logger.debug("Raw date=%s link=%s", date, link)

            date = date[0].text_content().strip()
            date = " ".join(date.split(" ")[-3:])
            date = datetime.datetime.strptime(date, "%d %b %Y")
            date = date.date()
            date = date.isoformat()
            link = urljoin(self.__URL, link[0])

            self.__logger.debug("Decoded date=%s link=%s", date, link)

            if date in self.data_file:
                self.__logger.info("Date %s ok", date)
                self.data_file.touch()
            else:
                self.__logger.info("Date %s unknown, start downloading %s", date, link)
                file = requests.get(link)
                path = self.data_file.path(date)
                open(path, "wb").write(file.content)
                self.data_file.add(date)
        except Exception:
            self.__logger.exception("Fail to update", exc_info=True)
