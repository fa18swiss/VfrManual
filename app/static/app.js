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
            for(var i = 0 ; i < res.Langs.length ; i++) {
                downloadIfNeeded(res.Last, res.Langs[i]);
            }
            write(VftTable).put(res.LastCheck, LastCheck);
            loadLast();

        }, "json")
    }

    function downloadIfNeeded(date, lang) {
        console.log("date, lang", date, lang)
        const key = date + "_" + lang;
        read(VftTable).count(key).onsuccess = function (event) {
            if (event.target.result <= 0) {
                get("/v1/vfrmanual/get/" + date + "/" + lang, function (file) {
                    write(VftTable).put(file, key);
                    loadAll();
                }, 'blob');
            }
        };
    }

    function readAndCreateLink(key, parent) {
        const downloadLink = document.createElement('a');
        const content = document.createElement("h2");
        const tab = key.split("_");
        content.textContent = new Date(tab[0]).toLocaleDateString() + " " + tab[1].toUpperCase();
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
                let key = keys[i];
                if (key !== LastCheck && key.indexOf("_") >= 0) {
                    readAndCreateLink(key, parent)
                }

            }
        }
    }

    document.getElementById("cmdRefresh").onclick = checkLast;
}

window.onload = app;