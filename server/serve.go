package server

import (
	"fmt"

	"github.com/dcrosby42/notingham/notedb"
	"github.com/dcrosby42/notingham/site"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func Serve(config Config) error {

	router := gin.Default()

	router.SetTrustedProxies(nil) // https://pkg.go.dev/github.com/gin-gonic/gin#readme-don-t-trust-all-proxies

	var siteFS static.ServeFileSystem

	if len(config.SiteDir) > 0 {
		// Serve website assets live from disk:
		siteFS = static.LocalFile("public", true)
	} else {
		// Serve website assets from in-binary asset store:
		siteFS = &StaticAssetAdapter{site.Assets}
	}
	router.Use(static.Serve("/", siteFS))

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	noteDb := notedb.NoteDb{Dir: config.DataDir}
	router.GET("/api/v1/notes", func(c *gin.Context) {
		notes, err := noteDb.AllNoteFiles()
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
		} else {
			c.JSON(200, notes)
		}
	})

	if config.Port == 0 {
		config.Port = 9000
	}
	router.Run(fmt.Sprintf("0.0.0.0:%v", config.Port)) // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")

	return nil
}
