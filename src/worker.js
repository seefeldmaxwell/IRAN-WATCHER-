// ============================================================================
// IRAN WATCHER - Cloudflare Workers Application
// Monitors Iran-US conflict news from official & unofficial channels
// Uses Workers AI (via AI Gateway) for intelligent summarization & chat
// ============================================================================

import { getHTML } from './ui.js';
import { fetchAllNews } from './sources.js';
import { generateSummary, handleChatMessage } from './ai.js';

// Nitter/alt-frontend instances for proxying X timelines
const NITTER_INSTANCES = [
  'https://xcancel.com',
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.woodland.cafe',
  'https://nitter.1d4.us',
  'https://nitter.lucabased.xyz',
];

export default {
  // ---- HTTP Request Handler ----
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/news') {
      return handleNewsAPI(env);
    }

    if (url.pathname === '/api/refresh') {
      return handleRefresh(env);
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    // X timeline API — returns JSON tweet data from multiple sources
    if (url.pathname.startsWith('/api/x-timeline/')) {
      const handle = url.pathname.replace('/api/x-timeline/', '').replace(/[^a-zA-Z0-9_]/g, '');
      return handleXTimelineProxy(handle, env);
    }

    // X search API — returns JSON tweet data for search queries
    if (url.pathname.startsWith('/api/x-search/')) {
      const query = decodeURIComponent(url.pathname.replace('/api/x-search/', ''));
      return handleXSearchProxy(query, env);
    }

    // Live cams — resolve YouTube channel to current live video ID
    if (url.pathname === '/api/live-cams') {
      return handleLiveCams(env);
    }

    // Serve the main page
    return new Response(getHTML(), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  },

  // ---- Scheduled (Cron) Handler ----
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshNewsData(env));
  },
};

// Fetch cached news data and return as JSON
async function handleNewsAPI(env) {
  try {
    const cached = await env.NEWS_CACHE.get('latest_news', 'json');
    const summary = await env.NEWS_CACHE.get('ai_summary', 'text');
    const lastUpdated = await env.NEWS_CACHE.get('last_updated', 'text');

    if (cached) {
      return Response.json({
        success: true,
        summary: summary || 'Summary is being generated...',
        lastUpdated: lastUpdated || new Date().toISOString(),
        news: cached,
      });
    }

    // No cached data — fetch fresh (return news first, summary can be slow)
    const news = await fetchAllNews();
    const now = new Date().toISOString();

    // Cache news immediately so subsequent requests are fast
    const hasNews = (news.official?.length > 0 || news.unofficial?.length > 0);
    if (hasNews) {
      await env.NEWS_CACHE.put('latest_news', JSON.stringify(news), { expirationTtl: 1800 });
      await env.NEWS_CACHE.put('last_updated', now, { expirationTtl: 1800 });
    }

    // Generate AI summary (non-blocking for response if it takes too long)
    let newSummary = 'Summary is being generated...';
    try {
      newSummary = await generateSummary(env, news);
      if (newSummary && hasNews) {
        await env.NEWS_CACHE.put('ai_summary', newSummary, { expirationTtl: 1800 });
      }
    } catch { /* summary generation failed, still return news */ }

    return Response.json({
      success: true,
      summary: newSummary,
      lastUpdated: now,
      news,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Force-refresh news data
async function handleRefresh(env) {
  try {
    await refreshNewsData(env);
    return Response.json({ success: true, message: 'News refreshed' });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

// AI Chat endpoint
async function handleChat(request, env) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string' || message.length > 1000) {
      return Response.json({ success: false, error: 'Invalid message' }, { status: 400 });
    }

    // Get current news context for the AI
    const cached = await env.NEWS_CACHE.get('latest_news', 'json');
    const summary = await env.NEWS_CACHE.get('ai_summary', 'text');

    const response = await handleChatMessage(env, message, history || [], cached, summary);

    return Response.json({ success: true, response });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Core refresh logic (used by both cron and manual refresh)
async function refreshNewsData(env) {
  const news = await fetchAllNews();
  const summary = await generateSummary(env, news);
  const now = new Date().toISOString();

  await Promise.all([
    env.NEWS_CACHE.put('latest_news', JSON.stringify(news), { expirationTtl: 1800 }),
    env.NEWS_CACHE.put('ai_summary', summary, { expirationTtl: 1800 }),
    env.NEWS_CACHE.put('last_updated', now, { expirationTtl: 1800 }),
  ]);
}

// ========================================================================
// X FEED API — Returns JSON tweet data from multiple fallback sources
// ========================================================================

const RSSHUB_INSTANCES = [
  'https://rsshub.app',
  'https://rsshub.rssforever.com',
];

// RSS XML parser helpers
function extractXmlTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  const match = regex.exec(xml);
  return match ? match[1].trim() : '';
}

function cleanXmlText(str) {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRSSToTweets(xml, handle) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractXmlTag(itemXml, 'title');
    const description = extractXmlTag(itemXml, 'description');
    const link = extractXmlTag(itemXml, 'link');
    const pubDate = extractXmlTag(itemXml, 'pubDate');
    const creator = extractXmlTag(itemXml, 'dc:creator');

    const text = cleanXmlText(description || title);
    if (!text || text.includes('not yet whitelisted') || text.includes('RSS reader not yet')) continue;

    items.push({
      text,
      author: creator ? cleanXmlText(creator) : (handle || 'Unknown'),
      handle: handle || '',
      date: pubDate || new Date().toISOString(),
      url: link ? link.replace(/nitter\.[^/]+/g, 'x.com').replace(/xcancel\.com/g, 'x.com') : `https://x.com/${handle}`,
    });
  }
  return items;
}

// Fetch tweets for a specific handle using multiple fallback sources
async function fetchTweetsForHandle(handle) {
  // METHOD 1: RSSHub Twitter user feed
  for (const instance of RSSHUB_INSTANCES) {
    try {
      const res = await fetch(`${instance}/twitter/user/${handle}`, {
        headers: { 'User-Agent': 'IranWatcher/2.0' },
        cf: { cacheTtl: 120 },
      });
      if (res.ok) {
        const xml = await res.text();
        const tweets = parseRSSToTweets(xml, handle);
        if (tweets.length > 0) return tweets.slice(0, 25);
      }
    } catch { /* try next */ }
  }

  // METHOD 2: Nitter RSS feeds
  for (const instance of NITTER_INSTANCES) {
    try {
      const res = await fetch(`${instance}/${handle}/rss`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IranWatcher/2.0)' },
        cf: { cacheTtl: 120 },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      if (xml.includes('not yet whitelisted') || xml.includes('RSS reader not yet')) continue;
      const tweets = parseRSSToTweets(xml, handle);
      if (tweets.length > 0) return tweets.slice(0, 25);
    } catch { continue; }
  }

  // METHOD 3: Twitter Syndication API — parse embedded tweet HTML
  try {
    const res = await fetch(`https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://x.com/',
      },
      cf: { cacheTtl: 120 },
    });
    if (res.ok) {
      const html = await res.text();
      if (html.length > 500 && !html.includes('not yet whitelisted')) {
        // Extract tweet text from syndication HTML
        const tweets = [];
        const tweetBlockRegex = /<div[^>]*data-tweet-id="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
        let m;
        while ((m = tweetBlockRegex.exec(html)) !== null) {
          const tweetId = m[1];
          const block = m[2];
          const textMatch = block.match(/<p[^>]*class="[^"]*tweet-text[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
                         || block.match(/<div[^>]*class="[^"]*Tweet-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          if (textMatch) {
            tweets.push({
              text: cleanXmlText(textMatch[1]),
              author: handle,
              handle,
              date: new Date().toISOString(),
              url: tweetId ? `https://x.com/${handle}/status/${tweetId}` : `https://x.com/${handle}`,
            });
          }
        }
        if (tweets.length > 0) return tweets.slice(0, 25);
      }
    }
  } catch { /* fall through */ }

  // METHOD 4: FxTwitter API
  try {
    const res = await fetch(`https://api.fxtwitter.com/${handle}/`, {
      headers: { 'User-Agent': 'IranWatcher/2.0' },
      cf: { cacheTtl: 120 },
    });
    if (res.ok) {
      const data = await res.json();
      const rawTweets = data.tweets || data.timeline?.entries || [];
      if (rawTweets.length > 0) {
        return rawTweets.slice(0, 25).map(t => ({
          text: t.text || '',
          author: t.author?.name || handle,
          handle,
          date: t.created_at || new Date().toISOString(),
          url: t.url || `https://x.com/${handle}`,
          media: t.media?.photos?.[0]?.url || null,
        }));
      }
    }
  } catch { /* final fallback */ }

  return [];
}

// Fetch tweets matching a search query
async function fetchTweetsForSearch(query) {
  const encodedQuery = encodeURIComponent(query);

  // METHOD 1: RSSHub Twitter search
  for (const instance of RSSHUB_INSTANCES) {
    try {
      const res = await fetch(`${instance}/twitter/search/${encodedQuery}`, {
        headers: { 'User-Agent': 'IranWatcher/2.0' },
        cf: { cacheTtl: 120 },
      });
      if (res.ok) {
        const xml = await res.text();
        const tweets = parseRSSToTweets(xml, '');
        if (tweets.length > 0) return tweets.slice(0, 20);
      }
    } catch { /* try next */ }
  }

  // METHOD 2: Nitter search RSS
  for (const instance of NITTER_INSTANCES) {
    try {
      const res = await fetch(`${instance}/search/rss?f=tweets&q=${encodedQuery}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IranWatcher/2.0)' },
        cf: { cacheTtl: 120 },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      if (xml.includes('not yet whitelisted') || xml.includes('RSS reader not yet')) continue;
      const tweets = parseRSSToTweets(xml, '');
      if (tweets.length > 0) return tweets.slice(0, 20);
    } catch { continue; }
  }

  return [];
}

async function handleXTimelineProxy(handle, env) {
  if (!handle || !/^[a-zA-Z0-9_]{1,30}$/.test(handle)) {
    return Response.json({ success: false, error: 'Invalid handle' }, { status: 400 });
  }

  const cacheKey = `x_feed_v3_${handle}`;
  const cached = await env.NEWS_CACHE.get(cacheKey, 'json');
  if (cached && cached.length > 0) {
    return Response.json({ success: true, tweets: cached, source: 'cache' }, {
      headers: { 'Cache-Control': 'public, max-age=120' },
    });
  }

  const tweets = await fetchTweetsForHandle(handle);

  if (tweets.length > 0) {
    await env.NEWS_CACHE.put(cacheKey, JSON.stringify(tweets), { expirationTtl: 180 });
  }

  return Response.json({ success: true, tweets }, {
    headers: { 'Cache-Control': 'public, max-age=120' },
  });
}

async function handleXSearchProxy(query, env) {
  if (!query || query.length > 200) {
    return Response.json({ success: false, error: 'Invalid query' }, { status: 400 });
  }

  const safeQuery = query.replace(/[<>"']/g, '');
  const cacheKey = `x_search_v3_${encodeURIComponent(safeQuery)}`;
  const cached = await env.NEWS_CACHE.get(cacheKey, 'json');
  if (cached && cached.length > 0) {
    return Response.json({ success: true, tweets: cached, source: 'cache' }, {
      headers: { 'Cache-Control': 'public, max-age=120' },
    });
  }

  const tweets = await fetchTweetsForSearch(safeQuery);

  if (tweets.length > 0) {
    await env.NEWS_CACHE.put(cacheKey, JSON.stringify(tweets), { expirationTtl: 180 });
  }

  return Response.json({ success: true, tweets }, {
    headers: { 'Cache-Control': 'public, max-age=120' },
  });
}

// ========================================================================
// LIVE CAMS — Resolve YouTube channels to current live video IDs
// ========================================================================

const YT_CHANNELS = [
  // NEWS
  { id: 'aljazeera', channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', label: 'Al Jazeera English' },
  { id: 'i24', channelId: 'UCvHDpsWKADrDia0c99X37vg', label: 'i24NEWS English' },
  { id: 'france24', channelId: 'UCQfwfsi5VrQ8yKZ-UWmAEFg', label: 'France 24 English' },
  { id: 'sky', channelId: 'UCoMdktPbSTixAyNGwb-UYkQ', label: 'Sky News' },
  { id: 'dw', channelId: 'UCknLrEdhRCp1aegoMqRhGGQ', label: 'DW News' },
  // WEBCAM CHANNELS
  { id: 'webcamtaxi', channelId: 'UC1tBnbs03VJ34oLD8cmJSVw', label: 'WebcamTaxi' },
  { id: 'earthcam', channelId: 'UC6qrG3W8SMK0jior2olka3g', label: 'EarthCam' },
  // Handle-based (resolved via @handle/live)
  { id: 'earthtv', handle: 'earthTV', label: 'earthTV' },
];

async function resolveYTLiveVideoId(channel) {
  const urls = [];
  if (channel.channelId) {
    urls.push(`https://www.youtube.com/channel/${channel.channelId}/live`);
  }
  if (channel.handle) {
    urls.push(`https://www.youtube.com/@${channel.handle}/live`);
  }

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        cf: { cacheTtl: 300 },
      });

      if (!response.ok) continue;
      const html = await response.text();

      // Check if this is actually a live stream page
      const isLive = html.includes('"isLive":true') || html.includes('"liveBroadcastDetails"');

      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && isLive) return match[1];

      const match2 = html.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (match2 && isLive) return match2[1];

      // Even without isLive flag, return first videoId as best guess
      if (match) return match[1];
    } catch { continue; }
  }
  return null;
}

async function handleLiveCams(env) {
  const cached = await env.NEWS_CACHE.get('live_cams_v2', 'json');
  if (cached) {
    return Response.json({ success: true, cams: cached });
  }

  const results = await Promise.allSettled(
    YT_CHANNELS.map(async (ch) => {
      const videoId = await resolveYTLiveVideoId(ch);
      return { ...ch, videoId };
    })
  );

  const cams = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  await env.NEWS_CACHE.put('live_cams_v2', JSON.stringify(cams), { expirationTtl: 300 });
  return Response.json({ success: true, cams });
}
