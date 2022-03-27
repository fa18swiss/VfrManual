#!/usr/bin/python3
# coding: utf8

from app import app

if __name__ == "__main__":
    from app import Data
    from datetime import timedelta
    Data.vfr_manual_data.delta = timedelta(seconds=5)
    Data.dabs_data.delta = timedelta(seconds=5)
    app.run(port="5002", debug=True)
