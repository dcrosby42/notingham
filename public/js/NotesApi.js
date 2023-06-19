import MessageBus from "./MessageBus.js"
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
        try {
            const resp = await fetch(`/api/v1/notebooks/${NotesApi.notebook()}/notes`)
            const notes = await resp.json()
            notes.forEach(note => {
                note.type = "note"
                this.updateNoteName(note)
            })
            return notes
        } catch (e) {
            MessageBus.Default.publish({
                event: "NotesApi.error",
                data: { method: "getAll" }
            })
        }
    }
    async save(note) {
        try {
            const resp = await fetch(`/api/v1/notebooks/${NotesApi.notebook()}/notes/${note.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: note.id, content: note.content })
            })
            if (resp.ok) {
                // const _ = await resp.json()
                MessageBus.Default.publish({
                    event: "NotesApi.saved",
                    data: { method: "save", note }
                })
            } else {
                const body = await resp.text()
                const status = resp.status
                MessageBus.Default.publish({
                    event: "NotesApi.error",
                    data: { method: "save", note, status, error: `Server responded ${status}: ${body}` }
                })
            }
        } catch (e) {
            MessageBus.Default.publish({
                event: "NotesApi.error",
                data: { method: "save", note, error: e }
            })
        }
    }

    async delete(note) {
        try {
            const resp = await fetch(`/api/v1/notebooks/${NotesApi.notebook()}/notes/${note.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                // body: JSON.stringify({ id: note.id, content: note.content })
            })
            if (resp.ok) {
                MessageBus.Default.publish({
                    event: "NotesApi.deleted",
                    data: { method: "delete", note }
                })
            } else {
                const body = await resp.text()
                const status = resp.status
                MessageBus.Default.publish({
                    event: "NotesApi.error",
                    data: { method: "delete", note, status, error: `Server responded ${status}: ${body}` }
                })
            }
        } catch (e) {
            MessageBus.Default.publish({
                event: "NotesApi.error",
                data: { method: "delete", note, error: e }
            })
        }
    }

    updateNoteName(note) {
        if (note && note.content) {
            note.name = NotesApi.titleForNote(note)
        }
    }

    static titleForNote(note) {
        return NotesApi.computeNoteTitle(note.content)
    }

    static computeNoteTitle(content = "") {
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
