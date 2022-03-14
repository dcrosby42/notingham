package server

import (
	"fmt"
	"net/http"

	"github.com/dcrosby42/notingham/notedb"
	"github.com/dcrosby42/notingham/site"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func Serve(config Config) error {
	repo := notedb.NewFsNotebookRepo(config.DataDir)

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

	router.GET("/api/v1/notebooks/:notebook/notes", func(c *gin.Context) {
		var err error
		notebook, err := repo.GetNotebook(c.Param("notebook"))
		if err == nil {
			notes, err := notebook.AllNotes()
			fmt.Printf("AllNotes %#v\n", notes)
			if err == nil {
				c.JSON(200, notes)
				return
			}
		}
		c.JSON(500, gin.H{"error": err.Error()})
	})
	router.POST("/api/v1/notebooks/:notebook/notes/:id", func(c *gin.Context) {
		var err error
		notebook, err := repo.GetNotebook(c.Param("notebook"))
		if err == nil {
			var update notedb.Note
			if err := c.ShouldBindJSON(&update); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			update.Id = c.Param("id")
			_, err := notebook.SaveNote(update)
			if err == nil {
				c.JSON(200, gin.H{})
				return
			}
		}
		c.JSON(500, gin.H{"error": err.Error()})
	})
	router.DELETE("/api/v1/notebook/:notebook/notes/:id", func(c *gin.Context) {
		var err error
		notebook, err := repo.GetNotebook(c.Param("notebook"))
		if err == nil {
			_, err := notebook.DeleteNote(c.Param("id"))
			if err == nil {
				c.JSON(200, gin.H{})
				return
			}
		}
		c.JSON(500, gin.H{"error": err.Error()})
	})

	if config.Port == 0 {
		config.Port = 9000
	}
	router.Run(fmt.Sprintf("0.0.0.0:%v", config.Port)) // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")

	return nil
}
