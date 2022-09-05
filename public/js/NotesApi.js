class NotesApi {
    async getAll() {
        const resp = await fetch("/api/v1/notebooks/Personal/notes")
        const notes = await resp.json()
        return notes
    }
}
export default NotesApi