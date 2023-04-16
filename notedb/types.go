package notedb

type Repo interface {
	GetNotebook(string) (Notebook, error)
}

type Notebook interface {
	AllNotes() ([]Note, error)
	AllNoteIds() ([]string, error)
	GetNote(id string) (Note, error)
	SaveNote(Note) (Note, error)
	DeleteNote(string) (Note, error)
}

type Note struct {
	Id      string `json:"id"`
	Content string `json:"content"`
}
