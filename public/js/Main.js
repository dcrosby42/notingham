import MyEditor from "./MyEditor.js"

function shortName(note) {
    return _.last(note.id.split("/")).substring(0, 20)
}
export default {
    data() {
        return {
            loaded: false,
            notes: null,
            selectedIdx: -1,
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
        }

    },
    computed: {
        noteRefs() {
            if (this.loaded) {
                return this.notes.map((n, i) => {
                    return {
                        name: shortName(n),
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
                if (this.loaded && this.selectedIdx >= 0) { // && this.selectedIdx < this.notes.length) {
                    return this.notes[this.selectedIdx].Content
                } else {
                    return ""
                }
            },
            set(val) {
                if (this.loaded && this.selectedIdx >= 0) { // && this.selectedIdx < this.notes.length) {
                    return this.notes[this.selectedIdx].Content = val
                }
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
              <input type="text" placeholder="Search notes" class="input is-small has-background-dark has-text-white">
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