import os
import datetime

from .DataFile import DataFile
from .AicFile import AicFile
from .VfrManual import VfrManual
from .Dabs import Dabs
from .Aic import AicA, AicB

__data_dir = os.path.normpath(os.path.join(os.path.realpath(os.path.dirname(__file__)), "..", "data"))
os.makedirs(__data_dir, exist_ok=True)

vfr_manual_delta: datetime.timedelta
vfr_manual_cleanup_delta: datetime.timedelta
dabs_delta: datetime.timedelta
dabs_cleanup_delta: datetime.timedelta
aic_delta: datetime.timedelta
aic_cleanup_delta: datetime.timedelta

if os.environ.get("DEBUG"):
    aic_delta = vfr_manual_delta = dabs_delta = datetime.timedelta(seconds=10)
    aic_cleanup_delta = vfr_manual_cleanup_delta = dabs_cleanup_delta = datetime.timedelta(seconds=15)
else:
    vfr_manual_delta = datetime.timedelta(hours=6)
    dabs_delta = datetime.timedelta(minutes=30)
    vfr_manual_cleanup_delta = dabs_cleanup_delta = datetime.timedelta(days=1)
    aic_delta = datetime.timedelta(hours=12)
    aic_cleanup_delta = datetime.timedelta(days=1)

vfr_manual_dir = os.path.join(__data_dir, "VfrManual")
vfr_manual_data = DataFile(vfr_manual_dir, vfr_manual_delta, vfr_manual_cleanup_delta)
vfr_manual = VfrManual(vfr_manual_data)

dabs_dir = os.path.join(__data_dir, "DABS")
dabs_data = DataFile(dabs_dir, dabs_delta, dabs_cleanup_delta)
dabs = Dabs(dabs_data, dabs_dir)

aic_a_dir = os.path.join(__data_dir, "AIC-A")
aic_a_data = AicFile(aic_a_dir, aic_delta)
aic_a = AicA(aic_a_data)

aic_b_dir = os.path.join(__data_dir, "AIC-B")
aic_b_data = AicFile(aic_b_dir, aic_delta)
aic_b = AicB(aic_b_data)
