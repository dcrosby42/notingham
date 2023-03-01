package notedb

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"

	. "github.com/pepinns/go-hamcrest"
)

func Test_getNoteTitle(t *testing.T) {
	// first line of doc
	note := Note{Content: "Hello World\nblah\bblah", Id: "the_id"}
	Assert(t).That(getNoteTitle(&note), Equals("Hello World"))

	// clean out yucky characters and trim
	note = Note{Content: "  ##  Hello World -- the !@#$ reckoning_1. [linkage](urlage) \nblah\bblah", Id: "the_id"}
	Assert(t).That(getNoteTitle(&note), Equals("Hello World the reckoning_1 linkage urlage"))

	// single line
	note = Note{Content: "Hello World", Id: "the_id"}
	Assert(t).That(getNoteTitle(&note), Equals("Hello World"))

	// default to ID if content empty
	note = Note{Content: "", Id: "the_id"}
	Assert(t).That(getNoteTitle(&note), Equals("the_id"))
}

func Test_getNoteFileName(t *testing.T) {
	// first line of doc
	note := Note{Content: "Hello World\nblah\bblah", Id: "the_id"}
	Assert(t).That(getNoteFileName(&note), Equals("Hello_World.md"))

	// clean out yucky characters and trim
	note = Note{Content: "  ##  Hello World -- the !@#$ reckoning_1. [linkage](urlage) \nblah\bblah", Id: "the_id"}
	Assert(t).That(getNoteFileName(&note), Equals("Hello_World_the_reckoning_1_linkage_urlage.md"))

	// single line
	note = Note{Content: "Hello World", Id: "the_id"}
	Assert(t).That(getNoteFileName(&note), Equals("Hello_World.md"))

	// default to ID if content empty
	note = Note{Content: "", Id: "the_id"}
	Assert(t).That(getNoteFileName(&note), Equals("the_id.md"))
}

func Test_newRelFilePath(t *testing.T) {
	t.Run("returns a file path relative to the given base dir", func(t *testing.T) {
		baseDir := t.TempDir()
		subDir := "things"
		os.MkdirAll(baseDir+"/"+subDir, 0755)
		note := &Note{Content: "The Note Title", Id: "some_id"}

		path, err := newRelFilePath(note, baseDir, subDir)
		Assert(t).That(err, IsNil())
		Assert(t).That(path, Equals("things/The_Note_Title.md"))

		// test incrementing filenames
		err = ioutil.WriteFile(filepath.Join(baseDir, path), []byte("some content"), 0644)
		Assert(t).That(err, IsNil())

		path, err = newRelFilePath(note, baseDir, subDir)
		Assert(t).That(err, IsNil())
		Assert(t).That(path, Equals("things/The_Note_Title.1.md"))

		// ...again
		err = ioutil.WriteFile(filepath.Join(baseDir, path), []byte("other content"), 0644)
		Assert(t).That(err, IsNil())

		path, err = newRelFilePath(note, baseDir, subDir)
		Assert(t).That(err, IsNil())
		Assert(t).That(path, Equals("things/The_Note_Title.2.md"))
	})
}
