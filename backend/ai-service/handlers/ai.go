package handlers

import (
	"math"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type ChatInput struct {
	Messages []struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"messages"`
	Context struct {
		JourneyType    string `json:"journey_type"`
		Fields         string `json:"fields"`
		EducationLevel string `json:"education_level"`
	} `json:"context"`
}

func Chat(c *gin.Context) {
	var input ChatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	lastMsg := ""
	if len(input.Messages) > 0 {
		lastMsg = strings.ToLower(input.Messages[len(input.Messages)-1].Content)
	}

	reply := "That sounds interesting. Could you tell me more about your academic background or any specific challenges you've overcome?"
	nodes := []gin.H{}

	if strings.Contains(lastMsg, "research") || strings.Contains(lastMsg, "project") {
		reply = "Research experience is very valuable. What was your specific role in this project, and what was the main outcome?"
		nodes = append(nodes, gin.H{"id": "node_1", "type": "achievement", "label": "Research Experience", "content": "Has participated in research/projects"})
	} else if strings.Contains(lastMsg, "challenge") || strings.Contains(lastMsg, "difficult") {
		reply = "Overcoming challenges shows resilience. How did this experience shape your perspective or future goals?"
		nodes = append(nodes, gin.H{"id": "node_2", "type": "challenge", "label": "Overcame Difficulty", "content": "Faced and overcame a challenge"})
	} else if strings.Contains(lastMsg, "leadership") || strings.Contains(lastMsg, "community") {
		reply = "Leadership and community involvement are great ways to stand out. Can you give an example of a time you led a team?"
		nodes = append(nodes, gin.H{"id": "node_3", "type": "impact", "label": "Community/Leadership", "content": "Involved in community or leadership roles"})
	}

	c.JSON(http.StatusOK, gin.H{
		"reply": reply,
		"nodes": nodes,
	})
}

type SOPAssistInput struct {
	Prompt          string `json:"prompt"`
	ExistingContent string `json:"existing_content"`
	Action          string `json:"action"`
}

func SOPAssist(c *gin.Context) {
	var input SOPAssistInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	suggestion := ""
	improvements := []gin.H{}

	if input.Action == "improve" {
		suggestion = "Here are some ways to improve your text: be more specific, avoid clichés, and use strong action verbs."
		if strings.Contains(strings.ToLower(input.ExistingContent), "passionate") {
			improvements = append(improvements, gin.H{
				"type":      "cliche",
				"original":  "passionate",
				"suggested": "deeply interested in",
			})
		}
	} else if input.Action == "continue" {
		suggestion = "Consider elaborating on the impact of your actions and how they prepare you for this program."
	} else if input.Action == "intro" {
		suggestion = "Start with a compelling hook—a specific anecdote or a defining moment that sparked your interest in the field."
	} else if input.Action == "conclusion" {
		suggestion = "Summarize your main points briefly, and clearly state how the target program aligns with your long-term career goals."
	}

	c.JSON(http.StatusOK, gin.H{
		"suggestion":   suggestion,
		"improvements": improvements,
	})
}

type SmartMatchInput struct {
	GPA             float64  `json:"gpa"`
	IELTS           float64  `json:"ielts"`
	TOEFL           int      `json:"toefl"`
	WorkExp         int      `json:"work_exp"`
	Fields          []string `json:"fields"`
	TargetCountries []string `json:"target_countries"`
	Budget          int      `json:"budget"`
}

func SmartMatch(c *gin.Context) {
	var input SmartMatchInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Mock scoring logic
	score := int(math.Min(100, (input.GPA/4.0)*60 + (input.IELTS/9.0)*20 + float64(input.WorkExp)*5))

	reach := []gin.H{}
	target := []gin.H{}
	safe := []gin.H{}

	mockProg1 := gin.H{"university": "Harvard University", "program": "Computer Science MS", "score": score - 15, "reasons": []string{"Highly competitive", "Requires high GPA"}}
	mockProg2 := gin.H{"university": "University of Toronto", "program": "Data Science MS", "score": score, "reasons": []string{"Good match for your GPA", "Aligns with budget"}}
	mockProg3 := gin.H{"university": "National University of Singapore", "program": "IT Management", "score": score + 15, "reasons": []string{"Safe option", "Exceeds work exp requirement"}}

	if score < 70 {
		reach = append(reach, mockProg1)
		target = append(target, mockProg2)
		safe = append(safe, mockProg3)
	} else if score < 85 {
		target = append(target, mockProg1, mockProg2)
		safe = append(safe, mockProg3)
	} else {
		safe = append(safe, mockProg1, mockProg2, mockProg3)
	}

	c.JSON(http.StatusOK, gin.H{
		"reach":  reach,
		"target": target,
		"safe":   safe,
	})
}

type EssayReviewInput struct {
	Content string `json:"content"`
	Prompt  string `json:"prompt"`
}

func EssayReview(c *gin.Context) {
	var input EssayReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	content := strings.ToLower(input.Content)
	wordCount := len(strings.Fields(content))
	score := 85
	feedback := "Solid draft with a good structure."
	issues := []gin.H{}
	strengths := []string{"Clear progression of ideas", "Good vocabulary"}

	if wordCount < 200 {
		score -= 20
		feedback = "The essay is quite short. Try expanding on your experiences."
		issues = append(issues, gin.H{"type": "length", "description": "Too short", "suggestion": "Add more details about a specific project."})
	}

	if strings.Contains(content, "always dreamed") || strings.Contains(content, "hard worker") {
		score -= 10
		issues = append(issues, gin.H{"type": "cliche", "description": "Uses cliches", "suggestion": "Replace 'always dreamed' with a specific moment of inspiration."})
	}

	c.JSON(http.StatusOK, gin.H{
		"score":     score,
		"feedback":  feedback,
		"issues":    issues,
		"strengths": strengths,
	})
}
