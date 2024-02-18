function promiseReq(req: IDBRequest) : Promise<any> {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export class DBWrapper {
    private readonly databaseName: string;
    private readonly version: number;
    private readonly onUpgradeNeeded: (event: IDBVersionChangeEvent, db: IDBDatabase) => void;
    private db : IDBDatabase

    constructor(databaseName: string, version: number, onUpgradeNeeded: (event: IDBVersionChangeEvent, db: IDBDatabase) => void) {
        this.databaseName = databaseName;
        this.version = version;
        this.onUpgradeNeeded = onUpgradeNeeded
        this.db = null;
    }

    public async open() : Promise<void> {
        if (this.db != null) throw "DB already open !";
        const request = window.indexedDB.open(this.databaseName, this.version);
        request.onupgradeneeded = event => this.onUpgradeNeeded(event, request.result);
        this.db = <IDBDatabase>await promiseReq(request);
    }

    public table(name: string) : DBTableWrapper {
        if (this.db == null) throw "DB not open";
        return new DBTableWrapper(this.db, name)
    }
}

export class DBTableWrapper {
    private readonly db: IDBDatabase;
    private readonly table: string;

    constructor(db: IDBDatabase, table: string) {
        this.db = db;
        this.table = table;
    }

    public getAllKeys() : Promise<string[]> {
        return promiseReq(this.read().getAllKeys())
    }

    public read() : IDBObjectStore {
        return this.db.transaction(this.table).objectStore(this.table);
    }

    public write() : IDBObjectStore {
        return this.db.transaction([this.table], "readwrite").objectStore(this.table)
    }

    public async containsKey(key: string) : Promise<boolean> {
        return (await promiseReq(this.read().count(key))) > 0
    }

    public get(key: string) : Promise<any>{
        return promiseReq(this.read().get(key))
    }

    public put(value: any, key: string): Promise<void> {
        return promiseReq(this.write().put(value, key))
    }

    public delete(key: string) : Promise<void>{
        return promiseReq(this.write().delete(key))
    }
}