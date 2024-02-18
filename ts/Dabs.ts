import {ItemBase, BaseDataManager} from "./abstract"
import {VfrSection} from "./components"
import {DataKey, DabsTable} from "./constants"
import {get, getOrCreate, localeUpperCompare} from "./functions"
import {DBWrapper} from "./db";
import {BiArchive, BiCloud} from "./icons"

class DabsItem extends ItemBase {
    date: string;
    version: number;
}

export class DabsDataManager extends BaseDataManager<DabsItem> {
    constructor(section: VfrSection, db: DBWrapper) {
        super(db.table(DabsTable), section, 6);
    }

    protected parse(id: string, item: any): DabsItem {
        const data = new DabsItem();
        data.id = item.id;
        data.hasFile = item.hasFile;
        data.downloading = item.downloading;
        data.date = item.date;
        data.version = parseInt(item.version, 10);
        return data;
    }

    public async refresh(save: boolean) {
        if (save) {
            await this.db.put(this.data, DataKey);
        }
        this.manageDate();
        for (let id in this.data.items) {
            const item: DabsItem = this.data.items[id];

            const downloadLink : HTMLAnchorElement =
                <HTMLAnchorElement>document.getElementById(`dabs_${id}`)
                || document.createElement("a");

            if (!downloadLink.href) downloadLink.href = "#";

            if (item.hasFile && downloadLink.href.endsWith("#")) {
                const request = this.db.read().get(id)
                request.onsuccess = _ => {
                    downloadLink.href = URL.createObjectURL(request.result);
                    downloadLink.download = `DABS_${id}.pdf`;
                }
            }
            downloadLink.id = `dabs_${id}`;
            downloadLink.setAttribute("class", this.itemCls(item));
            downloadLink.setAttribute("_target", "blank");
            downloadLink.setAttribute("data-id", id);
            downloadLink.setAttribute("data-date", item.date);
            downloadLink.setAttribute("data-version", `${item.version}`);
            downloadLink.addEventListener("click", (e: Event) => this.onClick(e));
            const span = getOrCreate(downloadLink, "span");
            span.textContent = new Date(item.date).toLocaleDateString() + " version " + item.version;
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
        return parseInt(b.getAttribute("data-version"), 10) -
            parseInt(a.getAttribute("data-version"), 10);
    }

    protected async downloadIfNeeded(item: DabsItem): Promise<boolean> {
        let needed: boolean = await this.db.containsKey(item.id);
        if (needed) return true;
        try {
            let res = await get(`/v1/dabs/get/${item.date}/${item.version}`, "blob");
            await this.db.put(res, item.id);
            return true;
        } catch (e) {
            console.error("Download error", e);
            return false;
        }
    }
    async checkLast() {
        try {
            this.section.loading( true);
            let res = await get("/v1/dabs/all", "json");

            const ids = Object.keys(this.data.items);

            for (let date in res.All) {
                if (!res.All.hasOwnProperty(date)) continue;
                let versions = res.All[date];
                for(let i = 0 ; i < versions.length ; i++) {
                    const version = versions[i];
                    const id = date + "_" + version;
                    const item = (id in this.data.items) ? this.data.items[id] : new DabsItem();
                    item.date = date;
                    item.id = id;
                    item.version = parseInt(version, 10);
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
