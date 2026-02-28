// ============================================================================
// IRAN WATCHER - Cloudflare Workers Application
// Monitors Iran-US conflict news from official & unofficial channels
// Uses Workers AI (via AI Gateway) for intelligent summarization
// ============================================================================

import { getHTML } from './ui.js';
import { fetchAllNews } from './sources.js';
import { generateSummary } from './ai.js';

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

    // Serve the main page
    return new Response(getHTML(), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
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
