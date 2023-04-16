package notedb

import (
	"fmt"
	"testing"

	"github.com/dcrosby42/notingham/util"
	. "github.com/pepinns/go-hamcrest"
)

func Test_NewFsNotebook(t *testing.T) {
	dir := t.TempDir()

	notebook, err := NewFsNotebook(dir)
	Assert(t).That(err, IsNil())

	Assert(t).That(notebook.Dir, Equals(dir))
	Assert(t).That(util.DirExists(dir), IsTrue())
	Assert(t).That(util.DirExists(dir+"/notes"), IsTrue())
	Assert(t).That(util.DirExists(dir+"/objects"), IsTrue())
	Assert(t).That(util.DirExists(dir+"/assets"), IsTrue())
	Assert(t).That(util.DirExists(dir+"/trash"), IsTrue())
}

func Test_NewFsNotebook_SaveNote(t *testing.T) {
	dir := t.TempDir()

	notebook, err := NewFsNotebook(dir)
	Assert(t).That(err, IsNil())

	note1 := Note{Id: NoteId(), Content: "the content of note1"}
	note2 := Note{Id: "astring", Content: "the content of note2"}

	t.Run("simple SaveNote()", func(t *testing.T) {
		retNote, err := notebook.SaveNote(note1)
		Assert(t).That(err, IsNil())
		Assert(t).That(retNote, Equals(note1))
	})

	t.Run("SaveNote() and GetNote()", func(t *testing.T) {
		// getting a non-id errs
		_, err := notebook.GetNote(note2.Id)
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("couldn't find note with id \"astring\""))

		// Actually put the note in there:
		retNote, err := notebook.SaveNote(note2)
		Assert(t).That(err, IsNil())
		Assert(t).That(retNote, Equals(note2))

		// Now we can get the note
		gotten, err := notebook.GetNote(note2.Id)
		Assert(t).That(err, IsNil())
		Assert(t).That(gotten, Equals(note2))
	})
}

func Test_NewFsNotebook_AllNotes(t *testing.T) {
	dir := t.TempDir()

	// build up a notebook
	notebook, err := NewFsNotebook(dir)
	Assert(t).That(err, IsNil())
	note1, err := notebook.SaveNote(Note{Id: NoteId(), Content: "the content of note1"})
	Assert(t).That(err, IsNil())
	note2, err := notebook.SaveNote(Note{Id: NoteId(), Content: "the second note"})
	Assert(t).That(err, IsNil())
	note3, err := notebook.SaveNote(Note{Id: NoteId(), Content: "third time pays for all"})
	Assert(t).That(err, IsNil())

	// Load all notes:
	got, err := notebook.AllNotes()
	Assert(t).That(err, IsNil())
	Assert(t).That(len(got), Equals(3))

	// (map returned notes by their ids)
	byId := make(map[string]Note)
	for _, note := range got {
		byId[note.Id] = note
	}

	// assert all our notes came back:
	Assert(t).That(byId[note1.Id], Equals(note1))
	Assert(t).That(byId[note2.Id], Equals(note2))
	Assert(t).That(byId[note3.Id], Equals(note3))

	// Check individual gets
	gotten1, err := notebook.GetNote(note1.Id)
	Assert(t).That(err, IsNil())
	Assert(t).That(gotten1, Equals(note1))

	gotten3, err := notebook.GetNote(note3.Id)
	Assert(t).That(err, IsNil())
	Assert(t).That(gotten3, Equals(note3))
}

func Test_NewFsNotebook_AllNotes_from_disk(t *testing.T) {
	dir := t.TempDir()

	// build up a notebook
	notebook, err := NewFsNotebook(dir)
	Assert(t).That(err, IsNil())
	note1, err := notebook.SaveNote(Note{Id: NoteId(), Content: "the content of note1"})
	Assert(t).That(err, IsNil())
	note2, err := notebook.SaveNote(Note{Id: NoteId(), Content: "the second note"})
	Assert(t).That(err, IsNil())
	note3, err := notebook.SaveNote(Note{Id: NoteId(), Content: "third time pays for all"})
	Assert(t).That(err, IsNil())

	// Instantiate a new notebook vs. the existing dir:
	notebook, err = NewFsNotebook(dir)
	Assert(t).That(err, IsNil())

	// Load all notes:
	got, err := notebook.AllNotes()
	Assert(t).That(err, IsNil())
	Assert(t).That(len(got), Equals(3))

	// (map returned notes by their ids)
	byId := make(map[string]Note)
	for _, note := range got {
		byId[note.Id] = note
	}

	// assert all our notes came back:
	x := byId[note1.Id]
	fmt.Println(x)
	Assert(t).That(byId[note1.Id], Equals(note1))
	Assert(t).That(byId[note2.Id], Equals(note2))
	Assert(t).That(byId[note3.Id], Equals(note3))
}
