package handlers

import (
	"net/http"
	"document-service/database"
	"document-service/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Get all documents
func GetDocuments(c *gin.Context) {
	var documents []models.Document
	database.DB.Find(&documents)
	c.JSON(http.StatusOK, gin.H{"data": documents})
}

// Create a document
type CreateDocInput struct {
	UserID  string `json:"user_id" binding:"required"`
	Title   string `json:"title" binding:"required"`
	DocType string `json:"doc_type" binding:"required"`
}

func CreateDocument(c *gin.Context) {
	var input CreateDocInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	doc := models.Document{
		ID:      uuid.NewString(),
		UserID:  input.UserID,
		Title:   input.Title,
		DocType: input.DocType,
		Status:  "ready",
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

	if err := database.DB.Model(&models.Document{}).Where("id = ?", docID).Update("content", input.Content).Error; err != nil {
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
