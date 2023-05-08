package protodb

import (
	"path/filepath"

	"github.com/dcrosby42/notingham/db"
)

type FsNotebookRepo struct {
	Dir       string
	Notebooks map[string]db.Notebook
}

func NewFsNotebookRepo(dir string) db.Repo {
	return &FsNotebookRepo{
		Dir:       dir,
		Notebooks: make(map[string]db.Notebook),
	}
}
func (me *FsNotebookRepo) GetNotebook(id string) (db.Notebook, error) {
	notebook, found := me.Notebooks[id]
	if !found {
		var err error
		notebook, err = NewFsNotebook(filepath.Join(me.Dir, id))
		if err != nil {
			return nil, err
		}
		me.Notebooks[id] = notebook
	}
	return notebook, nil
}
