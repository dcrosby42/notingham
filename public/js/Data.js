import NotesApi from "./NotesApi.js"
import PrefsApi from "./PrefsApi.js"
import ObjectsApi from "./ObjectsApi.js"

const Data = {
    Notebook: "MyNotebook"
}

if (window && window.localStorage) {
    Data.Notebook = window.localStorage["notingham.notebook"] || window.localStorage["notes_api.notebook"] || Data.Notebook
    window.localStorage["notingham.notebook"] = Data.Notebook
    console.log("Using notebook " + Data.Notebook)
}

Data.Notes = new NotesApi({ notebook: Data.Notebook })
Data.ObjectsApi = new ObjectsApi({ notebook: Data.Notebook })
Data.Prefs = new PrefsApi({
    localObjectStore: new ObjectStorage(window.localStorage),
    objectsApi: Data.ObjectsApi,
})

if (window) {
    // DELETEME debugging
    window.Data = Data
}

export default Data