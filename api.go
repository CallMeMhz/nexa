package main

import (
	"net/url"

	"github.com/gin-gonic/gin"
	"github.com/robfig/cron"
	"github.com/sirupsen/logrus"
)

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

	id, err := svc.db.SaveFeed(ctx, feed)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	feed.ID = id

	svc.fetch(feed)

	c.JSON(200, gin.H{"feed": feed})
}

func (svc *Service) ListAllFeeds(c *gin.Context) {
	ctx := c.Request.Context()

	tags := c.QueryArray("tags")
	feeds, err := svc.db.FindAllFeeds(ctx, tags)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"feeds": feeds})
}

func (svc *Service) ListItems(c *gin.Context) {
	ctx := c.Request.Context()

	var feedIDs []string
	feedID := c.Param("feed_id")
	if feedID != "" && feedID != "all" && feedID != "unread" {
		feedIDs = append(feedIDs, feedID)
	}

	items, err := svc.db.FindItems(ctx, feedID == "unread", feedIDs...)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"items": items})
}

func (svc *Service) MarkItemAsRead(c *gin.Context) {
	ctx := c.Request.Context()
	itemID := c.Param("item_id")

	if itemID == "" {
		c.JSON(400, gin.H{"error": "item id required"})
		return
	}
	log := logrus.WithField("item_id", itemID)

	// 可选：接收请求体中的read状态，默认为true
	req := new(struct {
		Read bool `json:"read,omitempty"`
	})

	if err := c.ShouldBindJSON(&req); err != nil {
		log.WithError(err).Warn("invalid request")
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := svc.db.MarkItemAsRead(ctx, itemID, req.Read); err != nil {
		log.WithError(err).Error("mark item as read error")
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true})
}
