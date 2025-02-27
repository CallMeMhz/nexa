package main

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/mmcdole/gofeed"
)

var httpClient *http.Client

func init() {
	transport := &http.Transport{
		ForceAttemptHTTP2:   true,
		DisableKeepAlives:   true,
		MaxIdleConnsPerHost: 0,
	}

	httpClient = &http.Client{
		Transport: transport,
		Timeout:   1 * time.Minute,
	}
}

func FetchFeed(ctx context.Context, feed *Feed) (*gofeed.Feed, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, feed.Link, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("User-Agent", "nexa/1.0")
	req.Close = true

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	} else if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status code: %d", resp.StatusCode)
	}
	defer resp.Body.Close()

	return gofeed.NewParser().Parse(resp.Body)
}
