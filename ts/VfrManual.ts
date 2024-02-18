import {ItemBase, BaseDataManager} from "./abstract"
import {VfrSection} from "./components"
import {DataKey, VftTable, BiArchive, BiCloud} from "./constants"
import {get, getOrCreate, localeUpperCompare} from "./functions"
import {DBWrapper} from "./db";

class VfrManualItem extends ItemBase {
    date: string;
    lang: string;
}

export class VfrManualDataManager extends BaseDataManager<VfrManualItem> {
    constructor(section: VfrSection, db: DBWrapper) {
        super(db.table(VftTable), section);
    }

    protected parse(id: string, item: any): VfrManualItem {
        const data = new VfrManualItem();
        data.id = item.id;
        data.hasFile = item.hasFile;
        data.downloading = item.downloading;
        data.date = item.date;
        data.lang = item.lang;
        return data;
    }

    public async refresh(save: boolean) {
        if (save) {
            await this.db.put(this.data, DataKey);
        }
        this.manageDate();
        for (let id in this.data.items) {
            const item: VfrManualItem = this.data.items[id];
            const downloadLink : HTMLAnchorElement =
                <HTMLAnchorElement>document.getElementById(`vfr_${id}`)
                || document.createElement("a");

            if (!downloadLink.href) downloadLink.href = "#";

            if (item.hasFile && downloadLink.href.endsWith("#")) {
                const request = this.db.read().get(id)
                request.onsuccess = _ => {
                    downloadLink.href = URL.createObjectURL(request.result);
                    downloadLink.download = `VFR-Manual_${id}.pdf`;
                }
            }
            downloadLink.id = `vfr_${id}`;
            downloadLink.setAttribute("class", this.itemCls(item));
            downloadLink.setAttribute("_target", "blank");
            downloadLink.setAttribute("data-id", id);
            downloadLink.setAttribute("data-date", item.date);
            downloadLink.setAttribute("data-lang", item.lang);
            downloadLink.addEventListener("click", (e: Event) => this.onClick(e));
            const img = getOrCreate<HTMLImageElement>(downloadLink, "img");
            img.src = `static/svg/${item.lang}.svg`;
            img.alt = item.lang.toUpperCase();
            const span = getOrCreate(downloadLink, "span");
            span.textContent = new Date(item.date).toLocaleDateString();
            const svg = getOrCreate(downloadLink, "svg");
            svg.outerHTML = item.hasFile ? BiArchive : BiCloud;
            this.section.dest.appendChild(downloadLink);
        }
        this.manageItems();
    }


    protected sort(a: HTMLElement, b: HTMLElement): number {
        const comp = localeUpperCompare(
            a.getAttribute("data-date"),
            b.getAttribute("data-date"));
        if (comp !== 0) return -comp;
        return localeUpperCompare(
            a.getAttribute("data-lang"),
            b.getAttribute("data-lang"));
    }

    protected async downloadIfNeeded(item: VfrManualItem): Promise<boolean> {
        let needed: boolean = await this.db.containsKey(item.id);
        if (needed) return true;
        try {
            let res = await get(`/v1/vfrmanual/get/${item.date}/${item.lang}`, "blob");
            await this.db.put(res, item.id);
            return true;
        } catch (e) {
            console.error("Download error", e);
            return false;
        }
    }
    async checkLast() {
        try {
            this.section.loading(true);
            let res = await get("/v1/vfrmanual/all", "json");

            const ids = Object.keys(this.data.items);

            for (let date in res.All) {
                if (!res.All.hasOwnProperty(date)) continue;
                let langs = res.All[date];
                for(let i = 0 ; i < langs.length ; i++) {
                    const lang : string = langs[i];
                    const id : string = `${date}_${lang}`;
                    const item : VfrManualItem = (id in this.data.items) ? this.data.items[id] : new VfrManualItem()
                    item.date = date;
                    item.id = id;
                    item.lang = lang;
                    this.data.items[id] = item;
                    let index = ids.indexOf(id);
                    if (index >= 0) {
                        ids.splice(index, 1);
                    }
                }
            }

            await this.cleanUpItems(ids);

            this.data.LastCheck = res.LastCheck;

            await this.refresh(true);
        } catch (e) {
            console.error("Fail to get last files", e);
            this.manageDate();
        }
        this.section.loading(false);
    }
}
