class CachingObjectStore {
    constructor({ prefix, objectsApi, localObjectStore }) {
        this.prefix = prefix
        this.objectsApi = objectsApi
        this.localObjectStore = localObjectStore
    }

    getObject(kind, id, { refresh = False } = {}) {
        let object = this.localObjectStore.get(this._localKey(kind, id))
        if (refresh) {
            this.objectsApi.getObject(kind, id)
        }
    }

    storeObject(kind, id, object) {
    }
}