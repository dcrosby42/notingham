package server

import (
	"fmt"

	"github.com/dcrosby42/notingham/util"
)

type Config struct {
	DataDir string
	Port    int
	SiteDir string
}

func (config *Config) Validate() error {
	if config.DataDir == "" {
		return fmt.Errorf("DataDir is required")
	}
	if !util.DirExists(config.DataDir) {
		return fmt.Errorf("DataDir %q doesn't exist", config.DataDir)
	}
	if config.SiteDir != "" {
		if !util.DirExists(config.DataDir) {
			return fmt.Errorf("SiteDir %q doesn't exist", config.SiteDir)
		}
	}
	return nil
}
