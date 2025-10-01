package handlers

import (
	"mail_registry/internal/storage"

	"github.com/gin-gonic/gin"
)

func SetupRouter(store *storage.Storage) *gin.Engine {
	router := gin.Default()

	letterHandler := NewLetterHandler(store)

	// Статические файлы
	router.Static("/static", "./static")
	router.LoadHTMLGlob("templates/*")

	mailGroup := router.Group("/mail")
	{
		// HTML страница
		mailGroup.GET("/", func(c *gin.Context) {
			c.HTML(200, "index.html", nil)
		})

		// API endpoints
		mailGroup.GET("/outgoing", letterHandler.GetAllOutgoingLetters)
		mailGroup.GET("/incoming", letterHandler.GetAllIncomingLetters)
		mailGroup.GET("/outgoing/:id", letterHandler.GetOutgoingLetterByID)
		mailGroup.GET("/incoming/:id", letterHandler.GetIncomingLetterByID)
		mailGroup.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "OK", "service": "mail"})
		})
		mailGroup.GET("/outgoing/:id/download", letterHandler.DownloadOutgoingLetter)
		mailGroup.POST("/outgoing", letterHandler.CreateOutgoingLetter)
		mailGroup.POST("/incoming", letterHandler.CreateIncomingLetter)
	}

	return router
}
