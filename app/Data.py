import os.path

from .DataFile import DataFile
from .VfrManual import VfrManual

__data_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "data"))

vfr_manual_data = DataFile(os.path.join(__data_dir, "VfrManual"))
vfr_manual = VfrManual(vfr_manual_data)
