export default class NoteSearcher {
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
                .flatMap(sr => sr.result)
                .uniq()
                .map(id => this.notesById[id])
                .value()
        }
    }
    add(note) {
        this.searchModel.add(note)
        this.notesById[note.id] = note
    }
    update(note) {
        this.searchModel.update(note)
    }

    remove(note) {
        this.searchModel.remove(note.id)
        delete this.notesById[note.id]
    }

    _reset() {
        this.searchModel = new FlexSearch.Document({
            tokenize: "forward",
            document: {
                id: "id",
                index: ["name", "content"],
            },
            preset: "score"
        });
        this.notes.forEach(n => this.searchModel.add(n))
    }
}
