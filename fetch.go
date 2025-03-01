package main

import (
	"context"
	"fmt"
	"io"
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
		Timeout:   30 * time.Second,
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

// FetchItemContent fetches the content for a specific item from its original link
func (svc *Service) fetchItemContent(ctx context.Context, item *Item) (string, error) {
	if item.Link == "" {
		return "", fmt.Errorf("item has no link")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, item.Link, nil)
	if err != nil {
		return "", err
	}
	req.Header.Add("User-Agent", "nexa/1.0")
	req.Close = true

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", err
	} else if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("status code: %d", resp.StatusCode)
	}
	defer resp.Body.Close()

	// For simplicity, we'll just return the full HTML content
	// In a real application, you might want to extract the main content using a library like goquery
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}
