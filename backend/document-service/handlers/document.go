package handlers

import (
	"document-service/database"
	"document-service/models"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ledongthuc/pdf"
)

// Get all documents
func GetDocuments(c *gin.Context) {
	var documents []models.Document
	database.DB.Find(&documents)
	c.JSON(http.StatusOK, gin.H{"data": documents})
}

// Create a document
type CreateDocInput struct {
	UserID  string `json:"user_id"`
	Title   string `json:"title"`
	DocType string `json:"doc_type"`
}

func CreateDocument(c *gin.Context) {
	var userID, title, docType string
	var fileSize int64
	var fileURL string

	file, err := c.FormFile("file")
	if err == nil {
		userID = c.PostForm("user_id")
		title = c.PostForm("title")
		docType = c.PostForm("doc_type")
		if title == "" {
			title = file.Filename
		}
		if docType == "" {
			docType = "PDF"
		}
		if userID == "" {
			userID = "dummy-user-id"
		}
		os.MkdirAll("uploads", 0755)
		filename := uuid.NewString() + "_" + file.Filename
		savePath := filepath.Join("uploads", filename)
		if err := c.SaveUploadedFile(file, savePath); err == nil {
			fileURL = "/api/v1/documents/download/" + filename
			fileSize = file.Size
		}
	} else {
		var input CreateDocInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		userID = input.UserID
		title = input.Title
		docType = input.DocType
		if userID == "" {
			userID = "dummy-user-id"
		}
		if docType == "" {
			docType = "PDF"
		}
		fileSize = 1024 * 120 // default mock size 120KB
	}

	doc := models.Document{
		ID:        uuid.NewString(),
		UserID:    userID,
		Title:     title,
		DocType:   docType,
		Status:    "ready",
		FileURL:   fileURL,
		FileSize:  fileSize,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := database.DB.Create(&doc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": doc})
}

// Update document content
type UpdateDocInput struct {
	Content string `json:"content" binding:"required"`
}

func UpdateDocument(c *gin.Context) {
	docID := c.Param("id")
	var input UpdateDocInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&models.Document{}).Where("id = ?", docID).Updates(map[string]interface{}{
		"content":    input.Content,
		"updated_at": time.Now(),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Document updated successfully"})
}

func DeleteDocument(c *gin.Context) {
	docID := c.Param("id")
	if err := database.DB.Where("id = ?", docID).Delete(&models.Document{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Document deleted successfully"})
}

func DownloadDocument(c *gin.Context) {
	id := c.Param("id")
	var doc models.Document
	if err := database.DB.Where("id = ? OR file_url LIKE ?", id, "%"+id+"%").First(&doc).Error; err != nil {
		// try directly opening from uploads if id is filename
		savePath := filepath.Join("uploads", id)
		if _, err := os.Stat(savePath); err == nil {
			c.File(savePath)
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}
	if doc.FileURL != "" {
		filename := filepath.Base(doc.FileURL)
		c.File(filepath.Join("uploads", filename))
		return
	}
	c.String(http.StatusOK, "Document content: "+doc.Title)
}

func ExtractDocumentText(c *gin.Context) {
	id := c.Param("id")
	var doc models.Document
	if err := database.DB.Where("id = ? OR file_url LIKE ?", id, "%"+id+"%").First(&doc).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}

	if doc.FileURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Document has no file attached"})
		return
	}

	filename := filepath.Base(doc.FileURL)
	filePath := filepath.Join("uploads", filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found on disk"})
		return
	}

	// Read PDF text
	f, r, err := pdf.Open(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse PDF"})
		return
	}
	defer f.Close()

	var sb strings.Builder
	b, err := r.GetPlainText()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract text"})
		return
	}
	
	// GetPlainText returns an io.Reader
	buf := make([]byte, 1024)
	for {
		n, err := b.Read(buf)
		if n > 0 {
			sb.Write(buf[:n])
		}
		if err != nil {
			break
		}
	}

	c.JSON(http.StatusOK, gin.H{"text": sb.String()})
}

type SaveSOPInput struct {
	ApplicationID  string `json:"application_id" binding:"required"`
	Prompt         string `json:"prompt"`
	Content        string `json:"content"`
	Score          int    `json:"score"`
	AIFeedback     string `json:"ai_feedback"`
	MentorFeedback string `json:"mentor_feedback"`
}

func SaveSOPVersion(c *gin.Context) {
	var input SaveSOPInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var count int64
	database.DB.Model(&models.SOPVersionHistory{}).Where("application_id = ?", input.ApplicationID).Count(&count)
	nextVersion := int(count) + 1

	versionRecord := models.SOPVersionHistory{
		ID:             uuid.NewString(),
		ApplicationID:  input.ApplicationID,
		VersionNumber:  nextVersion,
		Prompt:         input.Prompt,
		Content:        input.Content,
		Score:          input.Score,
		AIFeedback:     input.AIFeedback,
		MentorFeedback: input.MentorFeedback,
		CreatedAt:      time.Now(),
	}

	if err := database.DB.Create(&versionRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save SOP version"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Saved SOP version", "data": versionRecord})
}

func GetSOPHistory(c *gin.Context) {
	appID := c.Param("appId")
	var versions []models.SOPVersionHistory
	database.DB.Where("application_id = ?", appID).Order("version_number desc").Find(&versions)
	c.JSON(http.StatusOK, gin.H{"data": versions})
}
