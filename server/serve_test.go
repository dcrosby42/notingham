package server_test

import (
	"os"
	"path/filepath"
	"testing"

	. "github.com/dcrosby42/notingham/notedb"
	"github.com/dcrosby42/notingham/server"
	. "github.com/pepinns/go-hamcrest"
)

func Test_Ping(t *testing.T) {
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

func Test_GetNotes(t *testing.T) {
	dataDir := t.TempDir()

	// Create the notebook
	notebookId := "myNotebook"
	notebookDir := filepath.Join(dataDir, notebookId)
	err := os.MkdirAll(notebookDir, 0755)
	Assert(t).That(err, IsNil())
	notebook, err := NewFsNotebook(notebookDir)
	Assert(t).That(err, IsNil())
	note1, err := notebook.SaveNote(Note{Id: NoteId(), Content: "the content of note1"})
	Assert(t).That(err, IsNil())
	note2, err := notebook.SaveNote(Note{Id: NoteId(), Content: "the second note"})
	Assert(t).That(err, IsNil())
	note3, err := notebook.SaveNote(Note{Id: NoteId(), Content: "third time pays for all"})
	Assert(t).That(err, IsNil())

	config := server.Config{DataDir: dataDir}
	WithNotingham(t, config, func(fix *NotinghamFixture) {
		url := fix.Api("/notebooks/%s/notes", notebookId)
		got := make([]Note, 0)
		resp, err := fix.Client.R().
			SetHeader("Accept", "application/json").
			SetResult(&got).
			Get(url)
		assertOk(t, resp, err)

		Assert(t).That(len(got), Equals(3))

		byId := make(map[string]Note)
		for _, note := range got {
			byId[note.Id] = note
		}
		Assert(t).That(byId[note1.Id].Content, Equals(note1.Content))
		Assert(t).That(byId[note2.Id].Content, Equals(note2.Content))
		Assert(t).That(byId[note3.Id].Content, Equals(note3.Content))
	})
}
