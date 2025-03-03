package main

import (
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"strconv"
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

// parseInt 将字符串转换为整数，如果转换失败则返回默认值
func parseInt(s string, defaultValue int) (int, error) {
	if s == "" {
		return defaultValue, nil
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return defaultValue, err
	}
	return v, nil
}

// getPageFromOffset 根据偏移量和每页大小计算当前页码
func getPageFromOffset(offset, limit *int) int {
	if offset == nil || limit == nil || *limit <= 0 {
		return 1
	}
	return (*offset / *limit) + 1
}

// getPageSize 获取每页大小，如果未设置则返回默认值10
func getPageSize(limit *int) int {
	if limit == nil {
		return 10
	}
	return *limit
}
