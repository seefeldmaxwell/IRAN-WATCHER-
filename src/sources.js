// ============================================================================
// NEWS SOURCES - Fetches from official RSS feeds and X/Twitter monitors
// ============================================================================

// ---- Fetch with timeout helper (prevents hanging on dead sources) ----
function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// ---- Official News Sources (RSS Feeds) ----
const OFFICIAL_SOURCES = [
  {
    name: 'Reuters - Middle East',
    url: 'https://www.reutersagency.com/feed/?taxonomy=best-regions&post_type=best&best-regions=middle-east',
    category: 'official',
    icon: 'reuters',
  },
  {
    name: 'Al Jazeera - Middle East',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'official',
    icon: 'aljazeera',
  },
  {
    name: 'BBC News - Middle East',
    url: 'http://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
    category: 'official',
    icon: 'bbc',
  },
  {
    name: 'Associated Press - Middle East',
    url: 'https://feedx.net/rss/ap.xml',
    category: 'official',
    icon: 'ap',
  },
  {
    name: 'The Guardian - Iran',
    url: 'https://www.theguardian.com/world/iran/rss',
    category: 'official',
    icon: 'guardian',
  },
];

// ---- Keywords to filter Iran/US conflict related news ----
const IRAN_KEYWORDS = [
  'iran', 'iranian', 'tehran', 'khamenei', 'irgc', 'revolutionary guard',
  'persian gulf', 'strait of hormuz', 'hezbollah', 'houthi', 'proxy',
  'sanctions', 'nuclear', 'enrichment', 'uranium', 'centrifuge',
  'retaliation', 'retaliatory', 'strike', 'missile', 'drone',
  'middle east', 'iraq', 'syria', 'yemen', 'lebanon',
  'pentagon', 'centcom', 'us military', 'us forces',
  'ballistic', 'cruise missile', 'air defense',
  'escalation', 'de-escalation', 'ceasefire', 'negotiation',
  'jcpoa', 'nuclear deal', 'iaea', 'atomic energy',
  'oil tanker', 'shipping lane', 'red sea',
  'axis of resistance', 'quds force',
];

// ---- X/Twitter Search Terms for Unofficial Monitoring ----
const X_SEARCH_QUERIES = [
  'iran retaliation US',
  'iran military strike',
  'IRGC attack',
  'iran nuclear threat',
  'iran US conflict',
  'tehran washington tensions',
  'strait of hormuz threat',
  'iran proxy attack',
  'houthi attack red sea',
  'hezbollah iran',
];

// ---- Main: Fetch all news from all sources ----
export async function fetchAllNews() {
  const results = await Promise.allSettled([
    fetchOfficialNews(),
    fetchXMentions(),
    fetchGoogleNewsRSS(),
  ]);

  const official = results[0].status === 'fulfilled' ? results[0].value : [];
  const unofficial = results[1].status === 'fulfilled' ? results[1].value : [];
  const google = results[2].status === 'fulfilled' ? results[2].value : [];

  // Filter out any Nitter whitelist error items that leaked through
  const isClean = (item) => {
    const t = ((item.title || '') + (item.description || '')).toLowerCase();
    return !t.includes('whitelisted') && !t.includes('rss reader not yet');
  };

  return {
    official: [...official, ...google].filter(isClean).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50),
    unofficial: unofficial.filter(isClean).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50),
  };
}

// ---- Fetch Official RSS Feeds ----
async function fetchOfficialNews() {
  const results = await Promise.allSettled(
    OFFICIAL_SOURCES.map(source => fetchRSSFeed(source))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

// ---- Parse RSS Feed ----
async function fetchRSSFeed(source) {
  try {
    const response = await fetchWithTimeout(source.url, {
      headers: {
        'User-Agent': 'IranWatcher/1.0 (Cloudflare Worker)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      cf: { cacheTtl: 600 },
    }, 10000);

    if (!response.ok) return [];

    const text = await response.text();
    const items = parseRSSXML(text);

    return items
      .filter(item => isIranRelated(item.title + ' ' + item.description))
      .map(item => ({
        title: item.title,
        description: cleanHTML(item.description).slice(0, 300),
        link: item.link,
        date: item.pubDate || new Date().toISOString(),
        source: source.name,
        category: 'official',
        icon: source.icon,
      }));
  } catch {
    return [];
  }
}

// ---- Google News RSS for Iran-specific searches ----
async function fetchGoogleNewsRSS() {
  const queries = [
    'Iran+US+conflict',
    'Iran+retaliation',
    'Iran+military',
    'IRGC+news',
    'Iran+nuclear+program',
  ];

  const results = await Promise.allSettled(
    queries.map(async (query) => {
      try {
        const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
        const response = await fetchWithTimeout(url, {
          headers: { 'User-Agent': 'IranWatcher/1.0 (Cloudflare Worker)' },
          cf: { cacheTtl: 600 },
        }, 10000);

        if (!response.ok) return [];

        const text = await response.text();
        const items = parseRSSXML(text);

        return items.slice(0, 10).map(item => ({
          title: item.title,
          description: cleanHTML(item.description).slice(0, 300),
          link: item.link,
          date: item.pubDate || new Date().toISOString(),
          source: 'Google News',
          category: 'official',
          icon: 'google',
        }));
      } catch {
        return [];
      }
    })
  );

  const seen = new Set();
  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(item => {
      const key = item.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// ---- X/Twitter Account Handles for Timeline Fetching ----
const X_ACCOUNTS = ['IranIntl', 'IranWireEnglish', 'ABORACIR'];

// ---- RSSHub Instances (primary for X/Twitter) ----
const RSSHUB_INSTANCES = [
  'https://rsshub.app',
  'https://rsshub.rssforever.com',
];

// ---- Nitter/Alternative Frontend Instances for RSS (fallback) ----
const NITTER_INSTANCES = [
  'https://xcancel.com',
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
];

// ---- Fetch X/Twitter Mentions (via multiple fallback methods) ----
export async function fetchXMentions() {
  const results = await Promise.allSettled([
    fetchXAccountTimelines(),
    fetchXSearchPosts(),
  ]);

  const accountPosts = results[0].status === 'fulfilled' ? results[0].value : [];
  const searchPosts = results[1].status === 'fulfilled' ? results[1].value : [];

  return [...accountPosts, ...searchPosts];
}

// ---- Fetch timelines for specific X accounts ----
async function fetchXAccountTimelines() {
  const results = await Promise.allSettled(
    X_ACCOUNTS.map(async (handle) => {
      // METHOD 1: RSSHub (fastest, most reliable)
      for (const instance of RSSHUB_INSTANCES) {
        try {
          const response = await fetchWithTimeout(`${instance}/twitter/user/${handle}`, {
            headers: { 'User-Agent': 'IranWatcher/2.0' },
            cf: { cacheTtl: 300 },
          }, 6000);
          if (!response.ok) continue;
          const text = await response.text();
          const items = parseRSSXML(text);
          if (items.length > 0) {
            return items.slice(0, 10).map(item => ({
              title: cleanHTML(item.title).slice(0, 280),
              description: cleanHTML(item.description).slice(0, 500),
              link: item.link || `https://x.com/${handle}`,
              date: item.pubDate || new Date().toISOString(),
              source: `@${handle}`,
              category: 'unofficial',
              icon: 'x',
              handle: handle,
              searchQuery: '',
            }));
          }
        } catch { continue; }
      }

      // METHOD 2: Nitter RSS (limited instances — try only first 2)
      for (const instance of NITTER_INSTANCES.slice(0, 2)) {
        try {
          const response = await fetchWithTimeout(`${instance}/${handle}/rss`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IranWatcher/2.0)' },
            cf: { cacheTtl: 300 },
          }, 5000);
          if (!response.ok) continue;
          const text = await response.text();
          if (text.includes('not yet whitelisted') || text.includes('RSS reader not yet')) continue;
          const items = parseRSSXML(text);
          if (items.length === 0) continue;
          return items.slice(0, 10).map(item => ({
            title: cleanHTML(item.title).slice(0, 280),
            description: cleanHTML(item.description).slice(0, 500),
            link: item.link ? item.link.replace(/nitter\.[^/]+/, 'x.com').replace(/xcancel\.com/, 'x.com') : `https://x.com/${handle}`,
            date: item.pubDate || new Date().toISOString(),
            source: `@${handle}`,
            category: 'unofficial',
            icon: 'x',
            handle: handle,
            searchQuery: '',
          }));
        } catch { continue; }
      }

      // METHOD 3: FxTwitter API
      try {
        const response = await fetchWithTimeout(`https://api.fxtwitter.com/${handle}`, {
          headers: { 'User-Agent': 'IranWatcher/2.0' },
          cf: { cacheTtl: 300 },
        }, 5000);
        if (response.ok) {
          const data = await response.json();
          const tweets = data.tweets || [];
          if (tweets.length > 0) {
            return tweets.slice(0, 10).map(tweet => ({
              title: (tweet.text || '').slice(0, 280),
              description: (tweet.text || '').slice(0, 500),
              link: tweet.url || `https://x.com/${handle}`,
              date: tweet.created_at || new Date().toISOString(),
              source: `@${handle}`,
              category: 'unofficial',
              icon: 'x',
              handle: handle,
              searchQuery: '',
            }));
          }
        }
      } catch { /* all methods failed */ }

      return [];
    })
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

// ---- Fetch X search results ----
async function fetchXSearchPosts() {
  const results = await Promise.allSettled(
    X_SEARCH_QUERIES.slice(0, 5).map(async (query) => {
      const encodedQuery = encodeURIComponent(query);

      // METHOD 1: RSSHub search
      for (const instance of RSSHUB_INSTANCES) {
        try {
          const response = await fetchWithTimeout(`${instance}/twitter/search/${encodedQuery}`, {
            headers: { 'User-Agent': 'IranWatcher/2.0' },
            cf: { cacheTtl: 300 },
          }, 6000);
          if (!response.ok) continue;
          const text = await response.text();
          const items = parseRSSXML(text);
          if (items.length > 0) {
            return items.slice(0, 5).map(item => ({
              title: cleanHTML(item.title).slice(0, 280),
              description: cleanHTML(item.description).slice(0, 500),
              link: item.link || `https://x.com/search?q=${encodedQuery}`,
              date: item.pubDate || new Date().toISOString(),
              source: `X Search - "${query}"`,
              category: 'unofficial',
              icon: 'x',
              searchQuery: query,
            }));
          }
        } catch { continue; }
      }

      // METHOD 2: Nitter search RSS (try only first instance to save time)
      for (const instance of NITTER_INSTANCES.slice(0, 1)) {
        try {
          const response = await fetchWithTimeout(`${instance}/search/rss?f=tweets&q=${encodedQuery}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IranWatcher/2.0)' },
            cf: { cacheTtl: 300 },
          }, 5000);
          if (!response.ok) continue;
          const text = await response.text();
          if (text.includes('not yet whitelisted') || text.includes('RSS reader not yet')) continue;
          const items = parseRSSXML(text);
          if (items.length === 0) continue;
          return items.slice(0, 5).map(item => ({
            title: cleanHTML(item.title).slice(0, 280),
            description: cleanHTML(item.description).slice(0, 500),
            link: item.link ? item.link.replace(/nitter\.[^/]+/, 'x.com').replace(/xcancel\.com/, 'x.com') : `https://x.com/search?q=${encodedQuery}`,
            date: item.pubDate || new Date().toISOString(),
            source: `X Search - "${query}"`,
            category: 'unofficial',
            icon: 'x',
            searchQuery: query,
          }));
        } catch { continue; }
      }

      // Final fallback: monitoring placeholder
      return [{
        title: `Monitoring X for: "${query}"`,
        description: `Actively watching X/Twitter for posts matching "${query}". Posts will appear here when detected.`,
        link: `https://x.com/search?q=${encodeURIComponent(query)}&f=live`,
        date: new Date().toISOString(),
        source: `X Monitor - "${query}"`,
        category: 'unofficial',
        icon: 'x',
        searchQuery: query,
        isMonitoring: true,
      }];
    })
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

// ---- Simple XML RSS Parser (no dependencies) ----
function parseRSSXML(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      title: extractTag(itemXml, 'title'),
      description: extractTag(itemXml, 'description'),
      link: extractTag(itemXml, 'link'),
      pubDate: extractTag(itemXml, 'pubDate'),
    });
  }

  return items;
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  const match = regex.exec(xml);
  return match ? match[1].trim() : '';
}

function cleanHTML(str) {
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

function isIranRelated(text) {
  const lower = text.toLowerCase();
  return IRAN_KEYWORDS.some(keyword => lower.includes(keyword));
}
