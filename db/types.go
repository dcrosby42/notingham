package db

import "github.com/google/uuid"

type Repo interface {
	GetNotebook(string) (Notebook, error)
	ListNotebookNames() ([]string, error)
}

type Notebook interface {
	AllNotes() ([]Note, error)
	AllNoteIds() ([]string, error)
	GetNote(id string) (Note, error)
	SaveNote(Note) error
	DeleteNote(string) error
}

type Note struct {
	Id      string `json:"id"`
	Content string `json:"content"`
}

func NoteId() string {
	return uuid.New().String()
}
