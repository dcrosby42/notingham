import MyEditor from "./MyEditor.js"
import Data from "./Data.js"
import NoteSearcher from "./NoteSearcher.js"
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'
import { CommandPalette, CommandPaletteModel } from "./CommandPalette.js"

import { arrayMove } from "./utils.js"

const SAVE_DELAY = 1000

const DefaultKeybinds = {
    "Escape": "closeCommandPalette",
    "$mod+KeyP": "toggleCommandPalette",
    "$mod+KeyM": "toggleEditorMode",
    "$mod+KeyK ": "addUrl",
    "Shift+Control+KeyN": "newNote",
    // "Shift+$mod+KeyP": "toggleCommandPalette",
    "Shift+Control+KeyB": "toggleLeftbarShowing",
    "Shift+Control+KeyD": "toggleDarkMode",
    "Shift+Control+KeyT": "toggleToolbarVisible",
    "Shift+Alt+KeyB": "cycleLeftbarState",
    "$mod+1": ["selectPinnedNote", 0],
    "$mod+2": ["selectPinnedNote", 1],
    "$mod+3": ["selectPinnedNote", 2],
    "$mod+4": ["selectPinnedNote", 3],
    "$mod+5": ["selectPinnedNote", 4],
    "$mod+6": ["selectPinnedNote", 5],
    "$mod+7": ["selectPinnedNote", 6],
    "$mod+8": ["selectPinnedNote", 7],
    "$mod+9": ["selectPinnedNote", 8],
    // "$mod+0": ["selectPinnedNote", 9],
    "Shift+Control+p p": "toggleNotePinned",
    "Shift+Control+p k": "movePinnedNoteUp",
    "Shift+Control+p j": "movePinnedNoteDown",
    // "$mod+k p ArrowDown": "movePinnedNoteDown",
}

const DefaultPinnedNoteIds = [
    "defedc86-8d30-424b-a7c7-66ab9b980cfb", // TODO
    "164b95bf-566c-4a65-95e9-e96492d09372", // Group Vars Getting Out
]

function bindKeys({ from, target, bindings }) {
    tinykeys(from, _.mapValues(bindings, (action, bindingExpr) => {
        let method
        let args = []
        if (_.isString(action)) {
            method = action
        } else if (_.isPlainObject(action)) {
            method = action.method
        } else if (_.isArray(action)) {
            method = action[0]
            args = _.tail(action)
        }
        if (!_.has(target, method)) {
            console.warn(`Key binding for ${bindingExpr}: method ${method} invalid`)
            method = null
        }
        return (e) => {
            if (method) {
                target[method](...args)
                e.preventDefault()
            } else {
                console.warn(`Key binding for ${bindingExpr}: no method given`)
            }
        }
    }))
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
            noteSearcher: null,
            pinnedNoteIds: [],
            editorMode: "wysiwyg",
        }
    },
    created() {
        this.persistChangedNotes = _.debounce(this._persistChangedNotes, SAVE_DELAY)
    },
    async mounted() {
        window.Main = this
        this.notes = await Data.Notes.getAll()
        this.noteSearcher = Vue.shallowRef(new NoteSearcher(this.notes))
        this.loaded = true;

        bindKeys({ from: window, target: this, bindings: DefaultKeybinds })

        this.pinnedNoteIds = Data.Prefs.pinnedNotes || _.clone(DefaultPinnedNoteIds)
        Data.Prefs.pinnedNoteIds = this.pinnedNoteIds // save em back just in case

        this.selectedId = Data.Prefs.lastSelectedId
    },
    watch: {
        // DELETEME
        // "commandPaletteModel.input": function(cpm) {
        //     console.log("watch cpm",cpm)
        // }
        selectedId: function (newId, oldId) {
            if (newId !== Data.Prefs.lastSelectedId) {
                Data.Prefs.lastSelectedId = newId
            }
        }
    },
    methods: {
        noteItemStyle(note) {
            const active = note.id == this.selectedId
            return {
                'has-text-light': this.darkMode,
                'has-background-dark': this.darkMode && !active,
                'is-active': active,
            }
        },
        trackChangedNote(note) {
            Data.Notes.updateNoteName(this.selectedNote)
            this.noteSearcher.update(note)
            // deferred persistence:
            this.changedNotes.set(note.id, note)
            this.persistChangedNotes()
        },
        _persistChangedNotes() {
            this.changedNotes.forEach((note, id) => {
                this.saveNote(note).then(() => {
                    this.changedNotes.delete(id)
                })
            })
        },
        async saveNote(note) {
            await Data.Notes.save(note)
        },
        newNote() {
            const note = { id: uuidv4(), content: "A new note!" }
            Data.Notes.updateNoteName(note)
            this.noteSearcher.add(note)
            this.notes.push(note)
            this.selectedId = note.id
            // deferred persistence:
            this.changedNotes.set(note.id, note)
            this.persistChangedNotes()
        },
        selectPinnedNote(i) {
            const note = this.pinnedNotes[i]
            if (note) {
                this.selectedId = note.id
            } else {
                console.warn("selectPinnedNote(): no pinned note at", i)
            }
        },
        toggleNotePinned() {
            if (this.selectedId) {
                const id = this.selectedId
                const i = this.pinnedNoteIds.indexOf(id)
                if (i >= 0) {
                    // id is pinned; unpin it
                    this.pinnedNoteIds.splice(i, 1)
                } else {
                    // pin the id
                    this.pinnedNoteIds.push(id)
                }
                Data.Prefs.pinnedNotes = this.pinnedNoteIds
            }
        },
        movePinnedNoteUp() {
            const i = this.pinnedNoteIds.indexOf(this.selectedId)
            const j = (i - 1) % this.pinnedNoteIds.length
            arrayMove(this.pinnedNoteIds, i, j)
            Data.Prefs.pinnedNotes = this.pinnedNoteIds
        },
        movePinnedNoteDown() {
            const i = this.pinnedNoteIds.indexOf(this.selectedId)
            const j = (i + 1) % this.pinnedNoteIds.length
            arrayMove(this.pinnedNoteIds, i, j)
            Data.Prefs.pinnedNotes = this.pinnedNoteIds
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
        toggleToolbarVisible() {
            this.toolbarVisible = !this.toolbarVisible
        },
        toggleEditorMode() {
            if (this.editorMode === 'wysiwyg') {
                this.editorMode = 'markdown'
            } else {
                this.editorMode = 'wysiwyg'
            }
            console.log("editorMode", this.editorMode)
        },
        addUrl() {
            const doIt = () => this.$refs.myEditor.startAddLink()
            if (this.toolbarVisible) {
                doIt()
            } else {
                // toolbar must be showing
                this.toolbarVisible = true
                this.$nextTick(doIt)
            }

        },
        openCommandPalette() {
            if (!this.commandPaletteShowing) {
                this.commandPaletteShowing = true
                this.$nextTick(function () {
                    if (this.$refs.commandPalette) {
                        this.$refs.commandPalette.focus()
                    } else {
                        console.warn("can't focus command palette")
                    }
                })
            }
        },
        closeCommandPalette() {
            this.commandPaletteShowing = false
        },
        toggleCommandPalette() {
            if (this.commandPaletteShowing) {
                this.closeCommandPalette()
            } else {
                this.openCommandPalette()
            }
        },
        commandPaletteSelection(choice) {
            this.closeCommandPalette()
            if (choice.kind === "note") {
                this.selectedId = choice.data.id
            }
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
                const sres = this.noteSearcher.search(this.searchString)
                // deleteme
                for (let i = 0; i < sres.length; i++) {
                    const element = sres[i];
                    if (_.isUndefined(element)) {
                        console.warn(`filteredNotes search='${this.searchString}': search result ${i} is undefined? sres=`, sres)
                    }
                }
                return sres
            }
            return notes;
        },
        pinnedNotes() {
            return _.compact(_.map(this.pinnedNoteIds, id => this.notesById[id]))
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
          <div>
              <button class="button is-small" @click="newNote">New</button>
          </div>

          <!-- Pinned notes -->
          <div :class="darkModeStyles">
            <ul>
                <li v-for="note,i in pinnedNotes" @click="selectedId = note.id" class="leftbar-notelist-note">{{i+1}}. <a :class="noteItemStyle(note)">{{note.name}}</a></li>
            </ul>
          </div>

          <!-- Search box -->
          <div style="display:flex">
            <input v-model="searchString" type="text" placeholder="Search notes" class="input is-small" :class="darkModeStyles">
          </div>

          <!-- Filtered list -->
          <div :class="darkModeStyles" style="overflow: auto">
            <ul style="overflow:auto">
                <li v-for="note in filteredNotes" @click="selectedId = note.id" class="leftbar-notelist-note"><a :class="noteItemStyle(note)">{{note.name}}</a></li>
            </ul>
          </div>
      </div>


      <!-- MAIN CONTENT -->
      <MyEditor v-model="currentContent" ref="myEditor"
         :darkMode="darkMode" 
         :toolbarVisible="toolbarVisible"
         :editorMode="editorMode"
         />

      <CommandPalette v-if="commandPaletteShowing"
        :searcher="noteSearcher"
        @chosen="commandPaletteSelection"
        ref="commandPalette" 
      />

    </div>
  `,
    components: {
        MyEditor,
        CommandPalette,
    }
}
