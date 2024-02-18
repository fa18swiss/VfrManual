import {BaseDataManager, ItemBase} from "./abstract";
import {DBTableWrapper, DBWrapper} from "./db";
import {VfrSection} from "./components";
import {AicATable, AicBTable, DataKey} from "./constants";
import {BiArchive, BiCloud} from "./icons"
import {get, getOrCreate, localeUpperCompare} from "./functions";

class AicItem extends ItemBase {
    lang: string;
    code: string;
    text: string;
}

abstract class AicDataManager extends BaseDataManager<AicItem> {
    protected readonly urlPath: string;

    protected constructor(db: DBTableWrapper, section: VfrSection, urlPath: string) {
        super(db, section, 24);
        this.urlPath = urlPath;
    }
    protected parse(id: string, item: any): AicItem {
        const data = new AicItem();
        data.id = item.id;
        data.hasFile = item.hasFile;
        data.downloading = item.downloading;
        data.lang = item.lang;
        data.code = item.code;
        data.text = item.text;
        return data;
    }
    public async refresh(save: boolean) {
        if (save) {
            await this.db.put(this.data, DataKey);
        }
        this.manageDate();
        for (let id in this.data.items) {
            const item: AicItem = this.data.items[id];
            const downloadLink : HTMLAnchorElement =
                <HTMLAnchorElement>document.getElementById(`${this.urlPath}_${id}`)
                || document.createElement("a");

            if (!downloadLink.href) downloadLink.href = "#";

            if (item.hasFile && downloadLink.href.endsWith("#")) {
                const request = this.db.read().get(id)
                request.onsuccess = _ => {
                    downloadLink.href = URL.createObjectURL(request.result);
                    downloadLink.download = `${id}.pdf`;
                }
            }
            downloadLink.id = `${this.urlPath}_${id}`;
            downloadLink.setAttribute("class", this.itemCls(item));
            downloadLink.setAttribute("_target", "blank");
            downloadLink.setAttribute("data-id", id);
            downloadLink.addEventListener("click", (e: Event) => this.onClick(e));
            const img = getOrCreate<HTMLImageElement>(downloadLink, "img");
            img.src = `static/svg/${item.lang}.svg`;
            img.alt = item.lang.toUpperCase();
            const span = getOrCreate(downloadLink, "span");
            span.textContent = `${item.code} ${item.text}`;
            const svg = getOrCreate(downloadLink, "svg");
            svg.outerHTML = item.hasFile ? BiArchive : BiCloud;
            this.section.dest.appendChild(downloadLink);
        }
        this.manageItems();
    }

    protected sort(a: HTMLElement, b: HTMLElement): number {
        return -localeUpperCompare(
            a.getAttribute("data-id"),
            b.getAttribute("data-id"));
    }
    protected async downloadIfNeeded(item: AicItem): Promise<boolean> {
        let needed: boolean = await this.db.containsKey(item.id);
        if (needed) return true;
        try {
            let res = await get(`/v1/${this.urlPath}/get/${item.id}`, "blob");
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
            let res = await get(`/v1/${this.urlPath}/all`, "json");

            const ids = Object.keys(this.data.items);

            for (let ob of res.All) {

                const id = ob.key;
                const item = (id in this.data.items) ? this.data.items[id] : new AicItem();
                item.id = id;
                item.lang = ob.lang;
                item.code = ob.code;
                item.text = ob.text;
                this.data.items[id] = item;
                let index = ids.indexOf(id);
                if (index >= 0) {
                    ids.splice(index, 1);
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

export class AicADataManager extends AicDataManager {
    constructor(section: VfrSection, db: DBWrapper) {
        super(db.table(AicATable), section, "aic-a");
    }
}
export class AicBDataManager extends AicDataManager {
    constructor(section: VfrSection, db: DBWrapper) {
        super(db.table(AicBTable), section, "aic-b");
    }
}