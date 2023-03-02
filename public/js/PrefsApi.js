import ObjectStorage from "./ObjectStorage.js"

class PrefsApi {
    constructor() {
        this._storage = new ObjectStorage(window.localStorage)
        // this._darkMode = false
    }
    get darkMode() {
        return this._storage.get("prefs.darkMode")
    }
    set darkMode(val) {
        this._storage.set("prefs.darkMode", val)
        return val
    }
    get pinnedNotes() {
        return this._storage.get("prefs.pinnedNotes")
    }
    set pinnedNotes(val) {
        this._storage.set("prefs.pinnedNotes", val)
        return val
    }
}
export default PrefsApi
