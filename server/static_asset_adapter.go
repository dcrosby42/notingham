package server

import (
	"github.com/jessevdk/go-assets"
)

// Adapts the go-assets FileSystem type to serve as an instance of
// gin's static.ServeFileSystem by implementing Exists
type StaticAssetAdapter struct {
	*assets.FileSystem
}

func (me *StaticAssetAdapter) Exists(prefix, path string) bool {
	return me.Files[path] != nil || me.Dirs[path] != nil
}
