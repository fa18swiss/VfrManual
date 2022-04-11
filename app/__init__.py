from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from . import Data
from . import Logs

Logs.init()
app = FastAPI(
    openapi_url=None
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

from app import views
