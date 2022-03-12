package notedb

import (
	"crypto/sha1"
	"fmt"
	"io"
	"io/ioutil"
	"os"
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

type NotebookDir struct {
	Id            string
	Dir           string
	noteFiles     []*NoteFile
	noteFilesById map[string]*NoteFile
}

var NoteFilePattern = regexp.MustCompile(`.md$`)

func (me *NotebookDir) AllNoteFiles() ([]*NoteFile, error) {
	if len(me.noteFiles) == 0 {
		me.noteFilesById = make(map[string]*NoteFile)
		err := filepath.Walk(me.Dir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				fmt.Println(err)
				return err
			}
			if !info.IsDir() && NoteFilePattern.MatchString(path) {
				// fabricate an id
				h := sha1.New()
				io.WriteString(h, me.Id)
				io.WriteString(h, path)
				id := fmt.Sprintf("%x", h.Sum(nil))
				// make NoteFile
				noteFile, err := NewNoteFile(me.Id, id, path)
				if err == nil {
					me.noteFiles = append(me.noteFiles, noteFile)
					me.noteFilesById[noteFile.Id] = noteFile
				}
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}
	return me.noteFiles, nil
}

type NoteContentUpdate struct {
	NotebookId string `json:"notebook_id"`
	Id         string `json:"id"`
	Content    string `json:"content"`
}

func (me *NotebookDir) UpdateNoteContent(req NoteContentUpdate) (*NoteFile, error) {
	fmt.Printf("UpdateNoteContent: %#v\n", req)
	// Find the NoteFile
	noteFile, ok := me.noteFilesById[req.Id]
	if !ok {
		return nil, fmt.Errorf("NoteFile %v not found in notebook %v", req.Id, me.Id)
	}
	// Write file to disk
	err := ioutil.WriteFile(noteFile.Path, []byte(req.Content), 0644)
	if err != nil {
		return nil, err
	}
	// Update cache
	noteFile.Content = req.Content

	return noteFile, nil
}
