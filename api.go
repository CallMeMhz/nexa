package main

import (
	"net/url"
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
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/feeds", svc.ListAllFeeds)
	r.GET("/feed/all", svc.ListAllItems)
	r.GET("/feed/:feed_id", svc.ListFeedItems)

	r.POST("/feed", svc.AddFeed)
	r.DELETE("/feed/:feed_id", svc.DeleteFeed)

	r.GET("/item/:item_id", svc.GetItem)
	r.GET("/item/:item_id/content", svc.GetItemContent)
	r.PATCH("/item/:item_id", svc.UpdateItem)

	r.Run(addr)
}

func (svc *Service) AddFeed(c *gin.Context) {
	ctx := c.Request.Context()

	req := new(struct {
		Url  string `json:"url"`
		Desc string `json:"desc"`
		Cron string `json:"cron"`
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

	feed := &Feed{
		Link: req.Url,
		Desc: req.Desc,
		Cron: req.Cron,
	}

	if err := svc.db.SaveFeed(ctx, feed); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	svc.subscribe(feed)
	if err := svc.fetch(ctx, feed); err != nil {
		logrus.WithField("feed_id", feed.ID).WithError(err).Error("fetch feed error")
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

	tags := c.QueryArray("tags")
	feeds, err := svc.db.FilterFeeds(ctx, tags)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"feeds": feeds})
}

func (svc *Service) ListAllItems(c *gin.Context) {
	ctx := c.Request.Context()

	feedsResult, err := svc.db.FilterFeeds(ctx, []string{})
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
	today := c.Query("today") == "true"
	starred := c.Query("starred") == "true"
	liked := c.Query("liked") == "true"

	refresh := c.Query("refresh") == "true"

	if refresh {
		for _, feed := range feeds {
			if err := svc.fetch(ctx, feed); err != nil {
				logrus.WithField("feed_id", feed.ID).WithError(err).Error("refresh feed error")
			}
		}
	}

	filter := &ItemFilter{
		FeedIDs: lo.Map(feeds, func(feed *Feed, _ int) string { return feed.ID }),
	}

	if unread := c.Query("unread") == "true"; unread {
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
	items, err := svc.db.FilterItems(ctx, filter)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"items": items})
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

func (svc *Service) GetItemContent(c *gin.Context) {
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

	// If the item already has content, return it
	if item.Content != "" {
		c.JSON(200, gin.H{"item": item})
		return
	}

	// Fetch the content from the original source
	if item.Link != "" {
		content, err := svc.fetchItemContent(ctx, item)
		if err != nil {
			log.WithError(err).Error("fetch content error")
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		// Update the item with the fetched content
		item.Content = content
		if err := svc.db.SaveItem(ctx, item); err != nil {
			log.WithError(err).Error("save item error")
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
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
