import MyEditor2 from "./MyEditor2.js"
import { arrayMoveItemLeft, arrayMoveItemRight } from "./utils.js"

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
            editorByNoteId: {},
        }
    },
    // mounted() {
    //     console.log("mounted")
    //     this.$nextTick(() => { console.log("mounted_nextTick") })
    // },
    // updated() {
    //     console.log("updated")
    // },
    methods: {
        closeBoard() {
            this.$emit('closed')
        },
        noteFocused(note) {
            console.log(note.id)
            this.focusedNoteId = note.id
            this.$emit("note-focused", note.id)
        },
        noteUnfocused(note) {
            this.focusedNoteId = null
            this.$emit("note-unfocused")
        },
        closeNote(note) {
            this.$emit("note-closed", note.id)
        },
        notifyBoardEdited() {
            this.$emit("board-edited", this.board)
        },
        moveNoteUp(note) {
            arrayMoveItemLeft(this.board.noteIds, note.id)
            this.notifyBoardEdited()
        },
        moveNoteDown(note) {
            arrayMoveItemRight(this.board.noteIds, note.id)
            this.notifyBoardEdited()
        },

        onEditorLoaded({ editor, note }) {
            // const ed = this.editorForNoteId(note.id)
            // if (ed) {
            //     ed.toolbarVisibleState = true
            // }

            // console.log("onEditorLoaded", { editor, note })
            // const ed = _.find(this.$refs.editors, ed => ed.note.id === note.id)
            // console.log("onEditorLoaded", ed)
            // this.editorsByNoteId[note.id] = Vue.shallowRef(editor)
            // this.editorsByNoteId[note.id] = editor
        },
        editorForNoteId(noteId) {
            return _.find(this.$refs.editors, ed => ed.note.id === noteId)
        },
        editor_toggleToolbarVisible() {
            const ed = this.editorForNoteId(this.focusedNoteId)
            if (ed) {
                ed.toolbarVisibleState = !ed.toolbarVisibleState
            }
        },
        editor_toggleEditorMode() {
            const ed = this.editorForNoteId(this.focusedNoteId)
            if (ed) {
                if (ed.editorModeState === 'wysiwyg') {
                    ed.editorModeState = 'markdown'
                } else {
                    ed.editorModeState = 'wysiwyg'
                }
            }
        },
        editor_addUrl() {
            const ed = this.editorForNoteId(this.focusedNoteId)
            if (ed) {
                const doIt = () => ed.startAddLink()
                if (ed.toolbarVisibleState) {
                    ed.startAddLink()
                } else {
                    // toolbar must be showing
                    ed.toolbarVisibleState = true
                    this.$nextTick(() => ed.startAddLink())
                }
            }
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
                    <button @click="$emit('note-navigated',note.id)">Open</button>
                    <button @click="moveNoteUp(note)">&lt;</button>
                    <button @click="moveNoteDown(note)">&gt;</button>
                    <button @click="closeNote(note)">X</button>
                  </div>
                  <MyEditor2
                    ref="editors"
                     :note="note"
                     @content-changed="$emit('note-edited',note)"
                     @focus="noteFocused(note)"
                     @blur="noteUnfocused(note)"
                     @editor-loaded="editor => onEditorLoaded({editor,note})"
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
