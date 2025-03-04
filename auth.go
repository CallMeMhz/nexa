package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
)

var authConfig struct {
	Enabled   bool
	JwtSecret []byte
	PwdHash   string
}

// 初始化认证配置
func init() {
	if secret := os.Getenv("NEXA_SECRET"); secret != "" {
		authConfig.JwtSecret = []byte(secret)
	} else {
		authConfig.JwtSecret = make([]byte, 32)
		if _, err := rand.Read(authConfig.JwtSecret); err != nil {
			logrus.WithError(err).Fatal("failed to generate random secret key")
		}
	}

	if pwd := os.Getenv("NEXA_PASSWORD"); pwd != "" {
		authConfig.Enabled = true
		hash := sha256.Sum256([]byte(pwd))
		authConfig.PwdHash = hex.EncodeToString(hash[:])
		logrus.Info("Authentication enabled")
	} else {
		logrus.Info("Authentication disabled (no password set)")
	}
}

// 验证密码是否正确
func validatePassword(password string) bool {
	if !authConfig.Enabled {
		return true
	}
	hash := sha256.Sum256([]byte(password))
	hexHash := hex.EncodeToString(hash[:])
	return hexHash == authConfig.PwdHash
}

// 生成JWT令牌
func generateToken() (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"exp": time.Now().Add(time.Hour * 24 * 7).Unix(),
	})

	tokenString, err := token.SignedString(authConfig.JwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// 验证JWT令牌是否有效
func validateToken(tokenString string) bool {
	if !authConfig.Enabled {
		return true
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return authConfig.JwtSecret, nil
	})

	if err != nil {
		logrus.WithError(err).Debug("Token validation failed")
		return false
	}

	return token.Valid
}
