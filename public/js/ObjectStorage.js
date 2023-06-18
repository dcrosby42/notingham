class ObjectStorage {
    constructor(storage) {
        if (!storage && window && window.localStorage) {
            storage = window.localStorage
        }
        if (!storage) {
            throw new Error("ObjectStorage must be built around a localStorage-like object, not:", localStorage)
        }
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
    objectSet(name, keypath, obj) {
        let table = this.get(name)
        if (!table) {
            table = {}
        }
        _.set(table, keypath, obj)
        this.set(name, table)
    }
    objectGet(name, keypath, defval) {
        let table = this.get(name)
        if (!table) {
            table = {}
        }
        const val = _.get(table, keypath, defval)
        _.set(table, keypath, val)
        this.set(name, table)
        return val
    }
    objectDelete(name, keypath) {
        let table = this.get(name)
        if (table) {
            if (_.has(table, keypath)) {
                let owner = table
                let key = keypath
                if (_.isArray(keypath)) {
                    key = _.last(keypath)
                    const leadup = _.initial(keypath)
                    if (leadup.length > 0) {
                        owner = _.get(table, leadup)
                    }
                }
                delete owner[key]
                this.set(name, table)
            }
        }
    }
}
if (window) {
    window.ObjectStorage = ObjectStorage
}
export default ObjectStorage
