import MyEditor from "./MyEditor.js"
import Data from "./Data.js"
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'
import { CommandPalette, CommandPaletteModel } from "./CommandPalette.js"

const SAVE_DELAY = 1000

class NoteSearcher {
    constructor(notes) {
        this.notes = notes
        this.notesById = _.keyBy(this.notes, "id")
        this._reset()
    }
    search(str) {
        if (!str || str.length === 0) {
            return [...this.notes]
        } else {
            const searchRes = this.searchModel.search(str)
            return _(searchRes)
                .flatMap(sr => sr.result.map(id => this.notesById[id]))
                .value()
        }
    }
    getText(note) {
        if (note) {
            return note.name
        }
    }
    getKind(note) {
        return "note"
    }
    add(note) {
        this.searchModel.add(note)
        this.notesById[note.id] = note
    }
    update(note) {
        this.searchModel.update(note)
    }

    _reset() {
        this.searchModel = new FlexSearch.Document({
            tokenize: "forward",
            document: {
                id: "id",
                index: ["content"],
            }
        });
        this.notes.forEach(n => this.searchModel.add(n))
    }
}

// DELETEME
// let Search = null;

// function resetSearch(notes) {
//     Search = new FlexSearch.Document({
//         tokenize: "forward",
//         document: {
//             id: "id",
//             index: ["content"],
//         }
//     });
//     notes.forEach(note => Search.add(note))
// }

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
        }
    },
    created() {
        this.persistChangedNotes = _.debounce(this._persistChangedNotes, SAVE_DELAY)
    },
    async mounted() {
        this.notes = await Data.Notes.getAll()
        this.noteSearcher = Vue.shallowRef(new NoteSearcher(this.notes))
        // resetSearch(this.notes) // DELETEME
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
            "Alt+KeyD": (e) => {
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
        // DELETEME
        // "commandPaletteModel.input": function(cpm) {
        //     console.log("watch cpm",cpm)
        // }
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
                        console.log(`filteredNotes search='${this.searchString}': search result ${i} is undefined? sres=`, sres)
                    }
                }
                return sres
            }
            return notes;
        },
        noteRefs() {
            if (this.loaded) {
                return this.filteredNotes.map(note => {
                    return {
                        note,
                        // name: note.name,
                        // id: note.id,
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
                <li v-for="ref in noteRefs" @click="selectedId = ref.note.id" style="padding:5px;"><a :class="noteItemStyle(ref)">{{ref.note.name}}</a></li>
            </ul>
          </div>
      </div>


      <!-- MAIN CONTENT -->
      <MyEditor v-model="currentContent" :darkMode="darkMode" :toolbarVisible="toolbarVisible"/>

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
