package main

import (
	"context"
	"crypto/md5"
	"fmt"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"github.com/robfig/cron/v3"
	"github.com/sirupsen/logrus"
)

const PendingSize = 5

type Service struct {
	db DB

	cron  *cron.Cron
	crons map[string]cron.EntryID

	tasks chan string // feed ids
}

type DB interface {
	SaveFeed(ctx context.Context, feed *Feed) (id string, err error)
	GetFeed(ctx context.Context, feedID string) (*Feed, error)
	UpdateFeed(ctx context.Context, feed *Feed) error
	FindAllFeeds(ctx context.Context, tags []string) ([]*ListFeedResult, error)
	AddItem(ctx context.Context, items ...*Item) error
	FindItems(ctx context.Context, unreadOnly bool, feedIDs ...string) ([]*Item, error)
	MarkItemAsRead(ctx context.Context, itemID string, read bool) error
}

func Run(addr string) error {
	svc := new(Service)
	svc.cron = cron.New(cron.WithSeconds())
	svc.crons = make(map[string]cron.EntryID)
	svc.tasks = make(chan string, PendingSize)

	// init database
	db, err := NewSQLiteDB("nexa.db")
	if err != nil {
		panic(err)
	}

	svc.db = db

	// init router
	r := gin.Default()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/feeds", svc.ListAllFeeds)
	r.POST("/feed", svc.AddFeed)
	r.GET("/feed/:feed_id", svc.ListItems)
	r.POST("/item/:item_id/read", svc.MarkItemAsRead)

	go svc.subscribe()

	return r.Run(addr)
}

func (svc *Service) subscribe() {
	ctx := context.Background()
	feeds, err := svc.db.FindAllFeeds(ctx, nil)
	if err != nil {
		logrus.WithError(err).Fatal("failed to get feed list from db")
	}

	for _, feed := range feeds {
		if feed.Suspended {
			continue
		}
		svc.subscribeNow(feed.Feed)
	}
	svc.cron.Start()

	tokens := make(chan struct{}, 8)
	for feedID := range svc.tasks {
		tokens <- struct{}{}
		go func() {
			defer func() { <-tokens }()
			feed, err := svc.db.GetFeed(ctx, feedID)
			if err != nil {
				logrus.WithError(err).Error("get feed error: %s", feedID)
				return
			}
			if err := svc.fetch(feed); err != nil {
				logrus.WithError(err).Error("fetch feed error: %s", feed.Link)
				return
			}
		}()
	}
}

func (svc *Service) subscribeNow(feed *Feed) {
	svc.tasks <- feed.ID
	entryID, _ := svc.cron.AddFunc(feed.Cron, func() { svc.tasks <- feed.ID })
	svc.crons[feed.ID] = entryID
}

func (svc *Service) fetch(feed *Feed) error {
	ctx := context.Background()
	logrus.Infof("fetching %s ...\n", feed.Link)
	f, err := FetchFeed(ctx, feed)
	if err != nil {
		return errors.Wrap(err, "fetch feed error")
	}
	feed.Title = f.Title

	items := make([]*Item, 0, len(f.Items))
	for _, raw := range f.Items {
		item := &Item{
			ID:          uuid.New().String(),
			FeedID:      feed.ID,
			Title:       raw.Title,
			Content:     raw.Content,
			Description: raw.Description,
			Link:        raw.Link,
			GUID:        raw.GUID,
			PubDate:     raw.PublishedParsed,
		}
		if raw.Description == "" {
			item.Description = generateSummary(raw.Content)
		}
		if item.GUID == "" {
			item.GUID = fmt.Sprintf("%x", md5.Sum([]byte(raw.Title+raw.Link)))
		}
		if raw.Image != nil {
			item.Image = raw.Image.URL
		}
		items = append(items, item)
	}
	if err := svc.db.AddItem(ctx, items...); err != nil {
		return errors.Wrap(err, "save items error")
	}

	feed.LastBuildDate = f.UpdatedParsed
	if err := svc.db.UpdateFeed(ctx, feed); err != nil {
		return errors.Wrap(err, "update feed error")
	}

	return nil
}

func generateSummary(content string) string {
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
