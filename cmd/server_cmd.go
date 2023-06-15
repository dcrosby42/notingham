package cmd

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/dcrosby42/notingham/server"
	"github.com/spf13/cobra"
)

var serverConfig server.Config

func init() {
	serverCmd.Flags().IntVar(&serverConfig.BindPort, "port", 9000, "server port to bind")
	serverCmd.Flags().StringVar(&serverConfig.BindHost, "host", "127.0.0.1", "server host/ip to bind")
	serverCmd.Flags().StringVar(&serverConfig.SiteDir, "site-dir", "", "dir from which to serve web assets; default is baked-in assets")
	serverCmd.Flags().StringVar(&serverConfig.DataDir, "data-dir", "", "where notes and objects are stored on disk")
	serverCmd.Flags().BoolVar(&serverConfig.UseOldNotebookStyle, "old-style", false, "use original note repo impl")
	Notingham.AddCommand(serverCmd)
}

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Run the web server",
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := serverConfig.Validate(); err != nil {
			return err
		}
		serverConfig.BindHost = "127.0.0.1"
		done := make(chan os.Signal, 1)
		signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
		return server.Serve(serverConfig, done)
	},
}
