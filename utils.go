package main

import (
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"strings"
)

func Hash(s string) string {
	hash := sha256.Sum256([]byte(s))
	return hex.EncodeToString(hash[:])
}

func GenerateSummary(content string) string {
	// Remove HTML tags
	re := regexp.MustCompile("<[^>]*>")
	plainText := re.ReplaceAllString(content, "")

	// Remove extra whitespace
	plainText = strings.Join(strings.Fields(plainText), " ")

	// Take first 150 characters as summary
	if len(plainText) > 150 {
		return plainText[:150] + "..."
	}
	return plainText
}

func getPageFromOffset(offset, limit *int) int {
	if offset == nil || limit == nil || *limit <= 0 {
		return 1
	}
	return (*offset / *limit) + 1
}

func getPageSize(limit *int) int {
	if limit == nil {
		return 10
	}
	return *limit
}
