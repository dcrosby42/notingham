package repo

import (
	"io/fs"
	"os"
	"path/filepath"

	"github.com/dcrosby42/notingham/db"
	"github.com/dcrosby42/notingham/fsdb"
	"github.com/samber/lo"
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

func (me *Repo) ListNotebookNames() ([]string, error) {
	entries, err := os.ReadDir(me.RepoDir)
	if err != nil {
		return nil, err
	}
	names := lo.FilterMap(entries, func(entry fs.DirEntry, i int) (string, bool) {
		if !entry.IsDir() {
			return "", false
		}

		return entry.Name(), true
	})
	return names, nil
}
