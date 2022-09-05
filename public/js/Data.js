import NotesApi from "./NotesApi.js"
import PrefsApi from "./PrefsApi.js"

const Data = {
    Notes: new NotesApi(),
    Prefs: new PrefsApi(),
}

export default Data