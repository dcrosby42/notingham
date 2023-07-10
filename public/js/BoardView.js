import MyEditor2 from "./MyEditor2.js"

const BoardView = {
    props: {
        board: Object,
        allNotes: Array,
        darkMode: { type: Boolean, required: false, default: true },
    },
    data() {
        return {
            focusedNoteId: null,
            // noteCols: 3,
            editorHeight: "500px",
        }
    },
    methods: {
        closeBoard() {
            this.$emit('closed')
        },
        noteFocused(note) {
            this.focusedNoteId = note.id
        },
        noteUnfocused(note) {
            this.focusedNoteId = null
        },
        closeNote(note) {
            this.$emit("note-closed", note.id)
        },
        notifyBoardEdited() {
            this.$emit("board-edited", this.board)
        }
    },
    computed: {
        notesById() {
            return _.keyBy(this.allNotes, "id")
        },
        notes() {
            return _.map(this.board.noteIds, id => this.notesById[id])
        },
        noteCols: {
            get() {
                return (this.board.view.columns || 3)
            },
            set(val) {
                this.board.view.columns = val
                this.notifyBoardEdited()
            }
        },
        noteRows() {
            const noteRows = _(this.notes).chunk(this.noteCols).value()
            return noteRows
        },
        noteTileStyles() {
            return {
                "has-text-light": this.darkMode,
                "has-background-dark": this.darkMode,
            }
        }
    },
    template: `
      <div class="board-root">
          <div class="tile is-vertical is-ancestor">
            <div class="tile is-parent">
              <div class="tile is-child">
                <h2>{{board.name}} Board
                <button @click="closeBoard()">X</button>
                </h2>
              </div>
              <div class="tile is-child">
                Across:
                <button @click="noteCols = 1">1</button>
                <button @click="noteCols = 2">2</button>
                <button @click="noteCols = 3">3</button>
                <button @click="noteCols = 4">4</button>
                <!-- Tall:
                <button @click="editorHeight = '300px'">S</button>
                <button @click="editorHeight = '600px'">M</button>
                <button @click="editorHeight = '900px'">L</button> -->
              </div>
            </div>
            <div v-for="row in noteRows" class="tile is-parent editor-tile-row">
                <div v-for="note in row" class="tile is-child" :class="noteTileStyles">
                  <div @mouseover="" @mouseleave="">
                    <button @click="closeNote(note)">X</button>
                  </div>
                  <MyEditor2
                     :note="note"
                     @content-changed="$emit('note-edited',note)"
                     @focus="noteFocused(note)"
                     @blur="noteUnfocused(note)"
                     class="editor-tile"
                     :height="editorHeight"
                     :darkMode="darkMode"
                     :toolbarVisible="false"
                     :editorMode="'wysiwyg'"
                     :key="note.id"
                     />
                </div>
              </div>
          </div>
      </div>
    `,
    components: {
        MyEditor2,
    }
}

export default BoardView
