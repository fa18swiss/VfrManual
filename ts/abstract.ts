import {VfrSection} from "./components"
import {DataKey} from "./constants"
import {getOrCreate} from "./functions"
import {DBTableWrapper} from "./db";
import {BiArrowRepeat} from "./icons";

export class ItemBase {
    id: string;
    downloading: boolean = false;
    hasFile: boolean = false;
}

export class Data<RowType> {
    items: { [key: string]: RowType };
    LastCheck: string;
    constructor() {
        this.items = {};
    }
}

export abstract class BaseDataManager<RowType extends ItemBase> {
    protected data: Data<RowType>;
    protected readonly section: VfrSection;
    protected readonly db: DBTableWrapper;
    protected constructor(db: DBTableWrapper, section: VfrSection) {
        this.db = db;
        this.section = section;
    }

    async load() {
        this.section.addEventListener(VfrSection.RefreshClick, _ => this.checkLast());
        this.data = new Data<RowType>();
        let data = await this.db.get(DataKey);
        if (data) {
            for (let id in data.items) {
                if (!data.items.hasOwnProperty(id)) continue;
                let item = this.parse(id, data.items[id]);
                item.downloading = false;
                this.data.items[id] = item;
            }
            this.data.LastCheck = <string>data.LastCheck;
        }
    }
    protected itemCls(item: RowType): string{
        let cls = "list-group-item list-group-item-action";
        if (item.downloading) cls += " list-group-item-info";
        if (item.hasFile) cls += " list-group-item-success";
        return cls;
    }
    protected abstract parse(id: string, item: any): RowType;
    public abstract refresh(save: boolean): Promise<void>;
    public manageDate() {
        this.section.manageDate(this.data.LastCheck)
    }

    protected manageItems(){
        let divs = this.section.dest.getElementsByTagName("a");
        let listItems: HTMLElement[] = [];
        let toRemove: HTMLElement[] = [];
        for (let i = 0; i < divs.length; i++) {
            const item = divs.item(i);
            const itemId: string = item.getAttribute("data-id");
            if (itemId === "inop") continue;
            if (itemId in this.data.items) {
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
        listItems.sort(this.sort);
        for (let i = 0; i < listItems.length; i++) {
            this.section.dest.appendChild(listItems[i]);
        }
    }
    protected abstract downloadIfNeeded(item: RowType): Promise<boolean>;
    protected abstract sort(a: HTMLElement, b: HTMLElement): number;
    private findA(e: Event) : HTMLLinkElement {
        let target: HTMLElement = <HTMLElement>e.target;
        let loopCount: number = 0
        while (true){
            if (target.tagName === "A") return <HTMLLinkElement>target;
            target = target.parentElement;
            loopCount++;
            if (loopCount > 10) throw "Too many loop count";
        }
    }
    protected async onClick(e: Event): Promise<boolean> {
        const link = this.findA(e);
        console.log("onClick", e);
        console.log("onClick2", link);
        if (!link.href.endsWith("#")) return true;
        e.preventDefault();

        const id = link.getAttribute("data-id");
        const item = this.data.items[id];
        if (item.downloading) return false;
        item.downloading = true;
        link.classList.add("list-group-item-info");

        const svg = getOrCreate(link, "svg");
        svg.outerHTML = BiArrowRepeat;

        item.hasFile = await this.downloadIfNeeded(item);
        item.downloading = false;
        await this.refresh(true);

        return false;
    }
    public abstract checkLast(): Promise<void>;

    async cleanUpItems(ids: string[]): Promise<void> {
        for(let i = 0 ; i < ids.length ; i++) {
            const id = ids[i];
            const item = this.data.items[id];
            if (item.downloading) continue;
            if (item.hasFile) {
                await this.db.delete(id);
            }
            delete this.data.items[id];
        }
        const keys = await this.db.getAllKeys();
        for(let i = 0 ; i < keys.length ; i++) {
            const key = keys[i];
            if (key === DataKey || key in this.data.items) continue;
            await this.db.delete(key);
        }
    }
}
