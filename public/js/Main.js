import MyEditor from "./MyEditor.js"

const SAVE_DELAY = 1000

function computeNoteName(note) {
    let name = ""
    const lines = note.content.split("\n");
    if (lines.length > 0) {
        let i = 0
        do {
            name = lines[i].replace(/[^A-Za-z0-0-_]+/, ' ').replace(/\s+/, ' ').trim()
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
            selectedIdx: -1,
            changedNotes: new Map(),
            searchString: "",
        }
    },
    async mounted() {
        const resp = await fetch("/api/v1/notes")
        this.notes = await resp.json()
        this.loaded = true;
        console.log(this.notes)
    },
    methods: {
        noteItemStyle(note) {
            return {
                'has-text-light': true,
                'has-background-dark': !note.active,
                'is-active': note.active,
            }
        },
        trackChangedNote(note) {
            this.changedNotes.set(note.id, note)
            this.persistChangedNotes()
        },
        persistChangedNotes: _.debounce(function() {
            this.changedNotes.forEach((note, id) => {
                this.saveNote(note).then(
                    () => this.changedNotes.delete(id))
            })
        }, SAVE_DELAY),
        async saveNote(note) {
            console.log(`Saving note ${note.name}...`)
            const resp = await fetch(`/api/v1/notes/${note.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: note.content })
            })
            const rbody = await resp.json()
            console.log(`Saved note ${note.name}`)
        },
    },
    computed: {
        filteredNotes() {
            if (!this.loaded) {
                return []
            }
            let notes = this.notes
            if (this.searchString.length > 0) {
                notes = _.filter(notes, note => note.name.toLowerCase().indexOf(this.searchString.toLowerCase()) >= 0);
            }
            return notes;
        },
        noteRefs() {
            if (this.loaded) {
                return this.filteredNotes.map((note, i) => {
                    return {
                        name: computeNoteName(note),
                        active: this.selectedIdx == i,
                    }
                })
            } else {
                return [];
            }
        },
        selectedNote() {
            if (this.loaded && this.selectedIdx >= 0) { // && this.selectedIdx < this.notes.length) {
                return this.notes[this.selectedIdx]
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
        }
    },
    template: `
    <div class="columns">
      <div class="column is-one-fifth">
        <!-- cribbed from https://stackoverflow.com/questions/63262296/how-to-get-a-fixed-sidebar-in-bulma -->
        <aside class="menu has-background-dark has-text-white">
          <p class="menu-label">
            Notingham
          </p>
          <ul class="menu-list has-text-light">
            <li>
              <input v-model="searchString" type="text" placeholder="Search notes" class="input is-small has-background-dark has-text-white">
              <div class="note-list has-text-white">
                <ul>
                    <li v-for="note,i in noteRefs" @click="selectedIdx = i"><a :class="noteItemStyle(note)">{{note.name}}</a></li>
                </ul>
              </div>
            </li>
          </ul>
        </aside>
      </div>

      <div class="column">
        <div class="block editor-home">
          <MyEditor v-model="currentContent"/>
        </div>
      </div>
    </div>
  `,
    components: {
        MyEditor
    }
}