#!/usr/bin/python3
# coding: utf8

if __name__ == "__main__":
    import os
    os.environ["DEBUG"] = "1"
    import uvicorn
    uvicorn.run('app:app', host='127.0.0.1', port=5002, reload=True)
