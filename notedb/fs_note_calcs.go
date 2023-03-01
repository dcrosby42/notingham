package notedb

import (
	"regexp"
	"strings"
)

var titleCleaner = regexp.MustCompile(`(\s|[^A-Za-z0-9_])+`)

func getNoteTitle(note *Note) string {
	s := strings.SplitN(note.Content, "\n", 2)[0]
	if s == "" {
		return note.Id
	}
	s = titleCleaner.ReplaceAllString(s, " ")
	s = strings.TrimSpace(s)
	return s
}

func getNoteFileBaseName(note *Note) string {
	s := getNoteTitle(note)
	s = strings.ReplaceAll(s, " ", "_")
	return s
}

func computeFilePath(note *Note, baseDir string) (string, error) {
	return "notes/" + note.Id + ".md", nil
}
