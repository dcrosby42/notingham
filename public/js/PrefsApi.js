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
    get lastSelectedId() {
        return this._storage.get("prefs.lastSelectedId")
    }
    set lastSelectedId(val) {
        this._storage.set("prefs.lastSelectedId", val)
        return val
    }
    get navRecents() {
        return this._storage.get("prefs.navRecents")
    }
    set navRecents(val) {
        this._storage.set("prefs.navRecents", val)
        return val
    }
    get navIndex() {
        return this._storage.get("prefs.navIndex")
    }
    set navIndex(val) {
        this._storage.set("prefs.navIndex", val)
        return val
    }
}
if (window) {
    window.PrefsApi = PrefsApi
}
export default PrefsApi
