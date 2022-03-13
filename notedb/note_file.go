package notedb

import (
	"io/ioutil"
	"path/filepath"
	"regexp"
	"strings"
)

type NoteFile struct {
	NotebookId string `json:"notebook_id"`
	Id         string `json:"id"`
	Path       string `json:"-"`
	Name       string `json:"name"`
	Content    string `json:"content"`
}

func NewNoteFile(nbid, id, path string) (*NoteFile, error) {
	noteFile := &NoteFile{
		NotebookId: nbid,
		Id:         id,
		Path:       path,
		Name:       strings.TrimSuffix(filepath.Base(path), filepath.Ext(path)),
	}
	err := noteFile.Load()
	if err != nil {
		return nil, err
	}
	return noteFile, nil

}
func (me *NoteFile) Load() error {
	data, err := ioutil.ReadFile(me.Path)
	me.Content = string(data)
	return err
}

var NoteFilePattern = regexp.MustCompile(`.md$`)
