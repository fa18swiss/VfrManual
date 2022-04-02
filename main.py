#!/usr/bin/python3
# coding: utf8

from app import app

if __name__ == "__main__":
    from app import Data
    from datetime import timedelta
    delta = timedelta(seconds=5)
    cleanup_delta = timedelta(seconds=15)
    Data.vfr_manual_data.delta = delta
    Data.vfr_manual_data.cleanup_delta = cleanup_delta
    Data.dabs_data.delta = delta
    Data.dabs_data.cleanup_delta = cleanup_delta
    app.run(port="5002", debug=True)
