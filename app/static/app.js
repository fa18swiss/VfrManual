"use strict";

function app() {
    const VftTable = "VfrManuals";
    const LastCheck = "LastCheck";
    let db;

    const request = indexedDB.open("App", 1);
    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        const objectStore = db.createObjectStore(VftTable);
    };
    request.onsuccess = function (evt) {
        db = this.result;
        loadAll();
        checkLast();
    };

    function get(url, callback, responseType) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = responseType;
        xhr.onload = function () {
            callback(this.response)
        };
        xhr.send();
    }

    function read(table) {
        return db.transaction(table).objectStore(table);
    }

    function write(table) {
        return db.transaction([table], "readwrite").objectStore(table)
    }

    function checkLast(e) {
        if (e) e.preventDefault();
        get("/v1/vfrmanual/last", function (res) {
            write(VftTable).put(res.LastCheck, LastCheck);
            loadLast();
            read(VftTable).count(res.Last).onsuccess = function (event) {
                if (event.target.result <= 0) {
                    get("/v1/vfrmanual/get/" + res.Last, function (file) {
                        write(VftTable).put(file, res.Last);
                        loadAll();
                    }, 'blob');
                }
            };
        }, "json")
    }

    function readAndCreateLink(key, parent) {
        const downloadLink = document.createElement('a');
        const content = document.createElement("h2");
        content.textContent = new Date(key).toLocaleDateString();
        downloadLink.appendChild(content);
        read(VftTable).get(key).onsuccess = res => {
            downloadLink.href = window.URL.createObjectURL(res.target.result);
            parent.appendChild(downloadLink);
        }
    }

    function loadLast() {
        read(VftTable).get(LastCheck).onsuccess = l => document.getElementById("lastCheck").textContent = new Date(l.target.result).toLocaleString();
    }

    function loadAll() {
        loadLast();
        read(VftTable).getAllKeys().onsuccess = result => {
            const keys = result.target.result;
            keys.sort();
            keys.reverse();
            const parent = document.getElementById("dest");
            parent.innerHTML = "";
            for (let i = 0; i < keys.length; i++) {
                if (keys[i] !== LastCheck) {
                    readAndCreateLink(keys[i], parent)
                }

            }
        }
    }

    document.getElementById("cmdRefresh").onclick = checkLast;
}

window.onload = app;