package server

import (
	"fmt"

	"github.com/dcrosby42/notingham/util"
)

type Config struct {
	DataDir             string
	BindHost            string
	BindPort            int
	SiteDir             string
	UseOldNotebookStyle bool
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
	if config.BindHost == "" {
		config.BindHost = "0.0.0.0"
	}
	return nil
}
