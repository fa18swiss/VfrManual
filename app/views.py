from app import app
from .Data import *
from flask import jsonify, send_file

__app = os.path.normpath(os.path.join(os.path.realpath(os.path.dirname(__file__))))
__root = os.path.join(__app, "root.html")
__sw = os.path.join(__app, "sw.js")


@app.route("/")
def index():
    return send_file(__root)


@app.route("/sw.js")
def sw():
    return send_file(__sw)


@app.route("/v1/vfrmanual/last")
def last_v1():
    vfr_manual.check()
    last = vfr_manual_data.last()
    return jsonify({
        "LastCheck": vfr_manual_data.last_check(),
        "Last": last[0],
        "Langs": last[1],
    })


@app.route("/v1/vfrmanual/all")
def all_v1():
    vfr_manual.check()
    return jsonify({
        "LastCheck": vfr_manual_data.last_check(),
        "All": vfr_manual_data.all()
    })


@app.route("/v1/vfrmanual/get/<date>/<lang>")
def get_v1(date, lang):
    if not vfr_manual_data.contains(lang, date):
        return "Not found", 404
    return send_file(vfr_manual_data.path(lang, date), as_attachment=True)
