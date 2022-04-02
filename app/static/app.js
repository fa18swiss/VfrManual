"use strict";

async function app() {
    const DatabaseName = "App";
    const VftTable = "VfrManuals";
    const DabsTable = "Dabs";
    const Data = "Data";
    const BiCloud = '<svg class="bi bi-cloud" width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M6.887 9.2l-.964-.165A2.5 2.5 0 105.5 14h10a1.5 1.5 0 00.237-2.982l-1.038-.164.216-1.028a4 4 0 10-7.843-1.587l-.185.96zm9.084.341a5 5 0 00-9.88-1.492A3.5 3.5 0 105.5 15h9.999a2.5 2.5 0 00.394-4.968c.033-.16.06-.324.077-.49z" clip-rule="evenodd"/></svg>';
    const BiArchive = '<svg class="bi bi-archive" width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4 7v7.5c0 .864.642 1.5 1.357 1.5h9.286c.715 0 1.357-.636 1.357-1.5V7h1v7.5c0 1.345-1.021 2.5-2.357 2.5H5.357C4.021 17 3 15.845 3 14.5V7h1z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M7.5 9.5A.5.5 0 018 9h4a.5.5 0 010 1H8a.5.5 0 01-.5-.5zM17 4H3v2h14V4zM3 3a1 1 0 00-1 1v2a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1H3z" clip-rule="evenodd"/></svg>';
    const BiArrowRepeat = '<svg class="bi bi-arrow-repeat" width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4 9.5a.5.5 0 00-.5.5 6.5 6.5 0 0012.13 3.25.5.5 0 00-.866-.5A5.5 5.5 0 014.5 10a.5.5 0 00-.5-.5z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M4.354 9.146a.5.5 0 00-.708 0l-2 2a.5.5 0 00.708.708L4 10.207l1.646 1.647a.5.5 0 00.708-.708l-2-2zM15.947 10.5a.5.5 0 00.5-.5 6.5 6.5 0 00-12.13-3.25.5.5 0 10.866.5A5.5 5.5 0 0115.448 10a.5.5 0 00.5.5z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M18.354 8.146a.5.5 0 00-.708 0L16 9.793l-1.646-1.647a.5.5 0 00-.708.708l2 2a.5.5 0 00.708 0l2-2a.5.5 0 000-.708z" clip-rule="evenodd"/></svg>';
    let db;

    const destVfrManual = document.getElementById("destVfrManual");
    const lastCheckVfrManual = document.getElementById("lastCheckVfrManual");
    const destDabs = document.getElementById("destDabs");
    const lastCheckDabs = document.getElementById("lastCheckDabs");

    const request = window.indexedDB.open(DatabaseName, 2);
    request.onupgradeneeded = event => {
        const db = event.target.result;
        if (event.oldVersion < 1) db.createObjectStore(VftTable);
        if (event.oldVersion < 2) db.createObjectStore(DabsTable);
    };
    db = await promiseReq(request);
    let dataVfrManual = await loadData(VftTable);
    let dataDabs = await loadData(DabsTable);

    await refreshDataVfrManual(false);
    await refreshDataDabs(false);
    await checkLastVfrManual();
    await checkLastDabs();

    function get(url, responseType) {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = responseType;
            xhr.onload =() => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                        response: xhr.response
                    });
                }
            };
            xhr.onerror = () => {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                    response: xhr.response
                });
            };
            xhr.send();
        });
    }

    async function loadData(table){
        let data = await promiseReq(read(table).get(Data));
        if (data) {
            for (let id in data.items) {
                if (!data.items.hasOwnProperty(id)) continue;
                data.items[id].downloading = false;
            }
        } else {
            data = { items:{} }
        }
        return data;
    }

    function read(table) {
        return db.transaction(table).objectStore(table);
    }

    function write(table) {
        return db.transaction([table], "readwrite").objectStore(table)
    }

    async function checkLastVfrManual(e) {
        if (e) e.preventDefault();
        try {
            let res = await get("/v1/vfrmanual/all", "json");

            const ids = Object.keys(dataVfrManual.items);

            for (let date in res.All) {
                if (!res.All.hasOwnProperty(date)) continue;
                let langs = res.All[date];
                for(let i = 0 ; i < langs.length ; i++) {
                    const lang = langs[i];
                    const id = date + "_" + lang;
                    const item = (id in dataVfrManual.items) ? dataVfrManual.items[id] : {hasFile: false};
                    item.date = date;
                    item.id = id;
                    item.lang = lang;
                    dataVfrManual.items[id] = item;
                    let index = ids.indexOf(id);
                    if (index >= 0) {
                        ids.splice(index, 1);
                    }
                }
            }

            await cleanUpItems(ids, dataVfrManual, VftTable);

            dataVfrManual.LastCheck = res.LastCheck;

            await refreshDataVfrManual(true);
        } catch (e) {
            console.error("Fail to get last files", e);
        }
    }
    function promiseReq(req) {
        return new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    async function downloadVfrManualIfNeeded(item) {
        let result = await promiseReq(read(VftTable).count(item.id));
        if (result > 0) return true;
        try {
            let res = await get("/v1/vfrmanual/get/" + item.date + "/" + item.lang, "blob");
            write(VftTable).put(res, item.id);
            return true;
        } catch (e) {
            return false;
        }
    }

    function getOrCreate(container, tag) {
        let item = container.querySelector(tag);
        if (!item) {
            item = document.createElement(tag);
            container.appendChild(item);
        }
        return item;
    }

    function itemCls(item){
        let cls = "list-group-item list-group-item-action";
        if (item.downloading) cls += " list-group-item-info";
        if (item.hasFile) cls += " list-group-item-success";
        return cls;
    }

    function manageItems(dest, data, sort){
        let divs = dest.getElementsByTagName("a");
        let listItems = [];
        let toRemove = [];
        for (let i = 0; i < divs.length; i++) {
            const item = divs.item(i);
            const itemId = item.getAttribute("data-id");
            if (itemId in data.items) {
                listItems.push(item);
            } else {
                toRemove.push(item);
            }
        }
        for (let i = 0; i < toRemove.length; i++) {
            toRemove[i].remove();
            toRemove[i] = null;
        }
        toRemove = null;
        listItems.sort(sort);
        for (let i = 0; i < listItems.length; i++) {
            dest.appendChild(listItems[i]);
        }
    }

    async function cleanUpItems(ids, data, table){
        for(let i = 0 ; i < ids.length ; i++) {
            const id = ids[i];
            const item = data.items[id];
            if (item.downloading) continue;
            if (item.hasFile) {
                await promiseReq(write(table).delete(id))
            }
            delete data.items[id];
        }
        const keys = await promiseReq(read(table).getAllKeys());
        for(let i = 0 ; i < keys.length ; i++) {
            const key = keys[i];
            if (key === Data || key in data.items) continue;
            await promiseReq(write(table).delete(key));
        }
    }

    async function refreshDataVfrManual(save) {
        if (save) {
            await promiseReq(write(VftTable).put(dataVfrManual, Data));
        }
        lastCheckVfrManual.textContent = dataVfrManual.LastCheck ? new Date(dataVfrManual.LastCheck).toLocaleString() : "N/A";
        for (let id in dataVfrManual.items) {
            if (!dataVfrManual.items.hasOwnProperty(id)) continue;
            let item = dataVfrManual.items[id];

            const downloadLink =  document.getElementById("vfr_" + id) || document.createElement('a');

            if (!downloadLink.href) downloadLink.href = "#";

            if (item.hasFile && downloadLink.href.endsWith("#")) {
                read(VftTable).get(id).onsuccess = r => {
                    downloadLink.href = window.URL.createObjectURL(r.target.result);
                    downloadLink.download = "VFR-Manual_" + id + ".pdf";
                }
            }
            downloadLink.id = "vfr_" + id;
            downloadLink.setAttribute("class", itemCls(item));
            downloadLink.setAttribute("_target", "blank");
            downloadLink.setAttribute("data-id", id);
            downloadLink.setAttribute("data-date", item.date);
            downloadLink.setAttribute("data-lang", item.lang);
            downloadLink.onclick = onVfrManualClick;
            const img = getOrCreate(downloadLink, "img");
            img.src = "static/svg/" + item.lang + ".svg";
            img.alt = item.lang.toUpperCase();
            const span = getOrCreate(downloadLink, "span");
            span.textContent = new Date(item.date).toLocaleDateString();
            const svg = getOrCreate(downloadLink, "svg");
            svg.outerHTML = item.hasFile ? BiArchive : BiCloud;
            destVfrManual.appendChild(downloadLink);
        }
        manageItems(destVfrManual, dataVfrManual, sortVfrManual);
    }
    function sortVfrManual(a, b){
        const comp = a.getAttribute("data-date").toUpperCase().localeCompare(b.getAttribute("data-date").toUpperCase());
        if (comp !== 0) return -comp;
        return a.getAttribute("data-lang").toUpperCase().localeCompare(b.getAttribute("data-lang").toUpperCase());
    }
    async function onVfrManualClick(e) {
        if (!this.href.endsWith("#")) return true;
        e.preventDefault();

        const id = this.getAttribute("data-id");
        const item = dataVfrManual.items[id];
        if (item.downloading) return false;
        item.downloading = true;
        this.classList.add("list-group-item-info");

        const svg = getOrCreate(this, "svg");
        svg.outerHTML = BiArrowRepeat;

        item.hasFile = await downloadVfrManualIfNeeded(item);
        item.downloading = false;
        await refreshDataVfrManual(true);

        return false;
    }

    async function checkLastDabs(e) {
        if (e) e.preventDefault();
        try {
            let res = await get("/v1/dabs/all", "json");

            const ids = Object.keys(dataDabs.items);

            for (let date in res.All) {
                if (!res.All.hasOwnProperty(date)) continue;
                let versions = res.All[date];
                for(let i = 0 ; i < versions.length ; i++) {
                    const version = versions[i];
                    const id = date + "_" + version;
                    const item = (id in dataDabs.items) ? dataDabs.items[id] : {hasFile: false};
                    item.date = date;
                    item.id = id;
                    item.version = parseInt(version, 10);
                    dataDabs.items[id] = item;
                    let index = ids.indexOf(id);
                    if (index >= 0) {
                        ids.splice(index, 1);
                    }
                }
            }

            await cleanUpItems(ids, dataDabs, DabsTable);

            dataDabs.LastCheck = res.LastCheck;

            await refreshDataDabs(true);
        } catch (e) {
            console.error("Fail to get last files", e);
        }
    }

    async function refreshDataDabs(save) {
        if (save) {
            await promiseReq(write(DabsTable).put(dataDabs, Data));
        }
        lastCheckDabs.textContent = dataDabs.LastCheck ? new Date(dataDabs.LastCheck).toLocaleString() : "N/A";
        for (let id in dataDabs.items) {
            if (!dataDabs.items.hasOwnProperty(id)) continue;
            let item = dataDabs.items[id];

            const downloadLink =  document.getElementById("dabs_" + id) || document.createElement('a');

            if (!downloadLink.href) downloadLink.href = "#";

            if (item.hasFile && downloadLink.href.endsWith("#")) {
                read(DabsTable).get(id).onsuccess = r => {
                    downloadLink.href = window.URL.createObjectURL(r.target.result);
                    downloadLink.download = "DABS_" + id + ".pdf";
                }
            }
            downloadLink.id = "dabs_" + id;
            downloadLink.setAttribute("class", itemCls(item));
            downloadLink.setAttribute("_target", "blank");
            downloadLink.setAttribute("data-id", id);
            downloadLink.setAttribute("data-date", item.date);
            downloadLink.setAttribute("data-version", item.version);
            downloadLink.onclick = onDabsClick;
            const span = getOrCreate(downloadLink, "span");
            span.textContent = new Date(item.date).toLocaleDateString() + " version " + item.version;
            const svg = getOrCreate(downloadLink, "svg");
            svg.outerHTML = item.hasFile ? BiArchive : BiCloud;
            destDabs.appendChild(downloadLink);
        }
        manageItems(destDabs, dataDabs, sortDabs);
    }
    function sortDabs(a, b){
        const comp = b.getAttribute("data-date").toUpperCase().localeCompare(a.getAttribute("data-date").toUpperCase());
        if (comp !== 0) return comp;
        return  parseInt(b.getAttribute("data-version"), 10) - parseInt(a.getAttribute("data-version"), 10);
    }
    async function onDabsClick(e) {
        if (!this.href.endsWith("#")) return true;
        e.preventDefault();

        const id = this.getAttribute("data-id");
        const item = dataDabs.items[id];
        if (item.downloading) return false;
        item.downloading = true;
        this.classList.add("list-group-item-info");

        const svg = getOrCreate(this, "svg");
        svg.outerHTML = BiArrowRepeat;

        item.hasFile = await downloadDabsNeeded(item);
        item.downloading = false;
        await refreshDataDabs(true);

        return false;
    }
    async function downloadDabsNeeded(item) {
        let result = await promiseReq(read(DabsTable).count(item.id));
        if (result > 0) return true;
        try {
            let res = await get("/v1/dabs/get/" + item.date + "/" + item.version, "blob");
            write(DabsTable).put(res, item.id);
            return true;
        } catch (e) {
            return false;
        }
    }

    document.getElementById("cmdRefreshVfrManual").onclick = checkLastVfrManual;
    document.getElementById("cmdRefreshDabs").onclick = checkLastDabs;
}

window.onload = app;