package notedb

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dcrosby42/notingham/util"
	"github.com/google/uuid"
)

type FileIdEntry struct {
	Id   string `json:"id"`
	Path string `json:"path"`
}

type NotebookDir struct {
	NotebookId    string
	Dir           string
	fileIndex     []FileIdEntry
	noteFiles     []*NoteFile
	noteFilesById map[string]*NoteFile
}

func (me *NotebookDir) Init() error {
	err := me.loadIndex()
	if err != nil {
		return err
	}
	err = me.loadNoteFiles()
	if err != nil {
		return err
	}
	return me.saveIndex()
}

func (me *NotebookDir) AllNoteFiles() ([]*NoteFile, error) {
	return me.noteFiles, nil
}

func (me *NotebookDir) loadIndex() error {
	indexFile := filepath.Join(me.Dir, "_notebook.json")
	if util.FileExists(indexFile) {
		bytes, err := ioutil.ReadFile(indexFile)
		if err != nil {
			return err
		}
		return json.Unmarshal(bytes, &me.fileIndex)
	}
	// no file, just be empty
	me.fileIndex = make([]FileIdEntry, 0)
	return nil
}

func (me *NotebookDir) saveIndex() error {
	indexFile := filepath.Join(me.Dir, "_notebook.json")
	bytes, err := json.Marshal(me.fileIndex)
	if err != nil {
		return err
	}
	return ioutil.WriteFile(indexFile, bytes, 0644)
}

func (me *NotebookDir) loadNoteFiles() error {
	me.noteFilesById = make(map[string]*NoteFile)
	return filepath.Walk(me.Dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			fmt.Println(err)
			return err
		}
		if !info.IsDir() && NoteFilePattern.MatchString(path) {
			// get or make an id
			id := me.fileIdForPath(path)
			if id == "" {
				id = uuid.New().String()
				me.fileIndex = append(me.fileIndex, FileIdEntry{Path: path, Id: id})
			}
			// make NoteFile
			noteFile, err := NewNoteFile(me.NotebookId, id, path)
			if err == nil {
				me.noteFiles = append(me.noteFiles, noteFile)
				me.noteFilesById[noteFile.Id] = noteFile
			}
		}
		return nil
	})
}

func (me *NotebookDir) fileIdForPath(path string) string {
	for _, entry := range me.fileIndex {
		if entry.Path == path {
			return entry.Id
		}
	}
	return ""
}
func (me *NotebookDir) filePathForId(id string) string {
	for _, entry := range me.fileIndex {
		if entry.Id == id {
			return entry.Path
		}
	}
	return ""
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
		name := req.Id // TODO calc something nicer from content
		noteFile = &NoteFile{
			NotebookId: req.NotebookId,
			Id:         req.Id,
			Path:       filepath.Join(me.Dir, "docs", name+".md"),
			Name:       name,
		}
		me.noteFiles = append(me.noteFiles, noteFile)
		me.noteFilesById[req.Id] = noteFile

		me.fileIndex = append(me.fileIndex, FileIdEntry{Id: noteFile.Id, Path: noteFile.Path})
		me.saveIndex()
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
