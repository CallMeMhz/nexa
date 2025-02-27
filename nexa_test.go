package main

import (
	"context"
	"testing"
)

func TestFetch(t *testing.T) {
	feeds := []Feed{
		{
			Name: "Distractify",
			Link: "https://www.distractify.com/rss",
			Tags: "entertainment,news",
		},
	}

	for _, feed := range feeds {
		ctx := context.Background()
		f, err := FetchFeed(ctx, feed)
		if err != nil {
			t.Fatal(err)
		}

		items := make([]Item, 0, len(f.Items))
		for _, fi := range f.Items {
			item := Item{
				Title:   fi.Title,
				Content: fi.Content,
				Link:    fi.Link,
				GUID:    fi.GUID,
				PubDate: fi.PublishedParsed,
			}
			item.Image = fi.Image.URL
			items = append(items, item)
		}

		for _, item := range items {
			t.Log(item.Title)
		}

		feed.LastBuildDate = f.UpdatedParsed
	}
}
