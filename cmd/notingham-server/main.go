package main

import (
	"fmt"
	"os"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func main() {
	args := os.Args[1:]
	if len(args) < 2 {
		fmt.Println("Usage: notingham-server <site-dir> <notes-dir>")
		os.Exit(1)
	}

	siteDir := args[0]
	notesDir := args[1]
	fmt.Printf("siteDir=%s notesDir=%s", siteDir, notesDir)

	r := gin.Default()

	r.SetTrustedProxies(nil) // https://pkg.go.dev/github.com/gin-gonic/gin#readme-don-t-trust-all-proxies

	// r.Static("/site/", siteDir)

	r.Use(static.Serve("/", static.LocalFile("public", true)))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	r.Run() // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
