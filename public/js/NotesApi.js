class NotesApi {
    async getAll() {
        const resp = await fetch("/api/v1/notebooks/Personal/notes")
        const notes = await resp.json()
        notes.forEach(note => {
            note.type = "note"
            note.name = computeNoteName(note)
        })
        return notes
    }
    async save(note) {
        const resp = await fetch(`/api/v1/notebooks/Personal/notes/${note.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: note.id, content: note.content })
        })
        const rbody = await resp.json()
        // ? rbody
    }

}
function computeNoteName(note) {
    let name = ""
    const lines = note.content.split("\n");
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
export default NotesApi