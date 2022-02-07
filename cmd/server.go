package cmd

import (
	"github.com/dcrosby42/notingham/server"
	"github.com/spf13/cobra"
)

var serverConfig server.Config

func init() {
	serverCmd.Flags().IntVar(&serverConfig.Port, "port", 9000, "server port to bind")
	serverCmd.Flags().StringVar(&serverConfig.SiteDir, "site-dir", "", "in devel mode, the dir to serve static website assets from")
	serverCmd.Flags().StringVar(&serverConfig.DataDir, "data-dir", "", "where notes and objects are stored on disk")
	root.AddCommand(serverCmd)
}

var serverCmd = &cobra.Command{
	Use:   "server --data-dir <DATADIR> [--port=90000] [--devel] [--site-dir <SITEDIR>]",
	Short: "Run the web server",
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := serverConfig.Validate(); err != nil {
			return err
		}
		return server.Serve(serverConfig)
	},
}
