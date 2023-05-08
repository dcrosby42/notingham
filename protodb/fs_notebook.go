package protodb

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/dcrosby42/notingham/db"
	"github.com/dcrosby42/notingham/util"
	"github.com/google/uuid"
)

func NoteId() string {
	return uuid.New().String()
}

type FsNotebook struct {
	Dir     string
	pathIds PathIds
	notes   map[string]*db.Note
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

func (me *FsNotebook) NotesDir() string {
	return filepath.Join(me.Dir, "notes")
}

func (me *FsNotebook) RelativePath(path string) string {
	return strings.TrimPrefix(path, me.Dir)[1:]
}

func (me *FsNotebook) GetNote(id string) (db.Note, error) {
	note, found := me.notes[id]
	if !found {
		return db.Note{}, fmt.Errorf("couldn't find note with id %q", id)
	}
	return *note, nil
}

func (me *FsNotebook) AllNotes() ([]db.Note, error) {
	ret := make([]db.Note, 0, len(me.notes))
	for _, note := range me.notes {
		ret = append(ret, *note)
	}
	return ret, nil
}

func (me *FsNotebook) AllNoteIds() ([]string, error) {
	ret := make([]string, 0, len(me.notes))
	for _, note := range me.notes {
		ret = append(ret, note.Id)
	}
	return ret, nil
}

func (me *FsNotebook) SaveNote(incoming db.Note) (db.Note, error) {
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
	var fileToRemove string
	var doSavePathIds bool
	// compute the path is it would be, given current note content:
	path, err := newRelFilePath(note, me.Dir, "notes")
	if err != nil {
		return db.Note{}, err
	}
	_, pathId := me.pathIds.LookupById(note.Id)
	if pathId == nil {
		// pathIds cache doesn't know this ID or its on-disk path: establish
		pathId = &PathId{Path: path, Id: note.Id}
		me.pathIds = append(me.pathIds, *pathId)
		doSavePathIds = true
	} else if path != pathId.Path {
		// renamed.  the note content changed, so the title (and filename) need to be updated:
		fileToRemove = filepath.Join(me.Dir, pathId.Path)
		pathId.Path = path
		doSavePathIds = true
	}

	// Write the note file
	fname := filepath.Join(me.Dir, pathId.Path)
	err = ioutil.WriteFile(fname, []byte(note.Content), 0644)
	if err != nil {
		return db.Note{}, err
	}

	if fileToRemove != "" {
		// due to rename
		os.Remove(fileToRemove)
	}

	if doSavePathIds {
		// persist path ids to disk
		if err := me.savePathIds(); err != nil {
			return db.Note{}, err
		}
	}

	return *note, nil
}

func (me *FsNotebook) DeleteNote(id string) (db.Note, error) {
	// Remove from note cache
	note, found := me.notes[id]
	if found {
		delete(me.notes, id)
	}

	// Remove from path id mappings
	i, pathId := me.pathIds.LookupById(note.Id)
	if pathId != nil {
		// quick-but-disorderly deletion:
		a := me.pathIds
		a[i] = a[len(a)-1]
		me.pathIds = a[:len(a)-1]

		// persist path-id index to disk
		if err := me.savePathIds(); err != nil {
			return db.Note{}, err
		}

		// Trash the file
		err := os.MkdirAll(filepath.Join(me.Dir, "trash"), 0755)
		if err != nil {
			return db.Note{}, err
		}
		originalFname := filepath.Join(me.Dir, pathId.Path)
		trashedFilename := filepath.Join(me.Dir, "trash", filepath.Base(pathId.Path))
		err = os.Rename(originalFname, trashedFilename)
		if err != nil {
			return db.Note{}, err
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
		err = json.Unmarshal(bytes, &me.pathIds)
		if err != nil {
			return err
		}
		me.cleanupPathIds()
		return nil
	}
	// no file, just be empty
	me.pathIds = make([]PathId, 0)
	return nil
}

func (me *FsNotebook) savePathIds() error {
	me.cleanupPathIds()
	bytes, err := json.MarshalIndent(me.pathIds, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(me.pathIdsFile(), bytes, 0644)
}

func (me *FsNotebook) cleanupPathIds() {
	cleanedPathIds := make(PathIds, 0)
	for _, pathId := range me.pathIds {
		if util.FileExists(filepath.Join(me.Dir, pathId.Path)) {
			cleanedPathIds = append(cleanedPathIds, pathId)
		}
	}
	me.pathIds = cleanedPathIds
}

var NoteFilePattern = regexp.MustCompile(`.md$`)

func (me *FsNotebook) loadNotes() error {
	me.notes = make(map[string]*db.Note)
	return filepath.Walk(me.NotesDir(), func(fullPath string, info os.FileInfo, err error) error {
		if err != nil {
			fmt.Println(err)
			return err
		}
		file := me.RelativePath(fullPath)
		if !info.IsDir() && NoteFilePattern.MatchString(file) {
			// get or make an id
			pathId := me.pathIds.LookupByPath(file)
			if pathId == nil {
				newPathId := PathId{Path: file, Id: NoteId()}
				me.pathIds = append(me.pathIds, newPathId)
				pathId = &newPathId
			}
			// load db.Note
			data, err := ioutil.ReadFile(fullPath)
			if err != nil {
				return err
			}
			note := &db.Note{Id: pathId.Id, Content: string(data)}
			// index db.Note by id
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
