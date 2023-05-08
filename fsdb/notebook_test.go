package fsdb

import (
	"testing"

	"github.com/dcrosby42/notingham/db"
	. "github.com/pepinns/go-hamcrest"
)

func MakeNotebook(t *testing.T) *Notebook {
	t.Helper()
	dir := t.TempDir()

	notebook, err := GetNotebook(dir)
	Assert(t).That(err, IsNil())

	return notebook
}

func Test_Notebook_WriteNote_ReadNote(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		notebook := MakeNotebook(t)

		id := db.NoteId()
		content := "This is\nthe words in the\nnote."

		err := notebook.WriteNote(id, content)
		Assert(t).That(err, IsNil())

		got, err := notebook.ReadNote(id)
		Assert(t).That(err, IsNil())
		Assert(t).That(got, Equals(content))

		// write a different note
		id2 := db.NoteId()
		err = notebook.WriteNote(id2, "other stuff")
		Assert(t).That(err, IsNil())
		// check 2nd note
		got2, err := notebook.ReadNote(id2)
		Assert(t).That(err, IsNil())
		Assert(t).That(got2, Equals("other stuff"))
		// assert 1st note unchanged
		got3, err := notebook.ReadNote(id)
		Assert(t).That(err, IsNil())
		Assert(t).That(got3, Equals(content))
	})

	t.Run("overwriting a note", func(t *testing.T) {
		dir := t.TempDir()

		notebook, err := GetNotebook(dir)
		Assert(t).That(err, IsNil())

		id := db.NoteId()

		err = notebook.WriteNote(id, "first content")
		Assert(t).That(err, IsNil())
		err = notebook.WriteNote(id, "second content")
		Assert(t).That(err, IsNil())

		got, err := notebook.ReadNote(id)
		Assert(t).That(err, IsNil())
		Assert(t).That(got, Equals("second content"))
	})

	t.Run("blank id causes error", func(t *testing.T) {

		dir := t.TempDir()

		notebook, err := GetNotebook(dir)
		Assert(t).That(err, IsNil())

		err = notebook.WriteNote("", "nope")
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("blank id"))
	})
}

func Test_Notebook_ListNotes(t *testing.T) {

}
