const extractTagsFromLine = line =>
    _(line.split(/\s+/))
        .filter(word => word.length > 1 && word.startsWith('#')) // only words like #thing-tagger
        .map(word => word.substr(1))
        .value();

const extractTagsFromContent = content =>
    _(content.split("\n")).flatMap(extractTagsFromLine).map(_.toLower).value();

class TagMap {
    constructor() {
        this.tags_to_ids = {}
        this.ids_to_tags = {}
    }

    get(tag) {
        return this.tags_to_ids[tag] || []
    }

    has(tag) {
        const ids = this.get(tag)
        return ids && ids.length > 0
    }

    add(tag, id) {
        let ids = this.tags_to_ids[tag]
        if (!ids) {
            ids = []
            this.tags_to_ids[tag] = []
        }
        ids.push(id)

        let tags = this.ids_to_tags[id]
        if (!tags) {
            tags = []
            this.ids_to_tags[id] = tags
        }
        tags.push(tag)
    }

    remove(id) {
        const tags = this.ids_to_tags[id]
        if (!tags) { return }
        tags.forEach(tag => {
            const ids = this.tags_to_ids[tag]
            const i = ids.indexOf(id)
            if (i >= 0) {
                ids.splice(i, 1)
            }
        })
        delete this.ids_to_tags[id]
    }
}

class TagSearchModel {
    constructor(notes) {
        this.tagmap = new TagMap()
        notes.forEach(n => this.add(n))
    }

    search(str) {
        const tags = extractTagsFromLine(str)
        if (tags.length > 0) {
            const tag = tags[0]
            return this.tagmap.get(tag.toLowerCase())
        }
        return []
    }

    add(note) {
        extractTagsFromContent(note.content).forEach(tag => this.tagmap.add(tag, note.id))
    }

    update(note) {
        this.remove(note)
        this.add(note)
    }

    remove(note) {
        this.tagmap.remove(note.id)
    }
}

export default class NoteSearcher {
    constructor(notes) {
        this.notes = notes
        this.notesById = _.keyBy(this.notes, "id")
        this._reset() // searchModel, tagSearchModel
    }
    search(str) {
        if (!str || str.length === 0) {
            return [...this.notes]

        } else if (str.startsWith("#")) {
            return _(this.tagSearchModel.search(str))
                .uniq()
                .map(id => this.notesById[id])
                .value()

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
        this.tagSearchModel.update(note)
    }

    remove(note) {
        this.searchModel.remove(note.id)
        this.tagSearchModel.remove(note)
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

        this.tagSearchModel = new TagSearchModel(this.notes)
    }
}
