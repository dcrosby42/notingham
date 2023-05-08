package fsdb

import (
	"errors"
	"os"
	"path"
)

type Notebook struct {
	Dir string
}

func GetNotebook(dir string) (*Notebook, error) {
	notebook := &Notebook{Dir: dir}
	err := notebook.setupDirs()
	if err != nil {
		return nil, err
	}
	return notebook, nil
}

func (me *Notebook) setupDirs() error {
	subdirs := []string{"notes"}
	for _, subdir := range subdirs {
		err := os.MkdirAll(path.Join(me.Dir, subdir), 0755)
		if err != nil {
			return err
		}
	}
	return nil
}

func (me *Notebook) WriteNote(id, content string) error {
	if id == "" {
		return errors.New("cannot write note with blank id")
	}
	return os.WriteFile(path.Join(me.Dir, "notes", id), []byte(content), 0644)
}

func (me *Notebook) ReadNote(id string) (string, error) {
	data, err := os.ReadFile(path.Join(me.Dir, "notes", id))
	if err != nil {
		return "", err
	}

	return string(data), nil
}
