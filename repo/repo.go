package repo

import (
	"path/filepath"

	"github.com/dcrosby42/notingham/db"
	"github.com/dcrosby42/notingham/fsdb"
)

type Repo struct {
	RepoDir   string
	Notebooks map[string]db.Notebook
}

func New(repoDir string) db.Repo {
	return &Repo{
		RepoDir:   repoDir,
		Notebooks: make(map[string]db.Notebook),
	}
}
func (me *Repo) GetNotebook(notebookName string) (db.Notebook, error) {
	notebook, found := me.Notebooks[notebookName]
	if !found {
		var err error
		notebook, err = fsdb.NewNotebook(filepath.Join(me.RepoDir, notebookName))
		if err != nil {
			return nil, err
		}
		me.Notebooks[notebookName] = notebook
	}
	return notebook, nil
}
