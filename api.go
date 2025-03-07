package main

import (
	"net/url"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/robfig/cron/v3"
	"github.com/samber/lo"
	"github.com/sirupsen/logrus"
)

func (svc *Service) listen(addr string) {
	r := gin.Default()
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	apiGroup := r.Group("/api")
	apiGroup.POST("/login", svc.Login)
	apiGroup.GET("/auth-status", svc.AuthStatus)
	apiGroup.Use(svc.authMiddleware())
	{
		apiGroup.GET("/feeds", svc.ListAllFeeds)
		apiGroup.GET("/feed/all", svc.ListAllItems)
		apiGroup.GET("/feed/:feed_id", svc.ListFeedItems)

		apiGroup.POST("/feed", svc.AddFeed)
		apiGroup.PUT("/feed/:feed_id", svc.UpdateFeed)
		apiGroup.DELETE("/feed/:feed_id", svc.DeleteFeed)

		apiGroup.GET("/item/:item_id", svc.GetItem)
		apiGroup.PATCH("/item/:item_id", svc.UpdateItem)
	}

	buildPath := "./web/build"

	r.Static("/static", filepath.Join(buildPath, "static"))
	r.StaticFile("/favicon.ico", filepath.Join(buildPath, "favicon.ico"))
	r.StaticFile("/manifest.json", filepath.Join(buildPath, "manifest.json"))
	r.StaticFile("/robots.txt", filepath.Join(buildPath, "robots.txt"))
	r.StaticFile("/index.html", filepath.Join(buildPath, "index.html"))

	// Handle SPA routing - serve index.html for any unmatched routes
	r.NoRoute(func(c *gin.Context) {
		indexPath := filepath.Join(buildPath, "index.html")
		c.File(indexPath)
	})

	r.Run(addr)
}

func (svc *Service) AddFeed(c *gin.Context) {
	ctx := c.Request.Context()

	req := new(struct {
		Url       string   `json:"url"`
		Desc      string   `json:"desc"`
		Cron      string   `json:"cron"`
		Suspended bool     `json:"suspended"`
		Tags      []string `json:"tags"`
	})
	if err := c.BindJSON(req); err != nil {
		logrus.WithError(err).Warn("invalid request")
		c.JSON(400, gin.H{"error": err.Error()})
		return
	} else if u, err := url.Parse(req.Url); err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		logrus.WithError(err).Warn("invalid feed url schema")
		c.JSON(400, gin.H{"error": "invalid feed url schema"})
		return
	} else if _, err := cron.ParseStandard(req.Cron); err != nil {
		logrus.WithError(err).Warn("invalid schedule spec")
		c.JSON(400, gin.H{"error": "invalid schedule spec"})
		return
	}

	id := Hash(req.Url)
	feed := &Feed{
		ID:        id,
		Link:      req.Url,
		Desc:      req.Desc,
		Cron:      req.Cron,
		Suspended: req.Suspended,
		Tags:      req.Tags,
	}

	if err := svc.db.SaveFeed(ctx, feed); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if !feed.Suspended {
		svc.subscribe(feed)
		if err := svc.fetch(ctx, feed.ID); err != nil {
			logrus.WithField("feed_id", feed.ID).WithError(err).Error("fetch feed error")
		}
	}

	c.JSON(200, gin.H{"feed": feed})
}

func (svc *Service) UpdateFeed(c *gin.Context) {
	ctx := c.Request.Context()
	feedID := c.Param("feed_id")

	req := new(struct {
		Url       string   `json:"url"`
		Desc      string   `json:"desc"`
		Cron      string   `json:"cron"`
		Tags      []string `json:"tags"`
		Suspended bool     `json:"suspended"`
	})
	if err := c.BindJSON(req); err != nil {
		logrus.WithError(err).Warn("invalid request")
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	feed, err := svc.db.GetFeed(ctx, feedID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	feed.Link = req.Url
	feed.Desc = req.Desc
	feed.Cron = req.Cron
	feed.Tags = req.Tags
	feed.Suspended = req.Suspended

	if err := svc.db.SaveFeed(ctx, feed); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if feed.Suspended {
		svc.unsubscribe(feedID)
	} else {
		svc.subscribe(feed)
	}

	c.JSON(200, gin.H{"feed": feed})
}

func (svc *Service) DeleteFeed(c *gin.Context) {
	ctx := c.Request.Context()
	feedID := c.Param("feed_id")

	if err := svc.db.DeleteFeed(ctx, feedID); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	svc.unsubscribe(feedID)

	c.JSON(200, gin.H{"success": true})
}

func (svc *Service) ListAllFeeds(c *gin.Context) {
	ctx := c.Request.Context()

	feeds, err := svc.db.FilterFeeds(ctx, []string{})
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	tags, err := svc.db.ListTags(ctx)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"feeds": feeds, "tags": tags})
}

func (svc *Service) ListAllItems(c *gin.Context) {
	ctx := c.Request.Context()

	tags := c.QueryArray("tags")
	feedsResult, err := svc.db.FilterFeeds(ctx, tags)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	feeds := lo.Map(feedsResult, func(feed *ListFeedResult, _ int) *Feed { return feed.Feed })
	svc.listItems(c, feeds...)
}

func (svc *Service) ListFeedItems(c *gin.Context) {
	ctx := c.Request.Context()
	feedID := c.Param("feed_id")
	log := logrus.WithField("feed_id", feedID)

	feed, err := svc.db.GetFeed(ctx, feedID)
	if err != nil {
		log.WithError(err).Error("get feed error")
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	svc.listItems(c, feed)
}

func (svc *Service) listItems(c *gin.Context, feeds ...*Feed) {
	ctx := c.Request.Context()
	unread := c.Query("unread") == "true"
	today := c.Query("today") == "true"
	starred := c.Query("starred") == "true"
	liked := c.Query("liked") == "true"
	query := c.Query("q")
	refresh := c.Query("refresh") == "true"

	if refresh {
		for _, feed := range feeds {
			if err := svc.fetch(ctx, feed.ID); err != nil {
				logrus.WithField("feed_id", feed.ID).WithError(err).Error("refresh feed error")
			}
		}
	}

	filter := &ItemFilter{
		FeedIDs: lo.Map(feeds, func(feed *Feed, _ int) string { return feed.ID }),
	}

	page, err := strconv.Atoi(c.Query("page"))
	if err != nil {
		page = 1
	}
	if page < 1 {
		page = 1
	}
	size, err := strconv.Atoi(c.Query("size"))
	if err != nil {
		size = 10
	}
	if size < 1 {
		size = 10
	}
	offset := (page - 1) * size
	filter.Limit = &size
	filter.Offset = &offset

	if unread {
		filter.Unread = &unread
	}
	if starred {
		filter.Starred = &starred
	}
	if liked {
		filter.Liked = &liked
	}
	if today {
		now := time.Now()
		todayTime := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).UTC()
		filter.PubDate = &todayTime
	}
	if query != "" {
		filter.SearchQuery = &query
	}

	total, err := svc.db.CountItems(ctx, filter)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// 获取分页数据
	items, err := svc.db.FilterItems(ctx, filter)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"items": items,
		"pagination": gin.H{
			"total": total,
			"page":  getPageFromOffset(filter.Offset, filter.Limit),
			"size":  getPageSize(filter.Limit),
		},
	})
}

func (svc *Service) GetItem(c *gin.Context) {
	ctx := c.Request.Context()
	itemID := c.Param("item_id")

	if itemID == "" {
		c.JSON(400, gin.H{"error": "item id required"})
		return
	}
	log := logrus.WithField("item_id", itemID)

	item, err := svc.db.GetItem(ctx, itemID)
	if err != nil {
		log.WithError(err).Error("get item error")
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"item": item})
}

func (svc *Service) UpdateItem(c *gin.Context) {
	ctx := c.Request.Context()
	itemID := c.Param("item_id")

	if itemID == "" {
		c.JSON(400, gin.H{"error": "item id required"})
		return
	}
	log := logrus.WithField("item_id", itemID)

	req := new(struct {
		Read    *bool `json:"read,omitempty"`
		Starred *bool `json:"starred,omitempty"`
		Liked   *bool `json:"liked,omitempty"`
	})

	if err := c.ShouldBindJSON(&req); err != nil {
		log.WithError(err).Warn("invalid request")
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := svc.db.UpdateItem(ctx, itemID, req.Read, req.Starred, req.Liked); err != nil {
		log.WithError(err).Error("update item error")
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true})
}

// authMiddleware 是一个Gin中间件，用于验证请求中的JWT令牌
func (svc *Service) authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !authConfig.Enabled {
			// 如果认证未启用，直接放行所有请求
			c.Next()
			return
		}

		// 从请求头中获取令牌
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"error": "authorization required"})
			c.Abort()
			return
		}

		// 令牌格式应为 "Bearer <token>"
		const prefix = "Bearer "
		if len(authHeader) <= len(prefix) || authHeader[:len(prefix)] != prefix {
			c.JSON(401, gin.H{"error": "invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := authHeader[len(prefix):]

		// 验证令牌
		if !validateToken(tokenString) {
			c.JSON(401, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func (svc *Service) Login(c *gin.Context) {
	// 如果认证未启用，直接返回成功
	if !authConfig.Enabled {
		c.JSON(200, gin.H{"token": "", "auth_required": false})
		return
	}

	req := new(struct {
		Password string `json:"password"`
	})
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	// 验证密码
	if !validatePassword(req.Password) {
		c.JSON(401, gin.H{"error": "invalid password"})
		return
	}

	// 生成JWT令牌
	token, err := generateToken()
	if err != nil {
		logrus.WithError(err).Error("Failed to generate token")
		c.JSON(500, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(200, gin.H{"token": token, "auth_required": true})
}

// AuthStatus 返回当前的认证状态
func (svc *Service) AuthStatus(c *gin.Context) {
	c.JSON(200, gin.H{"auth_required": authConfig.Enabled})
}
