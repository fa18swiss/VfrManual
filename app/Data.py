import os
import datetime

from .DataFile import DataFile
from .VfrManual import VfrManual
from .Dabs import Dabs

__data_dir = os.path.normpath(os.path.join(os.path.realpath(os.path.dirname(__file__)), "..", "data"))
os.makedirs(__data_dir, exist_ok=True)

vfr_manual_delta: datetime.timedelta
vfr_manual_cleanup_delta: datetime.timedelta
dabs_delta: datetime.timedelta
dabs_cleanup_delta: datetime.timedelta

if os.environ.get("DEBUG"):
    vfr_manual_delta = dabs_delta = datetime.timedelta(seconds=10)
    vfr_manual_cleanup_delta = dabs_cleanup_delta = datetime.timedelta(seconds=15)
else:
    vfr_manual_delta = datetime.timedelta(hours=1)
    dabs_delta = datetime.timedelta(minutes=5)
    vfr_manual_cleanup_delta = dabs_cleanup_delta = datetime.timedelta(days=1)

vfr_manual_dir = os.path.join(__data_dir, "VfrManual")
vfr_manual_data = DataFile(vfr_manual_dir, vfr_manual_delta, vfr_manual_cleanup_delta)
vfr_manual = VfrManual(vfr_manual_data)

dabs_dir = os.path.join(__data_dir, "DABS")
dabs_data = DataFile(dabs_dir, dabs_delta, dabs_cleanup_delta)
dabs = Dabs(dabs_data, dabs_dir)
