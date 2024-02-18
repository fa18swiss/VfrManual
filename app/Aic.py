import logging
import requests
from lxml import html
from urllib.parse import urljoin
from .AicFile import AicFile


class Aic:
    data_file: AicFile
    _url: dict[str, str]
    __logger: logging.Logger
    __xpath_tr = '//div[@class="portlet-body"]//table/tbody/tr'
    __xpath_code = '//div[@class="portlet-body"]//table/tbody/tr[%d]/td[1]/text()'
    __xpath_text = '//div[@class="portlet-body"]//table/tbody/tr[%d]/td[2]/text()'
    __xpath_link = '//div[@class="portlet-body"]//table/tbody/tr[%d]/td[3]//a/@href'

    def __init__(self, data_file: AicFile, logger: logging.Logger):
        self.data_file = data_file
        self.__logger = logger

    def check(self) -> bool:
        if not self.data_file.need_update():
            self.__logger.debug("No update need")
            return True
        try:
            existing_keys = self.data_file.keys()
            for lang, url in self._url.items():
                response = requests.get(url)
                parsed_body = html.fromstring(response.text)
                tr = parsed_body.xpath(self.__xpath_tr)
                nb_tr = len(tr)
                self.__logger.debug("lang=%s Nb tr=%d", lang, nb_tr)
                for i in range(nb_tr, 0, -1):
                    codes = parsed_body.xpath(self.__xpath_code % i)
                    texts = parsed_body.xpath(self.__xpath_text % i)
                    links = parsed_body.xpath(self.__xpath_link % i)
                    self.__logger.debug("Raw lang=%s tr=%d codes=%s texts=%s links=%s", lang, i, codes, texts, links)
                    nb_code = len(codes)
                    nb_text = len(texts)
                    nb_link = len(links)
                    if nb_code == 1 and nb_text and nb_link == 1:
                        code = str(codes[0])
                        text = str(texts[0])
                        link = urljoin(url, links[0])
                        key = self.__extract_key(code, lang)
                        self.__logger.debug("Decoded lang=%s key=%s code=%s text=%s link=%s",
                                            lang, key, code, text, link)
                        if key in existing_keys:
                            existing_keys.remove(key)
                        if not self.data_file.contains(key):
                            file = requests.get(link)
                            path = self.data_file.path(key)
                            open(path, "wb").write(file.content)
                            self.data_file.add(key, lang, code, text)
                        else:
                            self.data_file.touch()
                    else:
                        raise Exception("Invalid len i:%d code:%d text:%d link:%d" % (i, nb_code, nb_text, nb_link))
            for key in existing_keys:
                self.__logger.debug("Remove old key %s", key)
                self.data_file.remove(key)
        except:
            self.__logger.exception("Fail to update", exc_info=True)
        return not self.data_file.need_update()

    @staticmethod
    def __extract_key(code: str, lang: str) -> str:
        split = code.split("/")
        if len(split) != 2: raise Exception("Invalid code %s" % code)
        return f"{split[1]}_{split[0]}_{lang}"


class AicA(Aic):
    _url = {
        "en": "https://skybriefing.com/aic-series-a"
    }

    def __init__(self, data_file: AicFile):
        super().__init__(data_file, logging.getLogger(__name__))


class AicB(Aic):
    _url = {
        "fr": "https://skybriefing.com/fr/aic-series-b",
        "de": "https://skybriefing.com/de/aic-series-b",
        "it": "https://skybriefing.com/it/aic-series-b",
    }

    def __init__(self, data_file: AicFile):
        super().__init__(data_file, logging.getLogger(__name__))
