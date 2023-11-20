import ObjectStorage from "./ObjectStorage.js"

const DefaultSettings = {
    darkMode: true,
    pinnedNotes: [],
    navRecents: [],
    lastSelectedId: null,
    navIndex: 0,
    boards: [],
}

// Write-through cache to mem, localStorage and api
class PrefsApi {
    constructor({ localObjectStore, objectsApi }) {
        this.localObjectStore = localObjectStore
        this.objectsApi = objectsApi
        this.settings = DefaultSettings
        this._syncFromBrowser()
    }

    get darkMode() {
        return this._get("darkMode")
    }
    set darkMode(val) {
        return this._set("darkMode", val)
    }

    get pinnedNotes() {
        return this._get("pinnedNotes")
    }
    set pinnedNotes(val) {
        return this._set("pinnedNotes", val)
    }

    get lastSelectedId() {
        return this._get("lastSelectedId")
    }
    set lastSelectedId(val) {
        return this._set("lastSelectedId", val)
    }

    get navRecents() {
        return this._get("navRecents")
    }
    set navRecents(val) {
        return this._set("navRecents", val)
    }

    get navIndex() {
        return this._get("navIndex")
    }
    set navIndex(val) {
        return this._set("navIndex", val)
    }

    get boards() {
        return this._get("boards")
    }
    set boards(val) {
        return this._set("boards", val)
    }

    _set(settingName, value) {
        if (this.settings[settingName] == value) {
            return
        }
        this.settings[settingName] = value
        this._syncToBrowser()
        this._syncToApi() // async! this will end up happening after the return in the bg
        return value
    }

    _get(settingName) {
        return this.settings[settingName]
    }

    _syncToBrowser() {
        this.localObjectStore.set("notingham.settings.main", this.settings)
    }
    _syncFromBrowser() {
        this.settings = this.localObjectStore.get("notingham.settings.main")
        if (!this.settings) {
            this.settings = DefaultSettings
        }
    }

    async _syncToApi() {
        return await this.objectsApi.storeObject("settings", "main", this.settings) // async!
    }

    async _migrate() {
        const store = this.localObjectStore
        this.settings = {
            darkMode: store.get("prefs.darkMode"),
            pinnedNotes: store.get("prefs.pinnedNotes"),
            navRecents: store.get("prefs.navRecents"),
            lastSelectedId: store.get("prefs.lastSelectedId"),
            navIndex: store.get("prefs.navIndex"),
            boards: store.get("prefs.boards"),
        }
        this._syncToBrowser()
        await this._syncToApi()
    }
    // notingham.notebook
    // notingham.settings.main
    // FAILED_SAVES
    //
    // prefs.boards
    // prefs.darkMode
    // prefs.pinnedNotes
    // dave
    // dave2
    // dave3
    // prefs.navRecents
    // notes_api.notebook
    // prefs.navIndex
}

if (window) {
    window.PrefsApi = PrefsApi
}
export default PrefsApi
