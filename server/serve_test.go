package server_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/dcrosby42/notingham/db"
	"github.com/dcrosby42/notingham/fsdb"
	. "github.com/dcrosby42/notingham/protodb"
	"github.com/dcrosby42/notingham/server"
	. "github.com/pepinns/go-hamcrest"
)

func Test_ping(t *testing.T) {
	WithNotingham(t, server.Config{}, func(fix *NotinghamFixture) {
		url := fix.Url("/ping")
		got := make(map[string]string)
		resp, err := fix.Client.R().
			SetHeader("Accept", "application/json").
			SetResult(&got).
			Get(url)
		assertOk(t, resp, err)
		Assert(t).That(got["message"], Equals("pong"))
	})
}

func Test_get_all_notes(t *testing.T) {
	notebookFix := NewNotebookFixture(t)
	config := server.Config{DataDir: notebookFix.DataDir}

	WithNotingham(t, config, func(fix *NotinghamFixture) {
		url := fix.Api("/notebooks/%s/notes", notebookFix.NotebookId)
		got := make([]db.Note, 0)
		resp, err := fix.Client.R().
			SetHeader("Accept", "application/json").
			SetResult(&got).
			Get(url)
		assertOk(t, resp, err)

		Assert(t).That(len(got), Equals(3))

		byId := make(map[string]db.Note)
		for _, note := range got {
			byId[note.Id] = note
		}

		for id, note := range notebookFix.Notes {
			Assert(t).That(byId[id].Content, Equals(note.Content))
		}
	})
}

func Test_save_note(t *testing.T) {
	t.Run("update existing note", func(t *testing.T) {
		notebookFix := NewNotebookFixture(t)
		targetNote := notebookFix.Notes[notebookFix.NoteIds[0]]
		targetNote.Content = "the new content"
		config := server.Config{DataDir: notebookFix.DataDir}
		WithNotingham(t, config, func(fix *NotinghamFixture) {
			// Save the note
			url := fix.Api("/notebooks/%s/notes/%s", notebookFix.NotebookId, targetNote.Id)
			jsonBytes, err := json.Marshal(targetNote)
			Assert(t).That(err, IsNil())
			resp, err := fix.Client.R().
				SetHeader("Content-Type", "application/json").
				SetBody(jsonBytes).
				Post(url)
			assertOk(t, resp, err)

			// Retrieve the content
			url2 := fix.Api("/notebooks/%s/notes", notebookFix.NotebookId)
			got := make([]db.Note, 0)
			resp2, err := fix.Client.R().
				SetHeader("Accept", "application/json").
				SetResult(&got).
				Get(url2)
			assertOk(t, resp2, err)
			Assert(t).That(len(got), Equals(3))
			byId := make(map[string]db.Note)
			for _, note := range got {
				byId[note.Id] = note
			}

			// Assert the first note's content was updated by our post:
			retNote, ok := byId[targetNote.Id]
			Assert(t).That(ok, IsTrue())
			Assert(t).That(retNote.Content, Equals(targetNote.Content))
		})
	})

	t.Run("create new note", func(t *testing.T) {
		freshNote := db.Note{Id: "the-new-id", Content: "original-content"}

		notebookFix := NewNotebookFixture(t)
		config := server.Config{DataDir: notebookFix.DataDir}
		WithNotingham(t, config, func(fix *NotinghamFixture) {
			// Save the note
			url := fix.Api("/notebooks/%s/notes/%s", notebookFix.NotebookId, freshNote.Id)
			jsonBytes, err := json.Marshal(freshNote)
			Assert(t).That(err, IsNil())
			resp, err := fix.Client.R().
				SetHeader("Content-Type", "application/json").
				SetBody(jsonBytes).
				Post(url)
			assertOk(t, resp, err)

			// Retrieve the content
			url2 := fix.Api("/notebooks/%s/notes", notebookFix.NotebookId)
			got := make([]db.Note, 0)
			resp2, err := fix.Client.R().
				SetHeader("Accept", "application/json").
				SetResult(&got).
				Get(url2)
			assertOk(t, resp2, err)
			Assert(t).That(len(got), Equals(4))
			byId := make(map[string]db.Note)
			for _, note := range got {
				byId[note.Id] = note
			}

			// Assert the fresh note was saved and returned:
			retNote, ok := byId[freshNote.Id]
			Assert(t).That(ok, IsTrue())
			Assert(t).That(retNote.Content, Equals(freshNote.Content))
		})
	})
}

type NotebookFixture struct {
	NotebookId  string
	DataDir     string
	NotebookDir string
	Notes       map[string]db.Note
	NoteIds     []string
}

func Test_delete_note(t *testing.T) {
	notebookFix := NewNotebookFixture(t)
	targetNote := notebookFix.Notes[notebookFix.NoteIds[0]]
	config := server.Config{DataDir: notebookFix.DataDir}
	WithNotingham(t, config, func(fix *NotinghamFixture) {
		// Delete the note
		url := fix.Api("/notebooks/%s/notes/%s", notebookFix.NotebookId, targetNote.Id)
		resp, err := fix.Client.R().Delete(url)
		assertOk(t, resp, err)

		// Retrieve the remaining content
		url2 := fix.Api("/notebooks/%s/notes", notebookFix.NotebookId)
		got := make([]db.Note, 0)
		resp2, err := fix.Client.R().
			SetHeader("Accept", "application/json").
			SetResult(&got).
			Get(url2)
		assertOk(t, resp2, err)

		// See we're down a note:
		Assert(t).That(len(got), Equals(2))
		byId := make(map[string]db.Note)
		for _, note := range got {
			byId[note.Id] = note
		}
		// See the target is gone
		_, found := byId[targetNote.Id]
		Assert(t).That(found, IsFalse())
	})
}

func NewNotebookFixture(t *testing.T) *NotebookFixture {
	// Create the notebook
	fix := &NotebookFixture{}
	fix.NotebookId = "myNotebook"
	fix.DataDir = t.TempDir()
	fix.NotebookDir = filepath.Join(fix.DataDir, fix.NotebookId)
	err := os.MkdirAll(fix.NotebookDir, 0755)
	Assert(t).That(err, IsNil())

	notebook, err := fsdb.NewNotebook(fix.NotebookDir)
	Assert(t).That(err, IsNil())
	note1 := db.Note{Id: NoteId(), Content: "the content of note1"}
	err = notebook.SaveNote(note1)
	Assert(t).That(err, IsNil())
	note2 := db.Note{Id: NoteId(), Content: "the second note"}
	err = notebook.SaveNote(note2)
	Assert(t).That(err, IsNil())
	note3 := db.Note{Id: NoteId(), Content: "third time pays for all"}
	err = notebook.SaveNote(note3)
	Assert(t).That(err, IsNil())

	fix.Notes = make(map[string]db.Note)
	fix.Notes[note1.Id] = note1
	fix.Notes[note2.Id] = note2
	fix.Notes[note3.Id] = note3

	fix.NoteIds = make([]string, 0)
	for id := range fix.Notes {
		fix.NoteIds = append(fix.NoteIds, id)
	}
	return fix
}
