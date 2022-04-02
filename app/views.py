from app import app
from .Data import *
from flask import jsonify, send_file
import datetime
import mimetypes

__app = os.path.normpath(os.path.join(os.path.realpath(os.path.dirname(__file__))))
__root = os.path.join(__app, "root.html")
__sw = os.path.join(__app, "sw.js")
__ico = os.path.join(__app, "static", "icon", "favicon.ico")

mimetypes.add_type("application/javascript", ".js")


@app.route("/")
def index():
    return send_file(__root)


@app.route("/sw.js")
def sw():
    return send_file(__sw)


@app.route("/favicon.ico")
def ico():
    return send_file(__ico)


@app.route("/v1/vfrmanual/last")
def vfrmanual_last_v1():
    vfr_manual.check()
    last = vfr_manual_data.last()
    return jsonify({
        "LastCheck": vfr_manual_data.last_check(),
        "Last": last[0],
        "Langs": last[1],
    })


@app.route("/v1/vfrmanual/all")
def vfrmanual_all_v1():
    vfr_manual.check()
    return jsonify({
        "LastCheck": vfr_manual_data.last_check(),
        "All": vfr_manual_data.all()
    })


@app.route("/v1/vfrmanual/get/<date>/<lang>")
def vfrmanual_get_v1(date, lang):
    if not vfr_manual_data.contains(lang, date):
        return "Not found", 404
    return send_file(vfr_manual_data.path(lang, date), as_attachment=True)


@app.route("/v1/dabs/all")
def dabs_all_v1():
    dabs.check()
    return jsonify({
        "LastCheck": dabs_data.last_check(),
        "All": dabs_data.all()
    })


@app.route("/v1/dabs/last")
def dabs_latest_v1():
    date = datetime.date.today().isoformat()
    return dabs_get_v1(date)


@app.route("/v1/dabs/get/<date>")
def dabs_get_v1(date):
    dabs.check()
    all_dabs = dabs_data.all()
    if date in all_dabs:
        versions = sorted([int(i) for i in all_dabs[date]])
        if len(versions) > 0:
            version = str(versions[-1])
            return send_file(dabs_data.path(version, date), as_attachment=True)
    return "Not found", 404


@app.route("/v1/dabs/get/<date>/<version>")
def dabs_get_full_v1(date, version):
    dabs.check()
    if not dabs_data.contains(version, date):
        return "Not found", 404
    return send_file(dabs_data.path(version, date), as_attachment=True)


@app.route("/v1/HealthCheck")
def health_check_v1():
    vfr_manual.cleanup()
    dabs.cleanup()
    vfr_manual_ok = vfr_manual.check()
    dabs_ok = dabs.check()
    if vfr_manual_ok and dabs_ok:
        return "Healthy", 200
    return "Unhealthy", 503


@app.route("/v1/cleanup", methods=["DELETE"])
def cleanup_v1():
    vfr_manual.cleanup()
    dabs.cleanup()
    return jsonify({
        "DABS": dabs_data.last_cleanup(),
        "VfrManual": vfr_manual_data.last_cleanup()
    })
