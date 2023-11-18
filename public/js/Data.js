import NotesApi from "./NotesApi.js"
import PrefsApi from "./PrefsApi.js"

const Data = {
    Notes: new NotesApi(),
    Prefs: new PrefsApi(),
}

if (window) {
    // DELETEME debugging
    window.Data = Data
}
export default Data