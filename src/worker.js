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
// X TIMELINE PROXY — Fetches real X/Twitter timelines via Nitter proxies
// Serves HTML that can be iframed directly in the dashboard
// ========================================================================

// Dark theme CSS injected into proxied pages
const X_PROXY_STYLES = `
<style>
  * { box-sizing: border-box; }
  body {
    background: #080c14 !important;
    color: #d1ddf0 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0; padding: 0;
    -webkit-font-smoothing: antialiased;
  }
  a { color: #1d9bf0 !important; }
  /* Hide Nitter navigation/header chrome */
  nav, .navbar, header, .mobile-nav, footer, #search, .search-bar,
  .timeline-header, .profile-card-extra, .profile-tabs, .show-more,
  .nitter-logo, #m-nav, .inner-nav { display: none !important; }
  /* Style timeline items as clean cards */
  .timeline-item, .tweet-body, .timeline .tweet {
    border-bottom: 1px solid #1a2744 !important;
    padding: 12px 14px !important;
    background: transparent !important;
  }
  .timeline-item:hover, .tweet:hover {
    background: rgba(19,29,53,0.5) !important;
  }
  .tweet-content, .tweet-body .tweet-text, .timeline-item .tweet-content {
    color: #d1ddf0 !important;
    font-size: 13px !important;
    line-height: 1.5 !important;
  }
  .fullname, .tweet-name-row .fullname {
    color: #d1ddf0 !important;
    font-weight: 600 !important;
    font-size: 13px !important;
  }
  .username, .tweet-name-row .username {
    color: #4a5f82 !important;
    font-size: 12px !important;
  }
  .tweet-date, .tweet-published {
    color: #4a5f82 !important;
    font-size: 11px !important;
  }
  .tweet-stats, .tweet-stat { color: #4a5f82 !important; font-size: 11px !important; }
  .attachments img, .tweet-body img, .still-image img {
    border-radius: 8px !important;
    max-width: 100% !important;
    margin-top: 8px !important;
  }
  .quote { border: 1px solid #1a2744 !important; border-radius: 8px !important; padding: 10px !important; margin-top: 8px !important; }
  /* Retweet indicator */
  .retweet-header { color: #4a5f82 !important; font-size: 11px !important; padding: 4px 14px !important; }
  /* Profile section at top */
  .profile-card { padding: 14px !important; border-bottom: 1px solid #1a2744 !important; }
  .profile-card-info .profile-card-fullname { color: #d1ddf0 !important; font-size: 15px !important; font-weight: 700 !important; }
  .profile-card-info .profile-card-username { color: #4a5f82 !important; }
  .profile-card-info .profile-bio { color: #7e93b5 !important; font-size: 13px !important; }
  .profile-card-avatar img { border-radius: 50% !important; }
  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #080c14; }
  ::-webkit-scrollbar-thumb { background: #1a2744; }
</style>
`;

async function handleXTimelineProxy(handle, env) {
  if (!handle || !/^[a-zA-Z0-9_]{1,30}$/.test(handle)) {
    return new Response('Invalid handle', { status: 400 });
  }

  // Check cache first (2-minute TTL for near-real-time)
  const cacheKey = `x_timeline_${handle}`;
  const cached = await env.NEWS_CACHE.get(cacheKey, 'text');
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=120',
      },
    });
  }

  // Try each Nitter instance until one works
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

      // Validate we got actual timeline content (not an error page)
      if (!html.includes('timeline') && !html.includes('tweet')) continue;

      // Inject dark theme styles and fix links to open in parent
      html = html.replace('</head>', `${X_PROXY_STYLES}<base target="_blank"></head>`);

      // Rewrite internal links to point to x.com instead of nitter
      const instanceHost = new URL(instance).host;
      html = html.replace(new RegExp(`https?://${instanceHost.replace('.', '\\.')}`, 'g'), 'https://x.com');
      html = html.replace(new RegExp(`href="/`, 'g'), 'href="https://x.com/');

      // Cache for 2 minutes
      await env.NEWS_CACHE.put(cacheKey, html, { expirationTtl: 120 });

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=120',
        },
      });
    } catch {
      continue;
    }
  }

  // All instances failed — return a styled error page with direct link
  const fallback = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${X_PROXY_STYLES}</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px;">
  <div>
    <div style="font-size:40px;margin-bottom:16px;opacity:0.15;">&#120143;</div>
    <div style="font-size:14px;color:#7e93b5;margin-bottom:12px;">Unable to load @${handle} timeline</div>
    <div style="font-size:12px;color:#4a5f82;margin-bottom:20px;">RSS bridges are temporarily unavailable</div>
    <a href="https://x.com/${handle}" target="_blank" style="display:inline-block;padding:12px 24px;background:rgba(29,155,240,0.1);border:1px solid rgba(29,155,240,0.3);color:#1d9bf0;text-decoration:none;font-size:13px;font-weight:600;">
      View @${handle} on X &rarr;
    </a>
  </div>
</body></html>`;

  return new Response(fallback, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

async function handleXSearchProxy(query, env) {
  if (!query || query.length > 200) {
    return new Response('Invalid query', { status: 400 });
  }

  const safeQuery = query.replace(/[<>"']/g, '');
  const cacheKey = `x_search_${encodeURIComponent(safeQuery)}`;
  const cached = await env.NEWS_CACHE.get(cacheKey, 'text');
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=120',
      },
    });
  }

  const encodedQuery = encodeURIComponent(safeQuery);

  for (const instance of NITTER_INSTANCES) {
    try {
      const response = await fetch(`${instance}/search?f=tweets&q=${encodedQuery}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        cf: { cacheTtl: 120 },
      });

      if (!response.ok) continue;

      let html = await response.text();

      if (!html.includes('timeline') && !html.includes('tweet')) continue;

      html = html.replace('</head>', `${X_PROXY_STYLES}<base target="_blank"></head>`);

      const instanceHost = new URL(instance).host;
      html = html.replace(new RegExp(`https?://${instanceHost.replace('.', '\\.')}`, 'g'), 'https://x.com');
      html = html.replace(new RegExp(`href="/`, 'g'), 'href="https://x.com/');

      await env.NEWS_CACHE.put(cacheKey, html, { expirationTtl: 120 });

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=120',
        },
      });
    } catch {
      continue;
    }
  }

  const fallback = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${X_PROXY_STYLES}</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px;">
  <div>
    <div style="font-size:40px;margin-bottom:16px;opacity:0.15;">&#120143;</div>
    <div style="font-size:14px;color:#7e93b5;margin-bottom:12px;">Unable to load search results</div>
    <div style="font-size:12px;color:#4a5f82;margin-bottom:20px;">"${safeQuery}"</div>
    <a href="https://x.com/search?q=${encodedQuery}&f=live" target="_blank" style="display:inline-block;padding:12px 24px;background:rgba(29,155,240,0.1);border:1px solid rgba(29,155,240,0.3);color:#1d9bf0;text-decoration:none;font-size:13px;font-weight:600;">
      Search on X &rarr;
    </a>
  </div>
</body></html>`;

  return new Response(fallback, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
