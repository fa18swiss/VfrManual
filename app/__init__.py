from flask import Flask
from . import Data
from . import Logs

Logs.init()
app = Flask(__name__)

from app import views
