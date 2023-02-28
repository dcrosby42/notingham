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
    clear() {
        this.storage.clear()
    }
}
export default ObjectStorage