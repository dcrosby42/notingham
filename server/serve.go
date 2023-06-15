package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/dcrosby42/notingham/db"
	"github.com/dcrosby42/notingham/repo"
	"github.com/dcrosby42/notingham/site"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func Serve(config Config, done chan os.Signal) error {
	// myRepo := protodb.NewFsNotebookRepo(config.DataDir)
	myRepo := repo.New(config.DataDir)

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

	// Fetch all notes
	router.GET("/api/v1/notebooks/:notebook/notes", func(c *gin.Context) {
		var err error
		var notebook db.Notebook
		notebook, err = myRepo.GetNotebook(c.Param("notebook"))
		if err == nil {
			var notes []db.Note
			notes, err = notebook.AllNotes()
			if err == nil {
				c.JSON(200, notes)
				return
			}
		}
		c.JSON(500, gin.H{"error": err.Error()})
	})

	// Create or update existing note
	router.POST("/api/v1/notebooks/:notebook/notes/:id", func(c *gin.Context) {
		var err error
		notebook, err := myRepo.GetNotebook(c.Param("notebook"))
		if err == nil {
			var update db.Note
			if err := c.ShouldBindJSON(&update); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			update.Id = c.Param("id")
			err := notebook.SaveNote(update)
			if err == nil {
				c.JSON(200, gin.H{})
				return
			}
		}
		c.JSON(500, gin.H{"error": err.Error()})
	})

	// Delete note
	router.DELETE("/api/v1/notebooks/:notebook/notes/:id", func(c *gin.Context) {
		var err error
		notebook, err := myRepo.GetNotebook(c.Param("notebook"))
		if err == nil {
			err = notebook.DeleteNote(c.Param("id"))
			if err == nil {
				c.JSON(200, gin.H{})
				return
			}
		}
		c.JSON(500, gin.H{"error": err.Error()})
	})

	//
	// Start a server w graceful shutdown
	//

	srv := &http.Server{
		Addr:    fmt.Sprintf("%s:%v", config.BindHost, config.BindPort),
		Handler: router,
	}

	// Start listening in a goroutine:
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe err: %s\n", err)
		}
	}()
	log.Printf("Server Started: %s", srv.Addr)

	// Block on shutdown signal
	<-done
	log.Print("Server Shutdown requested")

	// Ask server to shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer func() {
		// extra handling here
		cancel()
	}()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server Shutdown Failed:%+v", err)
	}

	log.Print("Server Exited")
	return nil
}
