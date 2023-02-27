import datetime
import logging
import os
import PyPDF2
import re
import requests
from typing import Optional, Tuple
import uuid

from .DataFile import DataFile


class Dabs:
    __URLS = (
        "https://www.skybriefing.com/o/dabs?today",
        "https://www.skybriefing.com/o/dabs?tomorrow",
    )
    __regex_date = re.compile("DABS Date: (20[0-9]{2}) ([A-Z]{3}) ([0-9]?[1-9])")
    __regex_version = re.compile(r"Version ([1-4]) -")
    __months = ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
    data_file: DataFile
    __logger: logging.Logger
    __path: str

    def __init__(self, data_file: DataFile, path: str):
        self.data_file = data_file
        self.__logger = logging.getLogger(__name__)
        self.__path = path

    def check(self) -> bool:
        if not self.data_file.need_update():
            self.__logger.debug("No update need")
            return True
        any_ok = False
        try:
            for url in self.__URLS:
                file = self.__download(url)
                if file is None:
                    continue
                metas = self.__extract_metas(file)
                if metas is None:
                    self.__delete(file)
                    continue
                date, version = metas
                self.__manage(file, date, version)
                any_ok = True
            if any_ok:
                self.data_file.touch()
        except Exception:
            self.__logger.exception("Fail to update", exc_info=True)
        return not self.data_file.need_update()

    def cleanup(self):
        if not self.data_file.need_cleanup():
            self.__logger.debug("No cleanup need")
            return
        try:
            limit = datetime.date.today()
            self.__logger.info("clean limit %s", limit)
            data = self.data_file.all()
            to_delete: list[Tuple[str, str]] = list()
            for key in data:
                key_date = datetime.date.fromisoformat(key)
                if key_date >= limit:
                    continue
                for v in data[key]:
                    to_delete.append((key, v))
            for date, version in to_delete:
                self.data_file.remove(version, date)
                self.__logger.info("Remove date:%s version:%s", date, version)
            self.data_file.cleanup()
        except:
            self.__logger.exception("Fail to update", exc_info=True)

    def __download(self, url: str) -> Optional[str]:
        try:
            res = requests.get(url)
            if res.status_code == 200:
                file = os.path.join(self.__path, f"{uuid.uuid4()}.pdf")
                with open(file, "wb+") as f:
                    f.write(res.content)
                self.__logger.info(f"Downloaded {url} to {file}")
                return file
            else:
                self.__logger.error(f"Fail to download {url} : {res}")
        except Exception:
            self.__logger.exception(f"Fail to download {url}", exc_info=True)
        return None

    def __extract_metas(self, src_path: str) -> Optional[Tuple[datetime.date, int]]:
        try:
            version: Optional[int] = None
            date: Optional[datetime.date] = None
            with open(src_path, 'rb') as pdfFileObj:
                pdf_reader = PyPDF2.PdfReader(pdfFileObj)
                if len(pdf_reader.pages) < 2:
                    return None
                page_obj = pdf_reader.pages[1]
                text = page_obj.extract_text()
                for line in text.splitlines():
                    find_date = self.__regex_date.search(line)
                    find_version = self.__regex_version.search(line)
                    if find_date is not None:
                        year = int(find_date.group(1))
                        month = find_date.group(2)
                        month = self.__months.index(month) + 1
                        day = int(find_date.group(3))
                        date = datetime.date(year, month, day)
                    if find_version is not None:
                        version = int(find_version.group(1))
            if date is not None and version is not None:
                return date, version
        except Exception:
            self.__logger.exception(f"Fail to extract metas {src_path}", exc_info=True)
        return None

    def __delete(self, file: str):
        try:
            os.remove(file)
        except Exception:
            self.__logger.exception(f"Fail to delete {file}", exc_info=True)

    def __manage(self, file: str, date: datetime.date, version: int):
        try:
            version_str = str(version)
            date_iso = date.isoformat()
            if self.data_file.contains(version_str, date_iso):
                os.remove(file)
            else:
                path = self.data_file.path(version_str, date_iso)
                os.rename(file, path)
                self.data_file.add(version_str, date_iso)
        except Exception:
            self.__logger.exception(f"Fail to manage {file} {date} {version}", exc_info=True)
