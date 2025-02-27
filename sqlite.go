package main

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SQLiteDB struct {
	db *gorm.DB
}

func NewSQLiteDB(dsn string) (*SQLiteDB, error) {
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&Feed{}, &Item{}); err != nil {
		return nil, err
	}
	return &SQLiteDB{db: db.Debug()}, nil
}

func (s *SQLiteDB) SaveFeed(ctx context.Context, feed *Feed) (string, error) {
	query := s.db.WithContext(ctx)
	feed.ID = uuid.New().String()
	if err := query.Save(feed).Error; err != nil {
		return "", err
	}
	return feed.ID, nil
}

func (s *SQLiteDB) GetFeed(ctx context.Context, feedID string) (*Feed, error) {
	feed := new(Feed)
	err := s.db.WithContext(ctx).First(feed, "id = ?", feedID).Error
	return feed, err
}

func (s *SQLiteDB) UpdateFeed(ctx context.Context, feed *Feed) error {
	query := s.db.WithContext(ctx)
	return query.Save(feed).Error
}

func (s *SQLiteDB) FindAllFeeds(ctx context.Context, tags []string) ([]*ListFeedResult, error) {
	feeds := []*ListFeedResult{}
	query := s.db.WithContext(ctx)
	if len(tags) > 0 {
		query = query.Where("tags in ?", tags)
	}
	query.Table("feeds").
		Select("feeds.*, COUNT(items.id) as unread_count").
		Joins("LEFT JOIN items ON items.feed_id = feeds.id").
		Where("items.read = ?", false).
		Group("feeds.id").
		Scan(&feeds)
	return feeds, nil
}

func (s *SQLiteDB) FindItems(ctx context.Context, unreadOnly bool, feedIDs ...string) ([]*Item, error) {
	var items []*Item
	query := s.db.WithContext(ctx)
	if len(feedIDs) > 0 {
		query = query.Where("feed_id in ?", feedIDs)
	}
	if unreadOnly {
		query = query.Where("read = ?", false)
	}
	if err := query.Order("pub_date desc").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (s *SQLiteDB) AddItem(ctx context.Context, items ...*Item) error {
	now := time.Now()
	for _, item := range items {
		item.CreatedAt = now
	}
	return s.db.Clauses(clause.OnConflict{
		DoNothing: true,
	}).CreateInBatches(items, 20).Error
}

func (s *SQLiteDB) MarkItemAsRead(ctx context.Context, itemID string, read bool) error {
	return s.db.WithContext(ctx).Model(&Item{}).Where("id = ?", itemID).Update("read", read).Error
}
