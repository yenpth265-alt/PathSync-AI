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
	userID := c.GetString("userID")

	var documents []models.Document
	database.DB.Where("user_id = ?", userID).Find(&documents)
	c.JSON(http.StatusOK, gin.H{"data": documents})
}

// Create a document
type CreateDocInput struct {
	Title   string `json:"title"`
	DocType string `json:"doc_type"`
}

func CreateDocument(c *gin.Context) {
	userID := c.GetString("userID")
	var title, docType string
	var fileSize int64
	var fileURL string

	file, err := c.FormFile("file")
	if err == nil {
		title = c.PostForm("title")
		docType = c.PostForm("doc_type")
		if title == "" {
			title = file.Filename
		}
		if docType == "" {
			docType = "PDF"
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
		title = input.Title
		docType = input.DocType
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
	userID := c.GetString("userID")
	var input UpdateDocInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&models.Document{}).Where("id = ? AND user_id = ?", docID, userID).Updates(map[string]interface{}{
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
	userID := c.GetString("userID")

	if err := database.DB.Where("id = ? AND user_id = ?", docID, userID).Delete(&models.Document{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Document deleted successfully"})
}

func DownloadDocument(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("userID")

	var doc models.Document
	query := database.DB.Where("(id = ? OR file_url LIKE ?) AND user_id = ?", id, "%"+id+"%", userID)

	if err := query.First(&doc).Error; err != nil {
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
	userID := c.GetString("userID")

	var doc models.Document
	query := database.DB.Where("(id = ? OR file_url LIKE ?) AND user_id = ?", id, "%"+id+"%", userID)

	if err := query.First(&doc).Error; err != nil {
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
		c.JSON(http.StatusNotFound, gin.H{"error": "File không còn tồn tại trên server. Vui lòng xóa và upload lại file CV mới để bóc tách."})
		return
	}

	mimeType := mimeTypeForExt(filepath.Ext(filename))

	// Try to pull a text layer out of real PDFs. This is empty (not an error)
	// for scanned/image-only PDFs and for image files — the raw bytes below
	// let the AI side read those directly instead, since Gemini understands
	// PDFs and images natively without needing an OCR pass here.
	var extractedText string
	if mimeType == "application/pdf" {
		if f, r, err := pdf.Open(filePath); err == nil {
			defer f.Close()
			var sb strings.Builder
			if b, err := r.GetPlainText(); err == nil {
				buf := make([]byte, 1024)
				for {
					n, readErr := b.Read(buf)
					if n > 0 {
						sb.Write(buf[:n])
					}
					if readErr != nil {
						break
					}
				}
			}
			extractedText = sb.String()
		}
	}

	resp := gin.H{"text": extractedText}

	const maxInlineFileSize = 8 * 1024 * 1024 // 8MB, comfortably under Gemini's inline-data limit
	if info, err := os.Stat(filePath); err == nil && info.Size() <= maxInlineFileSize && mimeType != "" {
		if fileBytes, err := os.ReadFile(filePath); err == nil {
			resp["file_data"] = fileBytes
			resp["mime_type"] = mimeType
		}
	}

	c.JSON(http.StatusOK, resp)
}

// mimeTypeForExt returns the MIME type the AI service needs to read a file
// directly (PDF or image). Empty string means "not a format the AI can read
// natively" — extraction then relies solely on any extracted text.
func mimeTypeForExt(ext string) string {
	switch strings.ToLower(ext) {
	case ".pdf":
		return "application/pdf"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	default:
		return ""
	}
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
	userID := c.GetString("userID")

	var input SaveSOPInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Scoped to the caller: this service has no access to application-service's
	// ownership records to verify the application_id itself belongs to this
	// user, but scoping every version by who actually wrote it means one
	// authenticated user can no longer read or overwrite another user's SOP
	// drafts, scores, and mentor feedback just by supplying their application
	// UUID (previously unscoped entirely).
	var count int64
	database.DB.Model(&models.SOPVersionHistory{}).Where("application_id = ? AND user_id = ?", input.ApplicationID, userID).Count(&count)
	nextVersion := int(count) + 1

	versionRecord := models.SOPVersionHistory{
		ID:             uuid.NewString(),
		UserID:         userID,
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
	database.DB.Where("application_id = ? AND user_id = ?", appID, c.GetString("userID")).Order("version_number desc").Find(&versions)
	c.JSON(http.StatusOK, gin.H{"data": versions})
}
