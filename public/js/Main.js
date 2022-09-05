import MyEditor from "./MyEditor.js"
import Data from "./Data.js"
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'
import {CommandPalette,CommandPaletteModel} from "./CommandPalette.js"

const SAVE_DELAY = 1000

let Search = null;


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
            toolbarVisible: true,
            commandPaletteShowing: false,
            commandPaletteModel: CommandPaletteModel.init(),
        }
    },
    async mounted() {
        this.notes = await Data.Notes.getAll()
        resetSearch(this.notes)
        this.loaded = true;

        tinykeys(window, {
            "Alt+KeyP": (e) => {
                this.openCommandPalette()
                e.preventDefault()
            },
            "Escape": (e) => {
                this.closeCommandPalette()
                e.preventDefault()
            },
            "Alt+KeyT": (e) => {
                this.toggleDarkMode()
                e.preventDefault()
            },
            "Alt+KeyY": (e) => {
                this.toolbarVisible = !this.toolbarVisible
                e.preventDefault()
            },
            "Alt+KeyB": (e) => {
                this.toggleLeftbarShowing()
                e.preventDefault()
            },
            "Shift+Alt+KeyB": (e) => {
                this.cycleLeftbarState()
                e.preventDefault()
            }
        })

    },
    watch: {
        "commandPaletteModel.input": function(cpm) {
            console.log("watch cpm",cpm)

        }
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
        openCommandPalette() {
            if (!this.commandPaletteShowing) {
                this.commandPaletteShowing = true
                this.$nextTick(function () {
                    if (this.$refs.commandPalette) {
                        this.$refs.commandPalette.focus()
                    } else {
                        console.log("can't focus command palette")
                    }
                })
            }
        },
        closeCommandPalette() {
            this.commandPaletteShowing = false
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
    <div class="notingham-root simple-editor-grid" style="position:relative" :class="[rootStyles, darkModeStyles]">

      
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
      <MyEditor v-model="currentContent" :darkMode="darkMode" :toolbarVisible="toolbarVisible"/>

      <CommandPalette v-if="commandPaletteShowing"
        v-model="commandPaletteModel" 
        ref="commandPalette" 
      />

    </div>
  `,
    components: {
        MyEditor,
        CommandPalette,
    }
}
