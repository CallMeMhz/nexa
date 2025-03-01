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
	// 移除HTML标签
	re := regexp.MustCompile("<[^>]*>")
	plainText := re.ReplaceAllString(content, "")

	// 移除多余空白
	plainText = strings.Join(strings.Fields(plainText), " ")

	// 截取前150个字符作为摘要
	if len(plainText) > 150 {
		return plainText[:150] + "..."
	}
	return plainText
}
