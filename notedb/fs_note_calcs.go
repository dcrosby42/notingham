package notedb

import (
	"fmt"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/dcrosby42/notingham/util"
)

var titleCleanerExpr = regexp.MustCompile(`(\s|[^A-Za-z0-9_])+`)

func getNoteTitle(note *Note) string {
	s := strings.SplitN(note.Content, "\n", 2)[0]
	if s == "" {
		return note.Id
	}
	s = titleCleanerExpr.ReplaceAllString(s, " ")
	s = strings.TrimSpace(s)
	return s
}

func getNoteFileName(note *Note) string {
	s := getNoteTitle(note)
	s = strings.ReplaceAll(s, " ", "_")
	return s + ".md"
}

var numberedFileExpr = regexp.MustCompile(`\.\d+$`)

func newRelFilePath(note *Note, baseDir, subDir string) (string, error) {
	fname := getNoteFileName(note)
	for util.FileExists(filepath.Join(baseDir, subDir, fname)) {
		fname = strings.TrimSuffix(fname, ".md")
		i := int64(0)
		if numberedFileExpr.MatchString(fname) {
			suffix := filepath.Ext(fname)
			fname = strings.TrimSuffix(fname, suffix)
			i, _ = strconv.ParseInt(suffix[1:], 10, 0)
		}
		i++
		fname = fmt.Sprintf("%s.%d.md", fname, i)
	}
	return filepath.Join(subDir, fname), nil
}
