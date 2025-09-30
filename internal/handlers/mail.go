package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"mail_registry/internal/storage"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type LetterHandler struct {
	storage *storage.Storage
}

func NewLetterHandler(storage *storage.Storage) *LetterHandler {
	return &LetterHandler{storage: storage}
}

// GetAllOutgoingLetters - получение всех исходящих писем
func (h *LetterHandler) GetAllOutgoingLetters(c *gin.Context) {
	letters, err := h.storage.GetOutgoingLetters()
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, letters)
}

// GetOutgoingLetterByID - получение письма по ID
func (h *LetterHandler) GetOutgoingLetterByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid ID format",
		})
		return
	}

	letter, err := h.storage.GetOutgoingLetterByID(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Letter not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch letter",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, letter)
}

// DownloadOutgoingLetter - скачивание файла письма
func (h *LetterHandler) DownloadOutgoingLetter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid ID format",
		})
		return
	}

	letter, err := h.storage.GetOutgoingLetterByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Letter not found",
		})
		return
	}

	if letter.FilePath == "" {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "File not found",
		})
		return
	}

	if _, err := os.Stat(letter.FilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "File does not exist on server",
		})
		return
	}

	filename := filepath.Base(letter.FilePath)

	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/octet-stream")

	c.File(letter.FilePath)
}

// GetAllIncomingLetters - получение всех входящих писем
func (h *LetterHandler) GetAllIncomingLetters(c *gin.Context) {
	letters, err := h.storage.GetIncomingLetters()
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, letters)
}

// GetIncomingLetterByID - получение письма по ID
func (h *LetterHandler) GetIncomingLetterByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	letter, err := h.storage.GetIncomingLetterByID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Letter not found"})
		return
	}
	c.JSON(200, letter)
}
