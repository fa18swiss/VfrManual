from fastapi import HTTPException, Response, status
from fastapi.responses import FileResponse, PlainTextResponse
from app import app
from .Data import *
import datetime
import mimetypes

__app = os.path.normpath(os.path.join(os.path.realpath(os.path.dirname(__file__))))
__root = os.path.join(__app, "root.html")
__sw = os.path.join(__app, "sw.js")
__robots = os.path.join(__app, "robots.txt")
__ico = os.path.join(__app, "static", "icon", "favicon.ico")

mimetypes.add_type("application/javascript", ".js")


@app.get("/")
async def index():
    return FileResponse(__root)


@app.get("/sw.js")
async def sw():
    return FileResponse(__sw)

@app.get("/robots.txt")
async def robots():
    return FileResponse(__robots)

@app.get("/favicon.ico")
async def ico():
    return FileResponse(__ico)


@app.get("/v1/vfrmanual/last")
async def vfrmanual_last_v1():
    vfr_manual.check()
    last = vfr_manual_data.last()
    return {
        "LastCheck": vfr_manual_data.last_check(),
        "Last": last[0],
        "Langs": last[1],
    }


@app.get("/v1/vfrmanual/all")
async def vfrmanual_all_v1():
    vfr_manual.check()
    return {
        "LastCheck": vfr_manual_data.last_check(),
        "All": vfr_manual_data.all()
    }


@app.get("/v1/vfrmanual/get/{date}/{lang}")
async def vfrmaual_get_v1(date, lang):
    print("vfrmaual_get_v1 %s %s" % (date, lang))
    if not vfr_manual_data.contains(lang, date):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return FileResponse(vfr_manual_data.path(lang, date))


@app.get("/v1/dabs/all")
async def dabs_all_v1():
    dabs.check()
    return {
        "LastCheck": dabs_data.last_check(),
        "All": dabs_data.all()
    }


@app.get("/v1/dabs/last")
async def dabs_latest_v1():
    date = datetime.date.today().isoformat()
    return dabs_get_v1(date)


@app.get("/v1/dabs/get/{date}")
async def dabs_get_v1(date):
    dabs.check()
    all_dabs = dabs_data.all()
    if date in all_dabs:
        versions = sorted([int(i) for i in all_dabs[date]])
        if len(versions) > 0:
            version = str(versions[-1])
            return FileResponse(dabs_data.path(version, date))
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)


@app.get("/v1/dabs/get/{date}/{version}")
async def dabs_get_full_v1(date, version):
    dabs.check()
    if not dabs_data.contains(version, date):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return FileResponse(dabs_data.path(version, date))


@app.get("/v1/HealthCheck", response_class=PlainTextResponse)
async def health_check_v1(response: Response):
    ok = True
    vfr_manual.cleanup()
    dabs.cleanup()
    ok = vfr_manual.check() and ok
    ok = dabs.check() and ok
    ok = aic_a.check() and ok
    ok = aic_b.check() and ok
    if ok:
        return "Healthy"
    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return "Unhealthy"


@app.delete("/v1/cleanup")
async def cleanup_v1():
    vfr_manual.cleanup()
    dabs.cleanup()
    return {
        "DABS": dabs_data.last_cleanup(),
        "VfrManual": vfr_manual_data.last_cleanup()
    }


@app.get("/v1/aic-a/all")
async def aic_a_all_v1():
    aic_a.check()
    return {
        "LastCheck": aic_a_data.last_check(),
        "All": aic_a.data_file.all_sorted()
    }


@app.get("/v1/aic-a/get/{code:path}")
async def aic_a_get_v1(code):
    aic_a.check()
    if not aic_a_data.contains(code):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return FileResponse(aic_a_data.path(code))


@app.get("/v1/aic-b/all")
async def aic_b_all_v1():
    aic_b.check()
    return {
        "LastCheck": aic_b_data.last_check(),
        "All": aic_b.data_file.all_sorted()
    }


@app.get("/v1/aic-b/get/{code:path}")
async def aic_b_get_v1(code):
    aic_b.check()
    if not aic_b_data.contains(code):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return FileResponse(aic_b_data.path(code))
