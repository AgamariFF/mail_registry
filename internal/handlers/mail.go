package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"mail_registry/internal/models"
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

// CreateOutgoingLetter - создание исходящего письма
func (h *LetterHandler) CreateOutgoingLetter(c *gin.Context) {
	var letter struct {
		InternalNumber   string `form:"internal_number" binding:"required"`
		RegistrationDate string `form:"registration_date" binding:"required"`
		Recipient        string `form:"recipient" binding:"required"`
		Subject          string `form:"subject" binding:"required"`
		Executor         string `form:"executor" binding:"required"`
	}

	if err := c.ShouldBind(&letter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input data",
			"details": err.Error(),
		})
		return
	}

	// Парсим дату
	regDate, err := time.Parse("2006-01-02", letter.RegistrationDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid date format",
			"details": err.Error(),
		})
		return
	}

	// Обрабатываем файл
	filePath := ""
	file, err := c.FormFile("file")
	if err == nil {
		// Сохраняем файл
		uploadPath := "./files/outgoing"
		os.MkdirAll(uploadPath, 0755)

		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
		filePath = filepath.Join(uploadPath, filename)

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to save file",
				"details": err.Error(),
			})
			return
		}
	}

	newLetter := &models.OutgoingLetter{
		OutgoingNumber:   letter.InternalNumber,
		RegistrationDate: regDate,
		Subject:          letter.Subject,
		Executor:         letter.Executor,
		FilePath:         filePath,
		Recipient:        letter.Recipient,
	}

	if err := h.storage.CreateOutgoingLetter(newLetter); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create outgoing letter",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, newLetter)
}

// CreateIncomingLetter - создание входящего письма
func (h *LetterHandler) CreateIncomingLetter(c *gin.Context) {
	var letter struct {
		InternalNumber   string `form:"internal_number" binding:"required"`
		ExternalNumber   string `form:"external_number"`
		RegistrationDate string `form:"registration_date" binding:"required"`
		Sender           string `form:"sender" binding:"required"`
		Addressee        string `form:"addressee" binding:"required"`
		Subject          string `form:"subject" binding:"required"`
		Executor         string `form:"executor" binding:"required"`
		RegisteredBy     string `form:"registered_by" binding:"required"`
	}

	if err := c.ShouldBind(&letter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input data",
			"details": err.Error(),
		})
		return
	}

	// Парсим дату
	regDate, err := time.Parse("2006-01-02", letter.RegistrationDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid date format",
			"details": err.Error(),
		})
		return
	}

	// Обрабатываем файл
	filePath := ""
	file, err := c.FormFile("file")
	if err == nil {
		// Сохраняем файл
		uploadPath := "./files/incoming"
		os.MkdirAll(uploadPath, 0755)

		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
		filePath = filepath.Join(uploadPath, filename)

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to save file",
				"details": err.Error(),
			})
			return
		}
	}

	newLetter := &models.IncomingLetter{
		IncomingNumber:   letter.InternalNumber,
		RegistrationDate: regDate,
		Subject:          letter.Subject,
		FilePath:         filePath,
		ExternalNumber:   letter.ExternalNumber,
		Sender:           letter.Sender,
		Addressee:        letter.Addressee,
		RegisteredBy:     letter.RegisteredBy,
	}

	if err := h.storage.CreateIncomingLetter(newLetter); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create incoming letter",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, newLetter)
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
