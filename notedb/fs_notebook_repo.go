package notedb

import (
	"path/filepath"
)

type FsNotebookRepo struct {
	Dir       string
	Notebooks map[string]Notebook
}

func NewFsNotebookRepo(dir string) Repo {
	return &FsNotebookRepo{
		Dir:       dir,
		Notebooks: make(map[string]Notebook),
	}
}
func (me *FsNotebookRepo) GetNotebook(id string) (Notebook, error) {
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
