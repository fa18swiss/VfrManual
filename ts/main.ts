import {VfrSection} from "./components";
import {AicATable, AicBTable, DabsTable, VftTable} from "./constants";
import {DabsDataManager} from "./Dabs";
import {VfrManualDataManager} from "./VfrManual";
import {BaseDataManager} from "./abstract";
import {DBWrapper} from "./db";
import {AicADataManager, AicBDataManager} from "./aic";

customElements.define("vfr-section", VfrSection);

async function app() {
    const sectionVfrManual : VfrSection = <VfrSection>document.getElementById("VfrManual");
    const sectionDabs : VfrSection = <VfrSection>document.getElementById("Dabs");
    const sectionAicA : VfrSection = <VfrSection>document.getElementById("AicA");
    const sectionAicB : VfrSection = <VfrSection>document.getElementById("AicB");

    const db = new DBWrapper("App", 3, (e, d) => {
        if (e.oldVersion < 1) d.createObjectStore(VftTable);
        if (e.oldVersion < 2) d.createObjectStore(DabsTable);
        if (e.oldVersion < 3) {
            d.createObjectStore(AicATable);
            d.createObjectStore(AicBTable);
        }
    })
    await db.open();

    const dataManagers: BaseDataManager<any>[] = [];
    dataManagers.push(new VfrManualDataManager(sectionVfrManual, db));
    dataManagers.push(new DabsDataManager(sectionDabs, db));
    dataManagers.push(new AicADataManager(sectionAicA, db));
    dataManagers.push(new AicBDataManager(sectionAicB, db));

    for(let dataManager of dataManagers){
        await dataManager.load();
    }

    for(let dataManager of dataManagers){
        await dataManager.refresh(false);
    }

    await Promise.all(dataManagers.map(d => d.checkLast()));
}

window.onload = app;
