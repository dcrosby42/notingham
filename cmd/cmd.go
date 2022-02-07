package cmd

import "github.com/spf13/cobra"

var root = &cobra.Command{
	Use:   "notingham",
	Short: "A note taking application",
}

func Execute() error {
	return root.Execute()
}
