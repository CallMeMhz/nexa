package main

import (
	"context"
	"time"

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
	return &SQLiteDB{db: db}, nil
}

func (s *SQLiteDB) SaveFeed(ctx context.Context, feed *Feed) error {
	return s.db.WithContext(ctx).Save(feed).Error
}

func (s *SQLiteDB) GetFeed(ctx context.Context, feedID string) (*Feed, error) {
	feed := new(Feed)
	err := s.db.WithContext(ctx).First(feed, "id = ?", feedID).Error
	return feed, err
}

// 这里没有连 items 一起删
func (s *SQLiteDB) DeleteFeed(ctx context.Context, feedID string) error {
	return s.db.WithContext(ctx).Delete(&Feed{}, "id = ?", feedID).Error
}

func (s *SQLiteDB) FilterFeeds(ctx context.Context, tags []string) ([]*ListFeedResult, error) {
	feeds := []*ListFeedResult{}
	query := s.db.WithContext(ctx)
	if len(tags) > 0 {
		query = query.Where("tags in ?", tags)
	}
	query.Table("feeds").
		Select("feeds.*, COUNT(CASE WHEN items.read = 0 OR items.read IS NULL THEN 1 END) as unread_count").
		Joins("LEFT JOIN items ON items.feed_id = feeds.id").
		Group("feeds.id").
		Scan(&feeds)
	return feeds, nil
}

func (s *SQLiteDB) FilterItems(ctx context.Context, filter *ItemFilter) ([]*Item, error) {
	var items []*Item
	query := s.db.WithContext(ctx).Omit("content")
	if len(filter.FeedIDs) > 0 {
		query = query.Where("feed_id in ?", filter.FeedIDs)
	}
	if filter.Unread != nil {
		query = query.Where("read = ?", !*filter.Unread)
	}
	if filter.PubDate != nil {
		query = query.Where("pub_date >= ?", *filter.PubDate)
	}
	if filter.Starred != nil {
		query = query.Where("starred = ?", *filter.Starred)
	}
	if filter.Liked != nil {
		query = query.Where("liked = ?", *filter.Liked)
	}
	if filter.SortBy != nil {
		query = query.Order(*filter.SortBy)
	} else {
		query = query.Order("pub_date desc")
	}
	if err := query.Find(&items).Error; err != nil {
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

func (s *SQLiteDB) GetItem(ctx context.Context, itemID string) (*Item, error) {
	item := new(Item)
	err := s.db.WithContext(ctx).First(item, "id = ?", itemID).Error
	return item, err
}

func (s *SQLiteDB) UpdateItem(ctx context.Context, itemID string, read, starred, liked *bool) error {
	updates := make(map[string]any)
	if read != nil {
		updates["read"] = *read
	}
	if starred != nil {
		updates["starred"] = *starred
	}
	if liked != nil {
		updates["liked"] = *liked
	}
	return s.db.WithContext(ctx).Model(&Item{}).Where("id = ?", itemID).Updates(updates).Error
}

// SaveItem saves an item to the database
func (s *SQLiteDB) SaveItem(ctx context.Context, item *Item) error {
	return s.db.WithContext(ctx).Save(item).Error
}
