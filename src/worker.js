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

    // X timeline proxy — serves real tweets inline via iframe
    if (url.pathname.startsWith('/api/x-timeline/')) {
      const handle = url.pathname.replace('/api/x-timeline/', '').replace(/[^a-zA-Z0-9_]/g, '');
      return handleXTimelineProxy(handle, env);
    }

    // X search proxy — serves real search results inline via iframe
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

    // No cached data — fetch fresh
    const news = await fetchAllNews();
    const newSummary = await generateSummary(env, news);
    const now = new Date().toISOString();

    await Promise.all([
      env.NEWS_CACHE.put('latest_news', JSON.stringify(news), { expirationTtl: 1800 }),
      env.NEWS_CACHE.put('ai_summary', newSummary, { expirationTtl: 1800 }),
      env.NEWS_CACHE.put('last_updated', now, { expirationTtl: 1800 }),
    ]);

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
// X TIMELINE PROXY — Twitter Syndication API (primary) + Nitter (fallback)
// ========================================================================

const X_DARK_THEME = `
<style>
  * { box-sizing: border-box; }
  body {
    background: #080c14 !important;
    color: #d1ddf0 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0; padding: 0;
    -webkit-font-smoothing: antialiased;
  }
  a { color: #1d9bf0 !important; text-decoration: none !important; }
  /* Syndication API styles */
  .timeline-Widget, .timeline-Tweet { background: transparent !important; border-color: #1a2744 !important; }
  .timeline-Tweet-text { color: #d1ddf0 !important; font-size: 13px !important; line-height: 1.5 !important; }
  .timeline-Tweet-author { color: #d1ddf0 !important; }
  .timeline-Tweet-metadata { color: #4a5f82 !important; }
  .TweetAuthor-name { color: #d1ddf0 !important; font-weight: 600 !important; }
  .TweetAuthor-screenName { color: #4a5f82 !important; }
  .timeline-Header, .timeline-Footer, .timeline-LoadMore { display: none !important; }
  /* Nitter styles */
  nav, .navbar, header, .mobile-nav, footer, #search, .search-bar,
  .timeline-header, .profile-card-extra, .profile-tabs, .show-more,
  .nitter-logo, #m-nav, .inner-nav { display: none !important; }
  .timeline-item, .tweet-body, .timeline .tweet {
    border-bottom: 1px solid #1a2744 !important; padding: 12px 14px !important; background: transparent !important;
  }
  .timeline-item:hover, .tweet:hover { background: rgba(19,29,53,0.5) !important; }
  .tweet-content, .tweet-body .tweet-text { color: #d1ddf0 !important; font-size: 13px !important; line-height: 1.5 !important; }
  .fullname { color: #d1ddf0 !important; font-weight: 600 !important; }
  .username { color: #4a5f82 !important; }
  .tweet-date, .tweet-published, .tweet-stats { color: #4a5f82 !important; font-size: 11px !important; }
  .attachments img, .still-image img { border-radius: 8px !important; max-width: 100% !important; margin-top: 8px !important; }
  .profile-card { padding: 14px !important; border-bottom: 1px solid #1a2744 !important; }
  .profile-card-info .profile-card-fullname { color: #d1ddf0 !important; font-size: 15px !important; font-weight: 700 !important; }
  .profile-card-info .profile-card-username { color: #4a5f82 !important; }
  .profile-card-avatar img { border-radius: 50% !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #080c14; }
  ::-webkit-scrollbar-thumb { background: #1a2744; }
</style>
`;

async function handleXTimelineProxy(handle, env) {
  if (!handle || !/^[a-zA-Z0-9_]{1,30}$/.test(handle)) {
    return new Response('Invalid handle', { status: 400 });
  }

  const cacheKey = `x_timeline_v2_${handle}`;
  const cached = await env.NEWS_CACHE.get(cacheKey, 'text');
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=120' },
    });
  }

  // METHOD 1: Twitter Syndication API (official, no API key)
  try {
    const response = await fetch(`https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cf: { cacheTtl: 120 },
    });

    if (response.ok) {
      let html = await response.text();
      if (html.length > 500 && !html.includes('not yet whitelisted')) {
        html = html.replace('</head>', `${X_DARK_THEME}<base target="_blank"></head>`);
        await env.NEWS_CACHE.put(cacheKey, html, { expirationTtl: 120 });
        return new Response(html, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=120' },
        });
      }
    }
  } catch { /* fall through to Nitter */ }

  // METHOD 2: Nitter instances (fallback)
  for (const instance of NITTER_INSTANCES) {
    try {
      const response = await fetch(`${instance}/${handle}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        cf: { cacheTtl: 120 },
      });

      if (!response.ok) continue;
      let html = await response.text();
      if ((!html.includes('timeline') && !html.includes('tweet')) ||
          html.includes('not yet whitelisted') || html.includes('RSS reader not yet')) continue;

      html = html.replace('</head>', `${X_DARK_THEME}<base target="_blank"></head>`);
      const instanceHost = new URL(instance).host;
      html = html.replace(new RegExp(`https?://${instanceHost.replace('.', '\\.')}`, 'g'), 'https://x.com');
      html = html.replace(new RegExp(`href="/`, 'g'), 'href="https://x.com/');
      await env.NEWS_CACHE.put(cacheKey, html, { expirationTtl: 120 });
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=120' },
      });
    } catch { continue; }
  }

  // METHOD 3: Build timeline from FxTwitter API data
  try {
    const response = await fetch(`https://api.fxtwitter.com/${handle}/`, {
      headers: { 'User-Agent': 'IranWatcher/2.0' },
      cf: { cacheTtl: 120 },
    });
    if (response.ok) {
      const data = await response.json();
      const tweets = data.tweets || data.timeline?.entries || [];
      if (tweets.length > 0) {
        const tweetHTML = tweets.slice(0, 20).map(t => `
          <div style="padding:12px 14px;border-bottom:1px solid #1a2744;">
            <div style="display:flex;gap:8px;margin-bottom:6px;">
              <strong style="color:#d1ddf0;font-size:13px;">@${handle}</strong>
              <span style="color:#4a5f82;font-size:11px;">${t.created_at ? new Date(t.created_at).toLocaleString() : ''}</span>
            </div>
            <div style="color:#d1ddf0;font-size:13px;line-height:1.5;">${(t.text || '').replace(/</g,'&lt;')}</div>
            ${t.media?.photos?.[0] ? `<img src="${t.media.photos[0].url}" style="max-width:100%;border-radius:8px;margin-top:8px;">` : ''}
          </div>`).join('');

        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
          ${X_DARK_THEME}<base target="_blank"></head>
          <body>${tweetHTML}</body></html>`;
        await env.NEWS_CACHE.put(cacheKey, html, { expirationTtl: 120 });
        return new Response(html, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=120' },
        });
      }
    }
  } catch { /* final fallback */ }

  const fallback = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${X_DARK_THEME}</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px;">
  <div>
    <div style="font-size:40px;margin-bottom:16px;opacity:0.15;">&#120143;</div>
    <div style="font-size:14px;color:#7e93b5;margin-bottom:12px;">@${handle} — Connecting...</div>
    <div style="font-size:12px;color:#4a5f82;margin-bottom:20px;">Syndication bridge initializing</div>
    <a href="https://x.com/${handle}" target="_blank" style="display:inline-block;padding:12px 24px;background:rgba(29,155,240,0.1);border:1px solid rgba(29,155,240,0.3);color:#1d9bf0;text-decoration:none;font-size:13px;font-weight:600;">
      View @${handle} on X &rarr;
    </a>
  </div>
</body></html>`;

  return new Response(fallback, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

async function handleXSearchProxy(query, env) {
  if (!query || query.length > 200) {
    return new Response('Invalid query', { status: 400 });
  }

  const safeQuery = query.replace(/[<>"']/g, '');
  const cacheKey = `x_search_v2_${encodeURIComponent(safeQuery)}`;
  const cached = await env.NEWS_CACHE.get(cacheKey, 'text');
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=120' },
    });
  }

  const encodedQuery = encodeURIComponent(safeQuery);

  // Try Nitter search (syndication API has no search endpoint)
  for (const instance of NITTER_INSTANCES) {
    try {
      const response = await fetch(`${instance}/search?f=tweets&q=${encodedQuery}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        cf: { cacheTtl: 120 },
      });
      if (!response.ok) continue;
      let html = await response.text();
      if ((!html.includes('timeline') && !html.includes('tweet')) ||
          html.includes('not yet whitelisted') || html.includes('RSS reader not yet')) continue;

      html = html.replace('</head>', `${X_DARK_THEME}<base target="_blank"></head>`);
      const instanceHost = new URL(instance).host;
      html = html.replace(new RegExp(`https?://${instanceHost.replace('.', '\\.')}`, 'g'), 'https://x.com');
      html = html.replace(new RegExp(`href="/`, 'g'), 'href="https://x.com/');
      await env.NEWS_CACHE.put(cacheKey, html, { expirationTtl: 120 });
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=120' },
      });
    } catch { continue; }
  }

  const fallback = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${X_DARK_THEME}</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px;">
  <div>
    <div style="font-size:40px;margin-bottom:16px;opacity:0.15;">&#120143;</div>
    <div style="font-size:14px;color:#7e93b5;margin-bottom:12px;">Search: "${safeQuery}"</div>
    <div style="font-size:12px;color:#4a5f82;margin-bottom:20px;">Bridge connecting...</div>
    <a href="https://x.com/search?q=${encodedQuery}&f=live" target="_blank" style="display:inline-block;padding:12px 24px;background:rgba(29,155,240,0.1);border:1px solid rgba(29,155,240,0.3);color:#1d9bf0;text-decoration:none;font-size:13px;font-weight:600;">
      Search on X &rarr;
    </a>
  </div>
</body></html>`;

  return new Response(fallback, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
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
