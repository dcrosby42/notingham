package main

import (
	"fmt"
	"os"

	"github.com/dcrosby42/notingham/cmd"
)

func main() {
	if err := cmd.Execute(); err != nil {
		fmt.Printf("ERROR: %s\n", err)
		os.Exit(1)
	}
}
