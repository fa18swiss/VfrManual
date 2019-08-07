from app import app
from .Data import *
from flask import jsonify, send_file


@app.route("/")
def index():
    return "Ready", 200, {"Content-Type": "text/plain"}


@app.route("/v1/vfrmanual/last")
def last_v1():
    vfr_manual.check()
    return jsonify({
        "LastCheck": vfr_manual_data.last_check(),
        "Last": vfr_manual_data.last()
    })


@app.route("/v1/vfrmanual/get/<date>")
def get_v1(date):
    if date not in vfr_manual_data:
        return "Not found", 404
    return send_file(vfr_manual_data.path(date), as_attachment=True)
