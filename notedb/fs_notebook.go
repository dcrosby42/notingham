package notedb

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"

	"github.com/dcrosby42/notingham/util"
	"github.com/google/uuid"
)

func NoteId() string {
	return uuid.New().String()
}

type FsNotebook struct {
	Dir     string
	pathIds PathIds
	notes   map[string]*Note
}

func NewFsNotebook(dir string) (*FsNotebook, error) {
	nb := &FsNotebook{Dir: dir}
	var err error
	os.MkdirAll(filepath.Join(dir, "notes"), 0755)
	os.MkdirAll(filepath.Join(dir, "objects"), 0755)
	os.MkdirAll(filepath.Join(dir, "assets"), 0755)
	os.MkdirAll(filepath.Join(dir, "trash"), 0755)
	err = nb.loadPathIds()
	if err != nil {
		return nil, err
	}
	err = nb.loadNotes()
	if err != nil {
		return nil, err
	}
	err = nb.savePathIds()
	if err != nil {
		return nil, err
	}
	return nb, nil
}

func (me *FsNotebook) AllNotes() ([]Note, error) {
	ret := make([]Note, 0, len(me.notes))
	for _, note := range me.notes {
		ret = append(ret, *note)
	}
	return ret, nil
}

func (me *FsNotebook) SaveNote(incoming Note) (Note, error) {
	// Get square with the in-memory note store:
	note, found := me.notes[incoming.Id]
	if found {
		// existing note
		note.Content = incoming.Content
	} else {
		// new note
		note = &incoming
		if note.Id == "" {
			// needs an ID
			note.Id = NoteId()
		}
	}
	me.notes[note.Id] = note

	// Square up with the path-id mappings:
	_, pathId := me.pathIds.LookupById(note.Id)
	if pathId == nil {
		path := note.Id + ".md"
		pathId = &PathId{Path: path, Id: note.Id}
		me.pathIds = append(me.pathIds, *pathId)
		// persist path ids to disk
		if err := me.savePathIds(); err != nil {
			return Note{}, err
		}
	}

	// Write the file
	fname := filepath.Join(me.Dir, "notes", pathId.Path)
	err := ioutil.WriteFile(fname, []byte(note.Content), 0644)
	if err != nil {
		return Note{}, err
	}

	return *note, nil
}

func (me *FsNotebook) DeleteNote(id string) (Note, error) {
	// Remove from note cache
	note, found := me.notes[id]
	if found {
		delete(me.notes, id)
	}
	me.notes[note.Id] = note

	// Remove from path id mappings
	i, pathId := me.pathIds.LookupById(note.Id)
	if pathId != nil {
		// quick-but-disorderly deletion:
		a := me.pathIds
		a[i] = a[len(a)-1]
		me.pathIds = a[:len(a)-1]

		// persist path-id index to disk
		if err := me.savePathIds(); err != nil {
			return Note{}, err
		}

		// Trash the file
		trashedFilename := filepath.Join(me.Dir, "trash", filepath.Base(pathId.Path))
		err := os.Rename(pathId.Path, trashedFilename)
		if err != nil {
			return Note{}, err
		}
	}
	return *note, nil
}

func (me *FsNotebook) pathIdsFile() string {
	return filepath.Join(me.Dir, "_note_ids.json")
}

func (me *FsNotebook) loadPathIds() error {
	if util.FileExists(me.pathIdsFile()) {
		bytes, err := ioutil.ReadFile(me.pathIdsFile())
		if err != nil {
			return err
		}
		return json.Unmarshal(bytes, &me.pathIds)
	}
	// no file, just be empty
	me.pathIds = make([]PathId, 0)
	return nil
}

func (me *FsNotebook) savePathIds() error {
	bytes, err := json.Marshal(me.pathIds)
	if err != nil {
		return err
	}
	return ioutil.WriteFile(me.pathIdsFile(), bytes, 0644)
}

var NoteFilePattern = regexp.MustCompile(`.md$`)

func (me *FsNotebook) loadNotes() error {
	me.notes = make(map[string]*Note)
	return filepath.Walk(me.Dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			fmt.Println(err)
			return err
		}
		if !info.IsDir() && NoteFilePattern.MatchString(path) {
			// get or make an id
			pathId := me.pathIds.LookupByPath(path)
			if pathId == nil {
				newPathId := PathId{Path: path, Id: NoteId()}
				me.pathIds = append(me.pathIds, newPathId)
				pathId = &newPathId
			}
			// load Note
			fname := filepath.Join(me.Dir, "notes", path)
			data, err := ioutil.ReadFile(fname)
			if err != nil {
				return err
			}
			note := &Note{Id: pathId.Id, Content: string(data)}
			// index Note by id
			me.notes[pathId.Id] = note
		}
		return nil
	})
}

type PathId struct {
	Path string `json:"path"`
	Id   string `json:"id"`
}

type PathIds []PathId

func (me PathIds) LookupByPath(path string) *PathId {
	for i, pathId := range me {
		if pathId.Path == path {
			return &me[i]
		}
	}
	return nil
}

func (me PathIds) LookupById(id string) (int, *PathId) {
	for i, pathId := range me {
		if pathId.Id == id {
			return i, &me[i]
		}
	}
	return -1, nil
}
