import MyEditor from "./MyEditor.js"
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

const SAVE_DELAY = 1000

let Search = null;

class NotesApi {
    async getAll() {
        const resp = await fetch("/api/v1/notebooks/Personal/notes")
        const notes = await resp.json()
        return notes
    }
}
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
class PrefsApi {
    constructor() {
        this._storage = new ObjectStorage(window.localStorage)
        // this._darkMode = false
    }
    get darkMode() {
        console.log("get darkmode", this._darkMode)
        return this._storage.get("prefs.darkMode")
    }
    set darkMode(val) {
        console.log("set darkmode", val)
        this._storage.set("prefs.darkMode", val)
        return val
    }
}

const Data = {
    Notes: new NotesApi(),
    Prefs: new PrefsApi(),
}

function resetSearch(notes) {
    Search = new FlexSearch.Document({
        tokenize: "forward",
        document: {
            id: "id",
            index: ["content"],
        }
    });
    notes.forEach(note => Search.add(note))
}

function computeNoteName(note) {
    let name = ""
    const lines = note.content.split("\n");
    if (lines.length > 0) {
        let i = 0
        do {
            name = lines[i].replace(/[^A-Za-z0-9-_]+/g, ' ').replace(/\s+/, ' ').trim()
            i++
        } while (i < lines.length && name === "")
    }
    if (name === "") {
        name = "Untitled"
    }
    return name
}

export default {
    data() {
        return {
            loaded: false,
            notes: null,
            selectedId: null,
            changedNotes: new Map(),
            searchString: "",
            leftbarState: "showing",
            darkMode: Data.Prefs.darkMode,
        }
    },
    created() {
        window.addEventListener("keydown", this.handleKeydown)
        window.addEventListener("keyup", this.handleKeyup)
        window.addEventListener("keypress", this.handleKeypress)
    },
    async mounted() {
        this.notes = await Data.Notes.getAll()
        resetSearch(this.notes)
        this.loaded = true;

        tinykeys(window, {
            "$mod+KeyK KeyT": () => {
                this.toggleDarkMode()
            }
            // "Shift+D": () => {
            //     alert("The 'Shift' and 'd' keys were pressed at the same time")
            // },
            // "y e e t": () => {
            //     alert("The keys 'y', 'e', 'e', and 't' were pressed in order")
            // },
            // "$mod+KeyD": () => {
            //     alert("Either 'Control+d' or 'Meta+d' were pressed")
            // },
        })

    },
    methods: {
        noteItemStyle(note) {
            return {
                'has-text-light': this.darkMode,
                'has-background-dark': this.darkMode && !note.active,
                'is-active': note.active,
            }
        },
        trackChangedNote(note) {
            this.changedNotes.set(note.id, note)
            this.persistChangedNotes()
        },
        persistChangedNotes: _.debounce(function () {
            this.changedNotes.forEach((note, id) => {
                this.saveNote(note).then(() => {
                    this.changedNotes.delete(id)
                    Search.update(note)
                })
            })
        }, SAVE_DELAY),
        async saveNote(note) {
            const resp = await fetch(`/api/v1/notebooks/Personal/notes/${note.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(note)
            })
            const rbody = await resp.json()
            console.log(`Saved note ${note.name}`)
        },
        newNote() {
            const note = { id: uuidv4(), content: "A new note!" }
            this.notes.push(note)
            Search.add(note)
            this.selectedId = note.id
            this.saveNote(note)
        },
        cycleLeftbarState() {
            const states = ["showing", "large", "hidden"]
            let i = states.indexOf(this.leftbarState) + 1
            if (i >= states.length) {
                i = 0
            }
            this.leftbarState = states[i]
        },
        toggleLeftbarShowing() {
            if (this.leftbarState == "hidden") {
                this.leftbarState = "showing"
            } else {
                this.leftbarState = "hidden"
            }
        },
        toggleDarkMode() {
            this.darkMode = !this.darkMode
            Data.Prefs.darkMode = this.darkMode
        },
        handleKeydown(e) {
            // console.log(e.key, e.metaKey)
            if (e.key === "1" && e.metaKey) {
                if (e.shiftKey) {
                    this.leftbarState = "large"
                } else {
                    this.toggleLeftbarShowing()
                }
                e.preventDefault()
            } else if (e.key === "2" && e.metaKey) {
                this.toggleDarkMode()
                e.preventDefault()
            } else if (e.key === "n" && e.metaKey) {
                e.newNote()
                e.preventDefault()
            }

            // console.log("keydown:", e)
        },
        handleKeyup(e) {
            // console.log("keyup:", e)
        },
        handleKeypress(e) {
            // console.log("keypress:", e)
        },
    },
    computed: {
        notesById() {
            return _.keyBy(this.notes, "id")
        },
        filteredNotes() {
            if (!this.loaded) {
                return []
            }
            let notes = this.notes
            if (this.searchString.length > 0) {
                notes = []
                const res = Search.search(this.searchString)
                if (res.length > 0) {
                    res.forEach(r => {
                        if (r && r.result) {
                            notes = notes.concat(r.result.map(id => this.notesById[id]))
                        }
                    })
                }
            }
            return notes;
        },
        noteRefs() {
            if (this.loaded) {
                return this.filteredNotes.map(note => {
                    return {
                        name: computeNoteName(note),
                        id: note.id,
                        active: this.selectedId == note.id,
                    }
                })
            } else {
                return [];
            }
        },
        selectedNote() {
            if (this.loaded && this.selectedId != null) {
                return this.notesById[this.selectedId]
            }
            return null;
        },
        currentContent: {
            get() {
                if (this.selectedNote) {
                    return this.selectedNote.content
                } else {
                    return ""
                }
            },
            set(val) {
                if (this.selectedNote) {
                    if (this.selectedNote.content !== val) {
                        this.selectedNote.content = val
                        this.trackChangedNote(this.selectedNote)
                    }
                    return val
                }
                return null
            }
        },
        rootStyles() {
            return {
                "leftbar-hidden": this.leftbarState == "hidden",
                "leftbar-large": this.leftbarState == "large",
            }
        },
        darkModeStyles() {
            return {
                "has-background-dark": this.darkMode,
                "has-text-white": this.darkMode,
            }
        }
    },
    template: `
    <div class="notingham-root simple-editor-grid" :class="[rootStyles, darkModeStyles]">
      <!-- LEFT BAR -->
      <div class="simple-editor-grid--leftbar">
          <p class="menu-label">
            Notingham
          </p>
          <!-- "New" button -->
          <button class="button is-small" @click="newNote">New</button>

          <!-- Search box -->
          <input v-model="searchString" type="text" placeholder="Search notes" class="input is-small" :class="darkModeStyles">

          <!-- Note list -->
          <div :class="darkModeStyles" style="overflow: auto">
            <ul style="overflow:auto">
                <li v-for="note in noteRefs" @click="selectedId = note.id" style="padding:5px;"><a :class="noteItemStyle(note)">{{note.name}}</a></li>
            </ul>
          </div>
      </div>

      <!-- MAIN CONTENT -->
      <MyEditor v-model="currentContent" :darkMode="darkMode" />
    </div>
  `,
    components: {
        MyEditor
    }
}
