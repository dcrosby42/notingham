package repo_test

import (
	"os"
	"testing"

	"github.com/dcrosby42/notingham/db"
	"github.com/dcrosby42/notingham/repo"
	. "github.com/pepinns/go-hamcrest"
)

func Test_GetNotebook(t *testing.T) {
	setupTestRepo(t)
	defer cleanupTestRepo()

	r := repo.New("_TEST_REPO")

	note1 := db.Note{Id: db.NoteId(), Content: "blah"}

	t.Run("existing notebook", func(t *testing.T) {
		book1, err := r.GetNotebook("Notebook1")
		Assert(t).That(err, IsNil())

		err = book1.SaveNote(note1)
		Assert(t).That(err, IsNil())

		got, err := book1.GetNote(note1.Id)
		Assert(t).That(err, IsNil())
		Assert(t).That(got, Equals(note1))
	})
	t.Run("nonexistant notebook", func(t *testing.T) {
		newBook, err := r.GetNotebook("NewGuy")
		Assert(t).That(err, IsNil())

		note2 := db.Note{Id: db.NoteId(), Content: "woot"}
		err = newBook.SaveNote(note2)
		Assert(t).That(err, IsNil())

		got, err := newBook.GetNote(note2.Id)
		Assert(t).That(err, IsNil())
		Assert(t).That(got, Equals(note2))

		// see the note from the other book aint here
		_, err = newBook.GetNote(note1.Id)
		Assert(t).That(err, Not(IsNil()))
	})

}

func Test_ListNotebookNames(t *testing.T) {
	setupTestRepo(t)
	defer cleanupTestRepo()

	r := repo.New("_TEST_REPO")

	names, err := r.ListNotebookNames()
	Assert(t).That(err, IsNil())

	Assert(t).That(names, AllOf(
		HasLen(2),
		Contains("Notebook1"),
		Contains("Notebook2"),
	))
}

//
// HELPERS
//

func setupTestRepo(t *testing.T) {
	err := os.MkdirAll("_TEST_REPO/Notebook1", 0755)
	Assert(t).That(err, IsNil())
	err = os.MkdirAll("_TEST_REPO/Notebook2", 0755)
	Assert(t).That(err, IsNil())
}

func cleanupTestRepo() {
	os.RemoveAll("_TEST_REPO")
}
