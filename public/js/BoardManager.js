import Data from "./Data.js"
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

export default class BoardManager {
    static getBoards() {
        const boards = Data.Prefs.boards || [
            {
                id: "defaultboard",
                name: "My Desk",
                noteIds: [],
                view: {},
            },
        ]
        this.saveBoards(boards)
        return boards
    }

    static newBoard(opts = {}) {
        return _.merge({
            id: uuidv4(),
            name: "New Board",
            noteIds: [],
            view: {},
        }, opts)
    }

    static saveBoards(boards) {
        console.log("saveBoards", boards)
        Data.Prefs.boards = boards
    }

    static cleanupNoteRefs(boards, notes) {
        const notesById = _.keyBy(notes, "id")
        _.each(boards, board => {
            _.each(board.noteIds, noteId => {
                if (!notesById[noteId]) {
                    // stale note id in board!
                    // remove
                    board.noteIds = _.reject(board.noteIds, id => id === noteId)
                }
            })
        })
    }
}
