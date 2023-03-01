package notedb

import (
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

func Test_getNoteFileBaseName(t *testing.T) {
	// first line of doc
	note := Note{Content: "Hello World\nblah\bblah", Id: "the_id"}
	Assert(t).That(getNoteFileBaseName(&note), Equals("Hello_World"))

	// clean out yucky characters and trim
	note = Note{Content: "  ##  Hello World -- the !@#$ reckoning_1. [linkage](urlage) \nblah\bblah", Id: "the_id"}
	Assert(t).That(getNoteFileBaseName(&note), Equals("Hello_World_the_reckoning_1_linkage_urlage"))

	// single line
	note = Note{Content: "Hello World", Id: "the_id"}
	Assert(t).That(getNoteFileBaseName(&note), Equals("Hello_World"))

	// default to ID if content empty
	note = Note{Content: "", Id: "the_id"}
	Assert(t).That(getNoteFileBaseName(&note), Equals("the_id"))
}
