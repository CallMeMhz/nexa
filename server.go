package main

import (
	"context"
	"fmt"

	"github.com/pkg/errors"
	"github.com/robfig/cron/v3"
	"github.com/sirupsen/logrus"
)

type Service struct {
	db DB

	cron  *cron.Cron
	crons map[string]cron.EntryID
}

func Start(addr string) {
	svc := new(Service)
	svc.cron = cron.New(cron.WithSeconds())
	svc.crons = make(map[string]cron.EntryID)

	db, err := NewSQLiteDB("data/nexa.db")
	if err != nil {
		logrus.WithError(err).Fatal("failed to open sqlite db")
	}
	svc.db = db

	svc.initCron()
	svc.listen(addr)
}

func (svc *Service) initCron() {
	ctx := context.Background()
	feeds, err := svc.db.FilterFeeds(ctx, nil)
	if err != nil {
		logrus.WithError(err).Fatal("failed to get feed list from db")
	}

	for _, feed := range feeds {
		if feed.Suspended {
			continue
		}

		go svc.fetch(ctx, feed.Feed) // fetch on start
		svc.subscribe(feed.Feed)
	}
	svc.cron.Start()
}

func (svc *Service) subscribe(feed *Feed) {
	entryID, _ := svc.cron.AddFunc(feed.Cron, func() { svc.fetch(context.Background(), feed) })
	svc.crons[feed.Link] = entryID
}

func (svc *Service) unsubscribe(feedID string) {
	svc.cron.Remove(svc.crons[feedID])
	delete(svc.crons, feedID)
}

func (svc *Service) fetch(ctx context.Context, feed *Feed) error {
	logrus.Infof("fetch %s", feed.Link)
	f, err := FetchFeed(ctx, feed)
	if err != nil {
		return errors.Wrap(err, "fetch feed error")
	}
	feed.Title = f.Title

	items := make([]*Item, 0, len(f.Items))
	for _, raw := range f.Items {
		id := Hash(fmt.Sprintf("%s:%s", raw.Link, raw.Published))
		item := &Item{
			ID:          id,
			FeedID:      feed.ID,
			Title:       raw.Title,
			Content:     raw.Content,
			Description: raw.Description,
			Link:        raw.Link,
			GUID:        raw.GUID,
			PubDate:     raw.PublishedParsed,
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
	if err := svc.db.SaveFeed(ctx, feed); err != nil {
		return errors.Wrap(err, "update feed error")
	}

	return nil
}
