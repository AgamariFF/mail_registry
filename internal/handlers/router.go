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
		mailGroup.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "OK", "service": "mail"})
		})

		mailGroup.GET("/downloadExcel", letterHandler.DownloadExcel)

		// Исходящие письма
		mailGroup.GET("/outgoing", letterHandler.GetAllOutgoingLetters)
		mailGroup.GET("/outgoing/:id", letterHandler.GetOutgoingLetterByID)
		mailGroup.GET("/outgoing/:id/download", letterHandler.DownloadOutgoingLetter)
		mailGroup.POST("/outgoing", letterHandler.CreateOutgoingLetter)
		mailGroup.DELETE("/outgoing/:id", letterHandler.DeleteOutgoingLetter)
		mailGroup.GET("/addOut", func(c *gin.Context) {
			c.HTML(200, "add_outgoing_letter.html", nil)
		})

		// Входящие письма
		mailGroup.GET("/incoming", letterHandler.GetAllIncomingLetters)
		mailGroup.GET("/incoming/:id", letterHandler.GetIncomingLetterByID)
		mailGroup.GET("/incoming/:id/download", letterHandler.DownloadIncomingLetter)
		mailGroup.POST("/incoming", letterHandler.CreateIncomingLetter)
		mailGroup.DELETE("/incoming/:id", letterHandler.DeleteIncomingLetter)
		mailGroup.GET("/addInc", func(c *gin.Context) {
			c.HTML(200, "add_incoming_letter.html", nil)
		})
	}

	return router
}
