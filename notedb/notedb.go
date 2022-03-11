package notedb

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
)

type NoteFile struct {
	Id      string `json:"id"`
	Path    string `json:"-"`
	Content string
}

func NewNoteFile(path string) (*NoteFile, error) {
	noteFile := &NoteFile{Id: path, Path: path}
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

type NoteDb struct {
	Dir string
}

var NoteFilePattern = regexp.MustCompile(`.md$`)

func (me *NoteDb) AllNoteFiles() ([]*NoteFile, error) {
	var noteFiles []*NoteFile
	err := filepath.Walk(me.Dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			fmt.Println(err)
			return err
		}
		if !info.IsDir() && NoteFilePattern.MatchString(path) {
			noteFile, err := NewNoteFile(path)
			if err == nil {
				noteFiles = append(noteFiles, noteFile)
			}
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
	}
	return noteFiles, nil
}
