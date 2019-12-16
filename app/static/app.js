"use strict";

function app() {
    const DatabaseName = "App";
    const VftTable = "VfrManuals";
    const Data = "Data";
    const BiCloud = '<svg class="bi bi-cloud" width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M6.887 9.2l-.964-.165A2.5 2.5 0 105.5 14h10a1.5 1.5 0 00.237-2.982l-1.038-.164.216-1.028a4 4 0 10-7.843-1.587l-.185.96zm9.084.341a5 5 0 00-9.88-1.492A3.5 3.5 0 105.5 15h9.999a2.5 2.5 0 00.394-4.968c.033-.16.06-.324.077-.49z" clip-rule="evenodd"/></svg>';
    const BiArchive = '<svg class="bi bi-archive" width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4 7v7.5c0 .864.642 1.5 1.357 1.5h9.286c.715 0 1.357-.636 1.357-1.5V7h1v7.5c0 1.345-1.021 2.5-2.357 2.5H5.357C4.021 17 3 15.845 3 14.5V7h1z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M7.5 9.5A.5.5 0 018 9h4a.5.5 0 010 1H8a.5.5 0 01-.5-.5zM17 4H3v2h14V4zM3 3a1 1 0 00-1 1v2a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1H3z" clip-rule="evenodd"/></svg>';
    const BiArrowRepeat = '<svg class="bi bi-arrow-repeat" width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4 9.5a.5.5 0 00-.5.5 6.5 6.5 0 0012.13 3.25.5.5 0 00-.866-.5A5.5 5.5 0 014.5 10a.5.5 0 00-.5-.5z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M4.354 9.146a.5.5 0 00-.708 0l-2 2a.5.5 0 00.708.708L4 10.207l1.646 1.647a.5.5 0 00.708-.708l-2-2zM15.947 10.5a.5.5 0 00.5-.5 6.5 6.5 0 00-12.13-3.25.5.5 0 10.866.5A5.5 5.5 0 0115.448 10a.5.5 0 00.5.5z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M18.354 8.146a.5.5 0 00-.708 0L16 9.793l-1.646-1.647a.5.5 0 00-.708.708l2 2a.5.5 0 00.708 0l2-2a.5.5 0 000-.708z" clip-rule="evenodd"/></svg>';
    let db;
    let data = { items:{} };

    const dest = document.getElementById("dest");

    const request = window.indexedDB.open(DatabaseName, 1);
    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        const objectStore = db.createObjectStore(VftTable);
    };
    request.onsuccess = function (evt) {
        db = this.result;
        read(VftTable).get(Data).onsuccess = r => {
            if (r.target.result) {
                data = r.target.result;
                for (let id in data.items) {
                    if (!data.items.hasOwnProperty(id)) continue;
                    data.items[id].downloading = false;
                }
            }
            refreshData(false);
            checkLast();
        };
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
            const date = res.Last;
            for(let i = 0 ; i < res.Langs.length ; i++) {
                const lang = res.Langs[i];
                const id = date + "_" + lang;
                const item = (id in data.items) ? data.items[id] : {hasFile: false};
                item.date = date;
                item.id = id;
                item.lang = lang;
                data.items[id] = item;
            }
            data.LastCheck = res.LastCheck;

            refreshData(true);

        }, "json")
    }

    function downloadIfNeeded(item, done) {
        read(VftTable).count(item.id).onsuccess = function (event) {
            if (event.target.result <= 0) {
                get("/v1/vfrmanual/get/" + item.date + "/" + item.lang, function (file) {
                    write(VftTable).put(file, item.id);
                    done();
                }, 'blob');
            } else {
                done()
            }
        };
    }

    function getOrCreate(container, tag) {
        let item = container.querySelector(tag);
        if (!item) {
            item = document.createElement(tag);
            container.appendChild(item);
        }
        return item;
    }

    function refreshData(save) {
        if (save) {
            write(VftTable).put(data, Data);
            console.log("Write done");
        }
        document.getElementById("lastCheck").textContent = data.LastCheck
            ? new Date(data.LastCheck).toLocaleString()
            : "N/A";
        for (let id in data.items) {
            if (!data.items.hasOwnProperty(id)) continue;
            let item = data.items[id];
            console.log("item", item);

            const downloadLink =  document.getElementById(id) || document.createElement('a');

            if (!downloadLink.href) downloadLink.href = "#";

            if (item.hasFile && downloadLink.href.endsWith("#")) {
                read(VftTable).get(id).onsuccess = r => {
                    downloadLink.href = window.URL.createObjectURL(r.target.result);
                }
            }
            downloadLink.id = id;
            let cls = "list-group-item list-group-item-action";
            if (item.downloading) cls += " list-group-item-info";
            if (item.hasFile) cls += " list-group-item-success";
            downloadLink.setAttribute("class", cls);
            downloadLink.setAttribute("_target", "blank");
            downloadLink.setAttribute("data-date", item.date);
            downloadLink.setAttribute("data-lang", item.lang);
            downloadLink.onclick = onLinkClick;
            const img = getOrCreate(downloadLink, "img");
            img.src = "static/svg/" + item.lang + ".svg";
            img.alt = item.lang.toUpperCase();
            const span = getOrCreate(downloadLink, "span");
            span.textContent = new Date(item.date).toLocaleDateString();
            const svg = getOrCreate(downloadLink, "svg");
            svg.outerHTML = item.hasFile ? BiArchive : BiCloud;
            dest.appendChild(downloadLink);
        }
        let divs = dest.getElementsByTagName("a");
        let listitems = [];
        for (let i = 0; i < divs.length; i++) {
            listitems.push(divs.item(i));
        }
        listitems.sort(function(a, b) {
            const dateA = a.getAttribute("data-date").toUpperCase();
            const dateB = b.getAttribute("data-date").toUpperCase();
            const comp = dateA.localeCompare(dateB);
            if (comp !== 0) return -comp;
            const langA = a.getAttribute("data-lang").toUpperCase();
            const langB = b.getAttribute("data-lang").toUpperCase();
            return  langA.localeCompare(langB);
        });
        for (let i = 0; i < listitems.length; i++) {
            dest.appendChild(listitems[i]);
        }
    }
    function onLinkClick(e) {
        if (!this.href.endsWith("#")) return true;
        e.preventDefault();

        const id = this.id;
        const item = data.items[id];
        if (item.downloading) return false;
        item.downloading = true;
        this.classList.add("list-group-item-info");

        console.log("start Download", id);

        const svg = getOrCreate(this, "svg");
        svg.outerHTML = BiArrowRepeat;

        downloadIfNeeded(item, () => {
            item.hasFile = true;
            item.downloading = false;
            refreshData(true);
        });

        return false;
    }

    document.getElementById("cmdRefresh").onclick = checkLast;
    document.getElementById("cmdDelete").onclick = e => {
        e.preventDefault();
        if (!confirm("Delete all data ?")) return;
        window.indexedDB.deleteDatabase(DatabaseName);
        window.location.reload(true);
    };
}

window.onload = app;