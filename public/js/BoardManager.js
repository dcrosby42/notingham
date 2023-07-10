import Data from "./Data.js"

export default class BoardManager {
    static getBoards() {
        const boards = Data.Prefs.boards || [
            {
                id: "1",
                name: "TODO",
                noteIds: [],
                view: {},
            },
            {
                id: "2",
                name: "Boomgate TNG",
                noteIds: [],
                view: {},
            },
            {
                id: "3",
                name: "CAP",
                noteIds: [],
                view: {},
            },
            {
                id: "4",
                name: "Meetings",
                noteIds: [],
                view: {},
            },
        ]
        this.saveBoards(boards)
        return boards
    }

    static saveBoards(boards) {
        console.log("saveBoards", boards)
        Data.Prefs.boards = boards
    }
}
