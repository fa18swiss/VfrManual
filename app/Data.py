import os.path

from .DataFile import DataFile
from .VfrManual import VfrManual

__data_dir = os.path.normpath(os.path.join(os.path.realpath(os.path.dirname(__file__)), "..", "data"))
os.makedirs(__data_dir, exist_ok=True)

vfr_manual_data = DataFile(os.path.join(__data_dir, "VfrManual"))
vfr_manual = VfrManual(vfr_manual_data)
