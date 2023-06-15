package fsdb

import (
	"errors"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/dcrosby42/notingham/db"
	"github.com/dcrosby42/notingham/util"
	"github.com/samber/lo"
)

const NoteFileExt = ".md"

type Notebook struct {
	Dir string
}

func NewNotebook(dir string) (*Notebook, error) {
	notebook := &Notebook{Dir: dir}
	err := notebook.setupDirs()
	if err != nil {
		return nil, err
	}
	return notebook, nil
}

func (me *Notebook) setupDirs() error {
	subdirs := []string{"notes"} // objects assets trash
	for _, subdir := range subdirs {
		err := os.MkdirAll(path.Join(me.Dir, subdir), 0755)
		if err != nil {
			return err
		}
	}
	return nil
}

func (me *Notebook) notePath(id string) string {
	return path.Join(me.notesDir(), id+NoteFileExt)
}
func (me *Notebook) idFromPath(notePath string) string {
	return strings.TrimSuffix(filepath.Base(notePath), filepath.Ext(notePath))
}
func (me *Notebook) isNoteFile(notePath string) bool {
	return filepath.Ext(notePath) == NoteFileExt
}

func (me *Notebook) notesDir() string {
	return path.Join(me.Dir, "notes")
}

func (me *Notebook) SaveNote(note db.Note) error {
	if note.Id == "" {
		return errors.New("cannot write note with blank id")
	}
	return os.WriteFile(me.notePath(note.Id), []byte(note.Content), 0644)
}

func (me *Notebook) GetNote(id string) (note db.Note, err error) {
	var data []byte
	data, err = os.ReadFile(me.notePath(id))
	if err != nil {
		return
	}
	note = db.Note{Id: id, Content: string(data)}
	return
}

func (me *Notebook) DeleteNote(id string) error {
	if id == "" {
		return errors.New("cannot delete with blank id")
	}
	return os.Remove(me.notePath(id))
}

func (me *Notebook) NoteExists(id string) bool {
	return util.FileExists(me.notePath(id))
}

func (me *Notebook) AllNotes() ([]db.Note, error) {
	ids, err := me.AllNoteIds()
	if err != nil {
		return nil, err
	}
	var oops error
	notes := lo.Map(ids, func(id string, i int) db.Note {
		note, err := me.GetNote(id)
		if err != nil {
			oops = err
			return db.Note{}
		}
		return note
	})

	if oops != nil {
		return nil, oops
	}

	return notes, nil
}

func (me *Notebook) AllNoteIds() ([]string, error) {
	ids := make([]string, 0)
	err := filepath.Walk(me.notesDir(), func(fullPath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && me.isNoteFile(fullPath) {
			ids = append(ids, me.idFromPath(fullPath))
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return ids, nil
}

// AllNotes() ([]Note, error)
// AllNoteIds() ([]string, error)
// GetNote(id string) (Note, error)
// SaveNote(Note) (Note, error)
// DeleteNote(string) (Note, error)
