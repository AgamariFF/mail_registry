package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"mail_registry/internal/excel"
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

// DownloadIncomingLetter - скачивание файла письма
func (h *LetterHandler) DownloadIncomingLetter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid ID format",
		})
		return
	}

	letter, err := h.storage.GetIncomingLetterByID(id)
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
		OutgoingNumber   string `form:"outgoing_number" binding:"required"`
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
		OutgoingNumber:   letter.OutgoingNumber,
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
		ExternalNumber   string `form:"external_number" binding:"required"`
		RegistrationDate string `form:"registration_date" binding:"required"`
		Sender           string `form:"sender" binding:"required"`
		Addressee        string `form:"addressee" binding:"required"`
		Subject          string `form:"subject" binding:"required"`
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
		InternalNumber:   letter.InternalNumber,
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

// DeleteOutgoingLetter - удаление исходящего письма
func (h *LetterHandler) DeleteOutgoingLetter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid ID format",
		})
		return
	}

	// Сначала получаем письмо чтобы удалить файл если есть
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

	// Удаляем файл если он существует
	if letter.FilePath != "" {
		if err := os.Remove(letter.FilePath); err != nil && !os.IsNotExist(err) {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to delete file",
				"details": err.Error(),
			})
			return
		}
	}

	// Удаляем запись из БД
	if err := h.storage.DeleteOutgoingLetter(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete outgoing letter",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Outgoing letter deleted successfully",
	})
}

// DeleteIncomingLetter - удаление входящего письма
func (h *LetterHandler) DeleteIncomingLetter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid ID format",
		})
		return
	}

	// Сначала получаем письмо чтобы удалить файл если есть
	letter, err := h.storage.GetIncomingLetterByID(id)
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

	// Удаляем файл если он существует
	if letter.FilePath != "" {
		if err := os.Remove(letter.FilePath); err != nil && !os.IsNotExist(err) {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to delete file",
				"details": err.Error(),
			})
			return
		}
	}

	// Удаляем запись из БД
	if err := h.storage.DeleteIncomingLetter(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete incoming letter",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Incoming letter deleted successfully",
	})
}

func (h *LetterHandler) DownloadExcel(c *gin.Context) {
	fileName := "Mail_registry.xlsx"

	excelFile, err := excel.ToExcel(h.storage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error filling excel file",
		})
		return
	}

	if err := excelFile.SaveAs(fileName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error creating excel file",
		})
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Header("Content-Type", "application/octet-stream")

	c.File("./" + fileName)

	os.Remove("./" + fileName)
}

// UpdateOutgoingLetter - обновление исходящего письма
func (h *LetterHandler) UpdateOutgoingLetter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid ID format",
		})
		return
	}

	// Получаем существующее письмо
	existingLetter, err := h.storage.GetOutgoingLetterByID(id)
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

	var updateData struct {
		OutgoingNumber   string `form:"outgoing_number"`
		RegistrationDate string `form:"registration_date"`
		Recipient        string `form:"recipient"`
		Subject          string `form:"subject"`
		Executor         string `form:"executor"`
		RemoveFile       string `form:"remove_file"`
	}

	if err := c.ShouldBind(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input data",
			"details": err.Error(),
		})
		return
	}

	// Обновляем поля если они переданы
	if updateData.OutgoingNumber != "" {
		existingLetter.OutgoingNumber = updateData.OutgoingNumber
	}
	if updateData.Recipient != "" {
		existingLetter.Recipient = updateData.Recipient
	}
	if updateData.Subject != "" {
		existingLetter.Subject = updateData.Subject
	}
	if updateData.Executor != "" {
		existingLetter.Executor = updateData.Executor
	}

	// Обновляем дату если передана
	if updateData.RegistrationDate != "" {
		regDate, err := time.Parse("2006-01-02", updateData.RegistrationDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid date format",
				"details": err.Error(),
			})
			return
		}
		existingLetter.RegistrationDate = regDate
	}

	// Обрабатываем удаление файла
	if updateData.RemoveFile == "true" {
		if existingLetter.FilePath != "" {
			if err := os.Remove(existingLetter.FilePath); err != nil && !os.IsNotExist(err) {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   "Failed to delete file",
					"details": err.Error(),
				})
				return
			}
			existingLetter.FilePath = ""
		}
	}

	// Обрабатываем загрузку нового файла
	file, err := c.FormFile("file")
	if err == nil {
		// Удаляем старый файл если он есть
		if existingLetter.FilePath != "" {
			if err := os.Remove(existingLetter.FilePath); err != nil && !os.IsNotExist(err) {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   "Failed to delete old file",
					"details": err.Error(),
				})
				return
			}
		}

		// Сохраняем новый файл
		uploadPath := "./files/outgoing"
		os.MkdirAll(uploadPath, 0755)

		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
		filePath := filepath.Join(uploadPath, filename)

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to save file",
				"details": err.Error(),
			})
			return
		}
		existingLetter.FilePath = filePath
	}

	// Сохраняем обновленное письмо
	if err := h.storage.UpdateOutgoingLetter(existingLetter); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update outgoing letter",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Outgoing letter updated successfully",
		"letter":  existingLetter,
	})
}

// UpdateIncomingLetter - обновление входящего письма
func (h *LetterHandler) UpdateIncomingLetter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid ID format",
		})
		return
	}

	// Получаем существующее письмо
	existingLetter, err := h.storage.GetIncomingLetterByID(id)
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

	var updateData struct {
		InternalNumber   string `form:"internal_number"`
		ExternalNumber   string `form:"external_number"`
		RegistrationDate string `form:"registration_date"`
		Sender           string `form:"sender"`
		Addressee        string `form:"addressee"`
		Subject          string `form:"subject"`
		RegisteredBy     string `form:"registered_by"`
		RemoveFile       string `form:"remove_file"`
	}

	if err := c.ShouldBind(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input data",
			"details": err.Error(),
		})
		return
	}

	// Обновляем поля если они переданы
	if updateData.InternalNumber != "" {
		existingLetter.InternalNumber = updateData.InternalNumber
	}
	if updateData.ExternalNumber != "" {
		existingLetter.ExternalNumber = updateData.ExternalNumber
	}
	if updateData.Sender != "" {
		existingLetter.Sender = updateData.Sender
	}
	if updateData.Addressee != "" {
		existingLetter.Addressee = updateData.Addressee
	}
	if updateData.Subject != "" {
		existingLetter.Subject = updateData.Subject
	}
	if updateData.RegisteredBy != "" {
		existingLetter.RegisteredBy = updateData.RegisteredBy
	}

	// Обновляем дату если передана
	if updateData.RegistrationDate != "" {
		regDate, err := time.Parse("2006-01-02", updateData.RegistrationDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid date format",
				"details": err.Error(),
			})
			return
		}
		existingLetter.RegistrationDate = regDate
	}

	// Обрабатываем удаление файла
	if updateData.RemoveFile == "true" {
		if existingLetter.FilePath != "" {
			if err := os.Remove(existingLetter.FilePath); err != nil && !os.IsNotExist(err) {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   "Failed to delete file",
					"details": err.Error(),
				})
				return
			}
			existingLetter.FilePath = ""
		}
	}

	// Обрабатываем загрузку нового файла
	file, err := c.FormFile("file")
	if err == nil {
		// Удаляем старый файл если он есть
		if existingLetter.FilePath != "" {
			if err := os.Remove(existingLetter.FilePath); err != nil && !os.IsNotExist(err) {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   "Failed to delete old file",
					"details": err.Error(),
				})
				return
			}
		}

		// Сохраняем новый файл
		uploadPath := "./files/incoming"
		os.MkdirAll(uploadPath, 0755)

		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
		filePath := filepath.Join(uploadPath, filename)

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to save file",
				"details": err.Error(),
			})
			return
		}
		existingLetter.FilePath = filePath
	}

	// Сохраняем обновленное письмо
	if err := h.storage.UpdateIncomingLetter(existingLetter); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update incoming letter",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Incoming letter updated successfully",
		"letter":  existingLetter,
	})
}
