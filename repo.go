package main

import (
	"context"
	"time"
)

type ItemFilter struct {
	FeedIDs []string
	Tags    []string
	PubDate *time.Time
	Unread  *bool
	Starred *bool
	Liked   *bool
	SortBy  *string
}

type DB interface {
	GetFeed(ctx context.Context, feedID string) (*Feed, error)
	FilterFeeds(ctx context.Context, tags []string) ([]*ListFeedResult, error)
	SaveFeed(ctx context.Context, feed *Feed) error
	DeleteFeed(ctx context.Context, feedID string) error

	AddItem(ctx context.Context, items ...*Item) error
	FilterItems(ctx context.Context, filter *ItemFilter) ([]*Item, error)
	GetItem(ctx context.Context, itemID string) (*Item, error)
	UpdateItem(ctx context.Context, itemID string, read, star, like *bool) error
	SaveItem(ctx context.Context, item *Item) error
}
