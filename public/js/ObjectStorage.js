class ObjectStorage {
    constructor(storage) {
        this.storage = storage
    }
    set(key, obj) {
        this.storage.setItem(key, JSON.stringify(obj))
    }
    get(key) {
        const strVal = this.storage.getItem(key)
        if (strVal) {
            return JSON.parse(strVal)
        }
        return null
    }
    remove(key) {
        this.storage.removeItem(key)
    }
    clear(really) {
        if (really === true) {
            this.storage.clear()
        }
    }
}
if (window) {
    window.ObjectStorage = ObjectStorage
}
export default ObjectStorage
