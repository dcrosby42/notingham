class NotesApi {
    static notebook() {
        const defaultName = "Netskope"
        let name = window.localStorage.getItem("notes_api.notebook")
        if (!name || name === "") {
            name = defaultName
            NotesApi.setNotebook(name)
        }
        return name
    }
    static setNotebook(name) {
        window.localStorage.setItem("notes_api.notebook", name)
    }

    async getAll() {
        const resp = await fetch(`/api/v1/notebooks/${NotesApi.notebook()}/notes`)
        const notes = await resp.json()
        notes.forEach(note => {
            note.type = "note"
            this.updateNoteName(note)
        })
        return notes
    }
    async save(note) {
        const resp = await fetch(`/api/v1/notebooks/${NotesApi.notebook()}/notes/${note.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: note.id, content: note.content })
        })
        const rbody = await resp.json()
        // ? rbody
    }

    updateNoteName(note) {
        if (note && note.content) {
            note.name = this.computeNoteTitle(note.content)
        }
    }

    computeNoteTitle(content = "") {
        let name = ""
        const lines = content.split("\n");
        if (lines.length > 0) {
            let i = 0
            do {
                name = lines[i].replace(/[^A-Za-z0-9-_]+/g, ' ').replace(/\s+/, ' ').trim()
                i++
            } while (i < lines.length && name === "")
        }
        if (name === "") {
            name = "Untitled"
        }
        return name
    }
}
if (window) {
    window.NotesApi = NotesApi
}
export default NotesApi
