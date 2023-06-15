package fsdb

import (
	"testing"

	"github.com/dcrosby42/notingham/db"
	. "github.com/pepinns/go-hamcrest"
)

func MakeNotebook(t *testing.T) *Notebook {
	t.Helper()
	dir := t.TempDir()
	notebook, err := NewNotebook(dir)
	Assert(t).That(err, IsNil())
	return notebook
}

func Test_Notebook_WriteNote_ReadNote(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		notebook := MakeNotebook(t)

		// Save a note
		id := db.NoteId()
		Assert(t).That(notebook.NoteExists(id), IsFalse()) // confirm note doesn't exist
		content := "This is\nthe words in the\nnote."
		err := notebook.SaveNote(db.Note{Id: id, Content: content})
		Assert(t).That(err, IsNil())

		// verify note
		Assert(t).That(notebook.NoteExists(id), IsTrue())
		got, err := notebook.GetNote(id)
		Assert(t).That(err, IsNil())
		Assert(t).That(got.Id, Equals(id))
		Assert(t).That(got.Content, Equals(content))

		// write a different note
		id2 := db.NoteId()
		err = notebook.SaveNote(db.Note{Id: id2, Content: "other stuff"})
		Assert(t).That(err, IsNil())
		// check 2nd note
		Assert(t).That(notebook.NoteExists(id2), IsTrue())
		got2, err := notebook.GetNote(id2)
		Assert(t).That(err, IsNil())
		Assert(t).That(got2.Id, Equals(id2))
		Assert(t).That(got2.Content, Equals("other stuff"))
		// assert 1st note unchanged
		Assert(t).That(notebook.NoteExists(id), IsTrue())
		got3, err := notebook.GetNote(id)
		Assert(t).That(err, IsNil())
		Assert(t).That(got3.Id, Equals(id))
		Assert(t).That(got3.Content, Equals(content))
	})

	t.Run("overwriting a note", func(t *testing.T) {
		notebook := MakeNotebook(t)

		id := db.NoteId()

		err := notebook.SaveNote(db.Note{Id: id, Content: "first content"})
		Assert(t).That(err, IsNil())
		err = notebook.SaveNote(db.Note{Id: id, Content: "second content"})
		Assert(t).That(err, IsNil())

		got, err := notebook.GetNote(id)
		Assert(t).That(err, IsNil())
		Assert(t).That(got.Id, Equals(id))
		Assert(t).That(got.Content, Equals("second content"))
	})

	t.Run("blank id causes error", func(t *testing.T) {
		notebook := MakeNotebook(t)

		err := notebook.SaveNote(db.Note{Content: "nope"})
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("blank id"))
		Assert(t).That(notebook.NoteExists(""), IsFalse())
	})
}

func Test_Notebook_DeleteNote(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		notebook := MakeNotebook(t)
		id := db.NoteId()
		err := notebook.SaveNote(db.Note{Id: id, Content: "shortlived"})
		Assert(t).That(err, IsNil())
		Assert(t).That(notebook.NoteExists(id), IsTrue())

		err = notebook.DeleteNote(id)
		Assert(t).That(err, IsNil())
		Assert(t).That(notebook.NoteExists(id), IsFalse())
	})

	t.Run("errors nonexistant id", func(t *testing.T) {
		notebook := MakeNotebook(t)
		err := notebook.DeleteNote("something")
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("no such file"))
	})

	t.Run("errors on blank id", func(t *testing.T) {
		notebook := MakeNotebook(t)
		err := notebook.DeleteNote("")
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("blank id"))
	})

}

func Test_Notebook_ListNotes(t *testing.T) {

}
