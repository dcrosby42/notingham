import MyEditor from "./MyEditor.js"
import BoardManager from "./BoardManager.js"
import BoardView from "./BoardView.js"
import Data from "./Data.js"
import NoteSearcher from "./NoteSearcher.js"
import ItemSearcher from "./ItemSearcher.js"
import MessageBus from "./MessageBus.js"
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'
import CommandPalette from "./CommandPalette.js"
import CollapsingPanel from "./CollapsingPanel.js"
import { bindKeys, DefaultKeybinds } from "./Keyboard.js"
import { arrayMove, arrayMoveItemLeft, arrayMoveItemRight } from "./utils.js"

const SAVE_DELAY = 1000

const BuiltinCommands = [
    {
        title: "Delete Note",
        description: "Delete the currently editing note",
        commandFunc: main => main.deleteCurrentNote(),
    },
]



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
            failedSaves: {},
            navRecents: [],
            navIndex: 0,
            panelStates: {
                pinnedNotes: true,
                boards: true,
                search: true,
            },
            boards: [],
            selectedBoardId: null,
            boardSearcher: null,
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

        this.pinnedNoteIds = Data.Prefs.pinnedNotes || []
        Data.Prefs.pinnedNoteIds = this.pinnedNoteIds // save em back just in case

        this.navRecents = Data.Prefs.navRecents || []
        this.navIndex = Data.Prefs.navIndex || 0
        this.navigateHistory(0)

        this.boards = BoardManager.getBoards()
        this.boardSearcher = Vue.shallowRef(new ItemSearcher(this.boards, { index: ['name'] }))
        // this.selectedBoardId = "2"

        //
        // Handling NoteAPi errors:
        //

        const store = new ObjectStorage(window.localStorage)

        MessageBus.subscribe({
            event: "NotesApi.error",
            token: "mainSubs",
            callback: data => {
                if (data.method === "save") {
                    const note = data.note
                    const error = data.error
                    const msg = `FAILED TO SAVE NOTE ${(note && note.id) || "??"} '${note.name}'`
                    console.error(msg, error);
                    if (note) {
                        const tstamp = (new Date()).toString()
                        store.objectSet("FAILED_SAVES", note.id, { name: note.name, note, tstamp, error })
                    }
                    this.failedSaves = store.get("FAILED_SAVES")
                    alert(msg)
                } else if (data.method === "delete") {
                    console.error("FAILED delete():", data)

                } else if (data.method === "getAll") {
                    console.error("FAILED getAll():", data.error)
                }
            }
        })
        MessageBus.subscribe({
            event: "NotesApi.saved",
            token: "mainSubs",
            callback: data => {
                const note = data.note
                if (store.objectGet("FAILED_SAVES", note.id)) {
                    const msg = `Clearing failed-save state for ${(note && note.id) || "??"} '${note.name}' -- Saved successfully just now`
                    console.log(msg)
                    store.objectDelete("FAILED_SAVES", data.note.id)
                }
                this.failedSaves = store.get("FAILED_SAVES")
            }
        })
        MessageBus.subscribe({
            event: "NotesApi.deleted",
            token: "mainSubs",
            callback: data => {
                data.note
            }
        })

        this.failedSaves = store.get("FAILED_SAVES")
    },
    unmounted() {
        MessageBus.unsubscribe({ token: "mainSubs" })
    },
    methods: {
        navItemStyle(active) {
            return {
                'note-link': true,
                'has-text-light': this.darkMode,
                'has-background-dark': this.darkMode && !active,
                'is-active': active,
            }
        },
        noteItemStyle(note) {
            const active = note.id == this.selectedId
            return _.merge(this.navItemStyle(active), {
                'save-error': _.has(this.failedSaves, note.id),
            })
        },
        boardItemStyle(board) {
            const active = board.id == this.selectedBoardId
            return this.navItemStyle(active)
        },
        trackChangedNote(note) {
            console.log("trackChangedNote:", note)
            window.LastTrackedNote = note
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
            const dateStr = _.take(_.drop((new Date()).toString().split(" "), 1), 3).join(" ")
            const note = { id: uuidv4(), content: `# New Note\n\n${dateStr}\n` }
            Data.Notes.updateNoteName(note)
            this.noteSearcher.add(note)
            this.notes.push(note)
            this.selectNote(note.id)
            // deferred persistence:
            this.changedNotes.set(note.id, note)
            this.persistChangedNotes()
        },
        async deleteCurrentNote(note, { promptConfirm = true } = {}) {
            if (promptConfirm && !confirm("DELETE NOTE?\n\"" + this.selectedNote.name + "\"")) {
                console.log("Cancel delete")
            }
            // delete on the server
            await Data.Notes.delete(note)
            // deselect
            this.selectedId = null
            // remove from the note list
            _.pull(this.notes, note)
            // remove from the search index
            this.noteSearcher.remove(note)
        },
        selectPinnedNote(i) {
            const note = this.pinnedNotes[i]
            if (note) {
                this.selectNote(note.id)
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
            arrayMoveItemLeft(this.pinnedNoteIds, this.selectedId)
            Data.Prefs.pinnedNotes = this.pinnedNoteIds
        },
        movePinnedNoteDown() {
            arrayMoveItemRight(this.pinnedNoteIds, this.selectedId)
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
        // toggleLink() {
        //     this.$refs.myEditor.toggleLink()
        // },
        toggleTask() {
            this.$refs.myEditor.toggleTask()
        },
        openCommandPalette({ mode } = {}) {
            let initSearchString = ""
            if (mode && mode == "command") {
                initSearchString = ">"
            }
            if (this.commandPaletteShowing) {
                this.$refs.commandPalette.searchString = initSearchString
            } else {
                this.commandPaletteShowing = true
                this.$nextTick(function () {
                    if (this.$refs.commandPalette) {
                        this.$refs.commandPalette.focus()
                    } else {
                        console.warn("can't focus command palette, $refs.commandPalette not set?")
                    }
                    this.$refs.commandPalette.searchString = initSearchString
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
        selectNote(noteId, { track = true } = {}) {
            this.unselectBoard()
            this.selectedId = noteId
            if (track) {
                this.updateNavHistory("note", noteId)
            }
        },
        saveBoards() {
            BoardManager.saveBoards(this.boards)
        },
        selectBoard(boardId, { track = true } = {}) {
            if (this.selectedBoardId) {
                this.unselectBoard()
                this.$nextTick(() => { this.selectedBoardId = boardId })
            } else {
                this.selectedBoardId = boardId
            }
            if (track) {
                this.updateNavHistory("board", boardId)
            }
        },
        unselectBoard() {
            this.selectedBoardId = null
        },
        addNoteToBoard(noteId, boardId) {
            const board = this.boardsById[boardId]
            if (!board.noteIds) { board.noteIds = [] }
            if (!_.includes(board.noteIds, noteId)) {
                board.noteIds.push(noteId)
                this.saveBoards()
            }
        },
        removeNoteFromBoard(noteId) {
            if (this.selectedBoard) {
                this.selectedBoard.noteIds = _.reject(this.selectedBoard.noteIds, id => id === noteId)
                this.saveBoards()
            }
        },
        altSelectNote(noteId) {
            if (this.selectedBoardId) {
                this.addNoteToBoard(noteId, this.selectedBoardId)
            }
        },
        getCpChoices(searchString) {
            const choices = []
            // if (searchString.startsWith(">")) {
            //     const term = searchString.slice(1).trimStart()
            //     const commands = this.commander.search(term)
            //     return commands.map(cmd => {
            //         return {
            //             kind: "command",
            //             text: cmd.title,
            //             data: cmd,
            //         }
            //     })
            // } else {
            {
                const maxBoardResults = 10
                let boards = []
                if (searchString.length > 0) {
                    boards.push(...this.boardSearcher.search(searchString))
                } else {
                    boards.push(...this.boardSearcher.search(null))
                }
                const boardChoices = _.take(boards, maxBoardResults).map(board => {
                    return {
                        kind: "board",
                        text: board.name,
                        data: board,
                    }
                })
                choices.push(...boardChoices)
            }
            {
                const maxResults = 30
                let notes = []
                if (searchString.length > 0) {
                    notes.push(...this.noteSearcher.search(searchString))
                } else {
                    notes.push(...this.noteSearcher.search(null))
                }
                const noteChoices = _.take(notes, maxResults).map(note => {
                    return {
                        kind: "note",
                        text: note.name,
                        data: note,
                    }
                })
                choices.push(...noteChoices)
            }


            return choices
            // }
        },
        commandPaletteSelection(choice) {
            this.closeCommandPalette()
            if (choice.kind === "note") {
                //
                // A Note was selected from the Palette
                //
                this.selectNote(choice.data.id)

            } else if (choice.kind === "board") {
                //
                // A Board was selected from the Palette
                this.selectBoard(choice.data.id)

            } else if (choice.kind === "command") {
                //
                // A Command was selected from the Palette
                //
                if (choice.data && choice.data.commandFunc) {
                    choice.data.commandFunc(this)
                } else {
                    console.log("Unhandled command?", choice)
                }
            }
        },
        updateNavHistory(kind, id) {
            const existsAt = _.find(this.navRecents, hitem => hitem.kind === kind && hitem.id === id)
            // if (_.includes(this.navRecents, noteId)) {
            if (existsAt >= 0) {
                // Promote already-visited item
                arrayMove(this.navRecents, existsAt, this.navRecents.length - 1)
            } else {
                // new doc id
                this.navRecents.push({ kind, id })
            }


            // Constrain nav history size:
            const max = 100
            const over = this.navRecents.length - max
            if (over > 0) {
                this.navRecents = this.navRecents(over)
            }
            this.navIndex = this.navRecents.length - 1
            Data.Prefs.navIndex = this.navIndex
            Data.Prefs.navRecents = this.navRecents
        },
        clearNavHistory() {
            this.navRecents = []
            Data.Prefs.navRecents = []
        },
        navBack() {
            this.navigateHistory(-1)
        },
        navForward() {
            this.navigateHistory(+1)
        },
        navigateHistory(move) {
            this.navIndex = (_.clamp(this.navIndex + move, 0, this.navRecents.length - 1))
            Data.Prefs.navIndex = this.navIndex
            const histItem = this.navRecents[this.navIndex]
            console.log("navigateHistory", { move, histItem })
            if (histItem) {
                if (histItem.kind === "note" && !_.isEmpty(histItem.id)) {
                    this.selectNote(histItem.id, { track: false })
                } else if (histItem.kind === "board" && !_.isEmpty(histItem.id)) {
                    this.selectBoard(histItem.id, { track: false })
                }
            }
        },
        isPanelOpen(name) {
            return !!this.panelStates[name]
        },
        togglePanel(name) {
            this.panelStates[name] = !this.panelStates[name]
        }
    },
    computed: {
        notesById() {
            return _.keyBy(this.notes, "id")
        },
        noteCount() {
            return _.size(this.notes)
        },
        filteredNotes() {
            if (!this.loaded) {
                return []
            }
            const _ = this.noteCount // KEEPME: ignorant trick to force filteredNotes to react to changes in this.notes array
            if (this.searchString.length > 0) {
                return this.noteSearcher.search(this.searchString)
            } else {
                return []
            }
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
        themeStyles() {
            return {
                "has-background-dark": this.darkMode,
                "has-text-white": this.darkMode,
            }
        },
        errorCount() {
            return _.size(this.failedSaves)
        },
        boardsById() {
            return _.keyBy(this.boards, "id")
        },
        selectedBoard() {
            if (this.loaded && this.selectedBoardId != null) {
                return this.boardsById[this.selectedBoardId]
            }
            return null;
        },
        showingBoard() {
            return !!this.selectedBoard
        },
        showingEditor() {
            return !this.showingBoard
        },

    },
    template: `
    <div class="notingham-root simple-editor-grid" style="position:relative" :class="[rootStyles, themeStyles]">


      <!-- LEFT BAR -->
      <div class="simple-editor-grid--leftbar">
          <p class="menu-label">
            Notingham
          </p>
          <div v-if="errorCount > 0" style="color: red">
              {{errorCount}} SAVE ERRORS - see Main.failedSaves
          </div>

          <!--
            "New Note" button
          -->
          <div>
              <button class="button is-small" @click="newNote">New</button>
          </div>

          <!--
            Pinned notes
          -->
          <collapsing-panel title="Pinned Notes" panel="pinnedNotes" :panelStates="panelStates" :togglePanel="togglePanel">
            <ul>
                <li v-for="note,i in pinnedNotes" 
                    class="leftbar-notelist-note"
                    @click="selectNote(note.id)" 
                    @click.right.prevent="altSelectNote(note.id)" 
                    >{{i+1}}. <a :class="noteItemStyle(note)">{{note.name}}</a>
                </li>
            </ul>
          </collapsing-panel>

          <!--
            Boards
          -->
          <collapsing-panel title="Boards" panel="boards" :panelStates="panelStates" :togglePanel="togglePanel">
            <ul>
                <li v-for="board,i in boards" @click="selectBoard(board.id)" class="leftbar-notelist-note">{{i+1}}. <a :class="boardItemStyle(board)">{{board.name}}</a></li>
            </ul>
          </collapsing-panel>

          <!--
            Search
          -->
          <collapsing-panel title="Search" panel="search" :panelStates="panelStates" :togglePanel="togglePanel">
            <div>
              <input v-model="searchString" type="text" placeholder="Search notes" class="input is-small" :class="themeStyles">
            </div>
            <!-- Filtered list -->
            <div :class="themeStyles" style="overflow: auto">
              <ul style="overflow:auto">
                <li v-for="note in filteredNotes" 
                    @click="selectNote(note.id)" 
                    @click.right.prevent="altSelectNote(note.id)" 
                    class="leftbar-notelist-note">
                    <a :class="noteItemStyle(note)">{{note.name}}</a>
                </li>
              </ul>
            </div>
          </collapsing-panel>

      </div>


      <MyEditor v-if="showingEditor" v-model="currentContent" ref="myEditor"
         :darkMode="darkMode"
         :toolbarVisible="toolbarVisible"
         :editorMode="editorMode"
         />

      <BoardView v-if="showingBoard" 
        :board="selectedBoard"
        :allNotes="notes"
        @note-edited="trackChangedNote"
        @board-edited="saveBoards"
        @closed="unselectBoard"
        @note-closed="removeNoteFromBoard"
        @note-navigated="selectNote"
        :darkMode="darkMode"
        />

      <CommandPalette v-if="commandPaletteShowing"
        :getChoices="getCpChoices"
        @chosen="commandPaletteSelection"
        ref="commandPalette"
      />

    </div>
  `,
    components: {
        MyEditor,
        BoardView,
        CommandPalette,
        CollapsingPanel,
    }
}
