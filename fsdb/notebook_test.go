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
	// TODO
}

func Test_object_store(t *testing.T) {
	notebook := MakeNotebook(t)
	t.Run("create and retrieve an object", func(t *testing.T) {
		kind := "thinger"
		id := "111"
		data := []byte("rando data doesn't have to be actually any structure or type")

		// not exists
		Assert(t).That(notebook.ObjectExists(kind, id), IsFalse())

		// store
		err := notebook.StoreObjectBytes(kind, id, data)
		Assert(t).That(err, IsNil())

		// should exist
		Assert(t).That(notebook.ObjectExists(kind, id), IsTrue())

		// get
		got, err := notebook.GetObjectBytes(kind, id)
		Assert(t).That(err, IsNil())
		Assert(t).That(got, Equals(data))
	})

	t.Run("prove kinds and ids are both used to locate data files", func(t *testing.T) {
		// Generate a number of objects with overlapping ids but different kinds:
		objInfos := [][]string{
			{"box", "100", "content for box 100"},
			{"box", "101", "content for box 101"},
			{"bubble", "100", "Bub"},
			{"bubble", "101", "Bob"},
		}
		for _, info := range objInfos {
			kind := info[0]
			id := info[1]
			content := info[2]
			// so no object, initially:
			Assert(t).That(notebook.ObjectExists(kind, id), IsFalse())
			// store the object
			err := notebook.StoreObjectBytes(kind, id, []byte(content))
			Assert(t).That(err, IsNil())
		}

		// Load up each object and see each intact:
		for _, info := range objInfos {
			kind := info[0]
			id := info[1]
			content := info[2]
			data, err := notebook.GetObjectBytes(kind, id)
			Assert(t).That(err, IsNil())
			Assert(t).That(string(data), Equals(content))
		}
	})

	t.Run("overwriting an object", func(t *testing.T) {
		kind := "thinger"
		id := "111"
		data1 := []byte("rando data doesn't have to be actually any structure or type")
		data2 := []byte("second dater")

		// create
		err := notebook.StoreObjectBytes(kind, id, data1)
		Assert(t).That(err, IsNil())
		// overwrite
		err = notebook.StoreObjectBytes(kind, id, data2)
		Assert(t).That(err, IsNil())
		// get
		got, err := notebook.GetObjectBytes(kind, id)
		Assert(t).That(err, IsNil())
		Assert(t).That(got, Equals(data2))
	})

	t.Run("deleting an object", func(t *testing.T) {
		kind := "thinger"
		id := "111"
		data1 := []byte("rando data doesn't have to be actually any structure or type")

		id2 := "222"
		data2 := []byte("other object")

		// create
		err := notebook.StoreObjectBytes(kind, id, data1)
		Assert(t).That(err, IsNil())
		err = notebook.StoreObjectBytes(kind, id2, data2)
		Assert(t).That(err, IsNil())

		// delete first
		err = notebook.DeleteObject(kind, id)
		Assert(t).That(err, IsNil())
		// see it gone
		Assert(t).That(notebook.ObjectExists(kind, id), IsFalse())
		// see 2nd object undisturbed
		Assert(t).That(notebook.ObjectExists(kind, id2), IsTrue())
		got, err := notebook.GetObjectBytes(kind, id2)
		Assert(t).That(err, IsNil())
		Assert(t).That(got, Equals(data2))
	})
}

func Test_object_storage__edge_cases(t *testing.T) {
	notebook := MakeNotebook(t)
	t.Run("ObjectExists() with bad inputs return false", func(t *testing.T) {
		Assert(t).That(notebook.ObjectExists("", ""), IsFalse())
		Assert(t).That(notebook.ObjectExists("fgfdfg", "gfgfg"), IsFalse())
	})
	t.Run("GetObjectBytes() with bad inputs -> err", func(t *testing.T) {
		got, err := notebook.GetObjectBytes("", "fdfdfd")
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("cannot get objects without kind"))
		Assert(t).That(got, IsNil())
		got, err = notebook.GetObjectBytes("dsfg", "")
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("cannot get objects without id"))
		Assert(t).That(got, IsNil())
		got, err = notebook.GetObjectBytes("", "")
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("cannot get objects without kind"))
		Assert(t).That(got, IsNil())
	})
	t.Run("GetObjectBytes() missing file -> err", func(t *testing.T) {
		got, err := notebook.GetObjectBytes("bork", "bork")
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("no such file"))
		Assert(t).That(got, IsNil())
	})
	t.Run("StoreObjectBytes() with bad inputs -> err", func(t *testing.T) {
		data := []byte("some stuff")
		err := notebook.StoreObjectBytes("", "fdfdfd", data)
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("cannot store objects without kind"))

		err = notebook.StoreObjectBytes("sdgfdg", "", data)
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("cannot store objects without id"))
	})

	t.Run("StoreObjectBytes() can store nil / empty objects", func(t *testing.T) {
		err := notebook.StoreObjectBytes("mysterious", "main", nil)
		Assert(t).That(err, IsNil())
		got, err := notebook.GetObjectBytes("mysterious", "main")
		Assert(t).That(err, IsNil())
		Assert(t).That(got, Equals([]byte{}))

		err = notebook.StoreObjectBytes("mysterious", "main", []byte{})
		Assert(t).That(err, IsNil())
		got, err = notebook.GetObjectBytes("mysterious", "main")
		Assert(t).That(err, IsNil())
		Assert(t).That(got, Equals([]byte{}))
	})

	t.Run("DeleteObject() with bad inputs -> err", func(t *testing.T) {
		err := notebook.DeleteObject("", "fdfdfd")
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("cannot delete objects without kind"))
		err = notebook.DeleteObject("dsfg", "")
		Assert(t).That(err, Not(IsNil()))
		Assert(t).That(err.Error(), Contains("cannot delete objects without id"))
	})
}
