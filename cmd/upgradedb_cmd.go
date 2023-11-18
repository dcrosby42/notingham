package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"log"

	"github.com/dcrosby42/notingham/db"
	"github.com/spf13/cobra"
)

type UpgradeDbOpts struct {
	NotesDir string
}

var upgradeDbOpts UpgradeDbOpts

func init() {
	upgradeDbCmd.Flags().StringVar(&upgradeDbOpts.NotesDir, "notes-dir", "", "dir under a notebook in which to upgrade all the notes")
	Notingham.AddCommand(upgradeDbCmd)
}

var upgradeDbCmd = &cobra.Command{
	Use:   "upgradedb",
	Short: "Upgrade old notes to new fsdb style",
	RunE: func(cmd *cobra.Command, args []string) error {
		return UpgradeNotesDir(upgradeDbOpts.NotesDir)
	},
}

func UpgradeNotesDir(notesDir string) error {
	infos, err := os.ReadDir(notesDir)
	if err != nil {
		return err
	}
	for _, info := range infos {
		if !info.IsDir() && filepath.Ext(info.Name()) == ".md" {
			oldPath := filepath.Join(notesDir, info.Name())
			id := db.NoteId()
			newPath := filepath.Join(notesDir, id) + ".md"
			// fmt.Printf("%s %s %v\n", filepath.Ext(info.Name()), info.Name(), info.IsDir())
			fmt.Printf("Renaming: %s => %s\n", oldPath, newPath)
			err := os.Rename(oldPath, newPath)
			if err != nil {
				log.Printf("FAILED to rename %s => %s: %s", oldPath, newPath, err)
			}
		}
	}

	return nil
}
