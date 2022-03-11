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
        <aside class="menu leftbar">
          <p class="menu-label">
            Notingham
          </p>
          <ul class="menu-list">
            <li>
              <a>Notes</a>
              <div class="note-list">
                <ul>
                    <li v-for="note,i in noteRefs" @click="selectedIdx = i"><a :class="{'is-active':note.active}">{{note.name}}</a></li>
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