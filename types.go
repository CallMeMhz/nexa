package main

import (
	"time"
)

type Feed struct {
	ID string `gorm:"primaryKey" json:"id"`

	Title         string `yaml:"title" json:"title"`
	Desc          string `yaml:"desc" json:"desc"`
	Link          string `yaml:"link" json:"link"`
	Tags          string `yaml:"tags" json:"tags"`
	LastBuildDate *time.Time

	Cron      string `yaml:"cron" json:"cron"`
	Suspended bool   `yaml:"suspended" json:"suspended"`

	// Items []*Item `gorm:"foreignKey:FeedID" json:"items"`
}

func (feed *Feed) TableName() string { return "feeds" }

type ListFeedResult struct {
	*Feed
	UnreadCount int `json:"unread_count"`
}

type Item struct {
	ID        string `gorm:"primaryKey" json:"id"`
	FeedID    string `json:"feed_id"`
	CreatedAt time.Time

	Title       string     `json:"title"`
	Content     string     `json:"content"`
	Description string     `json:"description"`
	Image       string     `json:"image"` // TODO: archive image to local disk
	Link        string     `json:"link"`
	GUID        string     `json:"guid"`
	PubDate     *time.Time `json:"pub_date,omitempty"`

	// fields below should store within user info,
	// but for now, there is only one user in the system.
	Read    bool   `json:"read"`
	Starred bool   `json:"starred"`
	Liked   bool   `json:"liked"`
	Tags    string `json:"tags"`

	// Feed *Feed `gorm:"references:ID" json:"feed"`
}

func (item *Item) TableName() string { return "items" }
