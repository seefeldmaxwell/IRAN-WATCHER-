# IRAN WATCHER

Real-time intelligence monitor for Iran-US conflict tracking, built entirely on Cloudflare.

## Architecture

- **Cloudflare Workers** — Serves the app and fetches news from RSS feeds
- **Workers AI (Llama 3.1 8B)** — Generates intelligence-style briefing summaries
- **Workers KV** — Caches aggregated news data (30-minute TTL)
- **Cron Triggers** — Auto-refreshes news every 15 minutes

## Features

- **AI Intelligence Briefing** — Top-of-page summary with threat assessment, key developments, and outlook (powered by Cloudflare Workers AI)
- **Official News Feed** — Aggregates Iran-related news from Reuters, BBC, Al Jazeera, AP, The Guardian, and Google News
- **X/Twitter Monitor** — Watches for conflict mentions on X via RSS bridges with search queries like "iran retaliation US", "IRGC attack", "houthi attack red sea"
- **Keyword Filtering** — 40+ keywords filter for Iran/US conflict relevance (IRGC, sanctions, nuclear, Strait of Hormuz, etc.)
- **Live Auto-Refresh** — Frontend polls every 5 minutes; backend cron refreshes every 15 minutes

## Deploy

```bash
npm install
npx wrangler deploy
```

## Local Development

```bash
npm install
npm run dev
```

## Configuration

All configuration is in `wrangler.toml`:

- **KV Namespace** — `NEWS_CACHE` binding for caching
- **AI Binding** — Workers AI for summarization
- **Cron** — `*/15 * * * *` (every 15 minutes)

## News Sources

### Official Channels
- Reuters (Middle East)
- BBC News (Middle East)
- Al Jazeera
- Associated Press
- The Guardian (Iran)
- Google News (Iran-specific searches)

### Unofficial Channels (X/Twitter)
Monitored search terms:
- "iran retaliation US"
- "iran military strike"
- "IRGC attack"
- "iran nuclear threat"
- "iran US conflict"
- "tehran washington tensions"
- "strait of hormuz threat"
- "iran proxy attack"
- "houthi attack red sea"
- "hezbollah iran"
