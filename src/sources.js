// ============================================================================
// NEWS SOURCES - Fetches from official RSS feeds and X/Twitter monitors
// ============================================================================

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
    url: 'https://rsshub.app/apnews/topics/apf-topnews',
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

  return {
    official: [...official, ...google].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50),
    unofficial: unofficial.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50),
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
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'IranWatcher/1.0 (Cloudflare Worker)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      cf: { cacheTtl: 600 },
    });

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
        const response = await fetch(url, {
          headers: { 'User-Agent': 'IranWatcher/1.0 (Cloudflare Worker)' },
          cf: { cacheTtl: 600 },
        });

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

// ---- Nitter/Alternative Frontend Instances for RSS ----
const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://xcancel.com',
  'https://nitter.woodland.cafe',
  'https://nitter.1d4.us',
  'https://nitter.lucabased.xyz',
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

// ---- Fetch timelines for specific X accounts via Nitter RSS ----
async function fetchXAccountTimelines() {
  const results = await Promise.allSettled(
    X_ACCOUNTS.map(async (handle) => {
      // Try each Nitter instance until one works
      for (const instance of NITTER_INSTANCES) {
        try {
          const url = `${instance}/${handle}/rss`;
          const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IranWatcher/1.0)' },
            cf: { cacheTtl: 300 },
          });

          if (!response.ok) continue;

          const text = await response.text();

          // Skip instances that require RSS whitelist
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
        } catch {
          continue;
        }
      }

      // Try FxTwitter API as final fallback for account timelines
      try {
        const response = await fetch(`https://api.fxtwitter.com/${handle}`, {
          headers: { 'User-Agent': 'IranWatcher/1.0' },
          cf: { cacheTtl: 300 },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.tweets && data.tweets.length > 0) {
            return data.tweets.slice(0, 10).map(tweet => ({
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
      } catch {
        // FxTwitter fallback failed
      }

      return [];
    })
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

// ---- Fetch X search results via Nitter RSS search ----
async function fetchXSearchPosts() {
  const results = await Promise.allSettled(
    X_SEARCH_QUERIES.slice(0, 5).map(async (query) => {
      const encodedQuery = encodeURIComponent(query);

      // Try Nitter search RSS
      for (const instance of NITTER_INSTANCES) {
        try {
          const url = `${instance}/search/rss?f=tweets&q=${encodedQuery}`;
          const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IranWatcher/1.0)' },
            cf: { cacheTtl: 300 },
          });

          if (!response.ok) continue;

          const text = await response.text();

          // Skip instances that require RSS whitelist
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
        } catch {
          continue;
        }
      }

      // Try RSSHub as additional fallback
      try {
        const url = `https://rsshub.app/twitter/search/${encodedQuery}`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'IranWatcher/1.0' },
          cf: { cacheTtl: 300 },
        });

        if (response.ok) {
          const text = await response.text();
          const items = parseRSSXML(text);
          if (items.length > 0) {
            return items.slice(0, 5).map(item => ({
              title: cleanHTML(item.title).slice(0, 280),
              description: cleanHTML(item.description).slice(0, 500),
              link: item.link,
              date: item.pubDate || new Date().toISOString(),
              source: `X Search - "${query}"`,
              category: 'unofficial',
              icon: 'x',
              searchQuery: query,
            }));
          }
        }
      } catch {
        // RSSHub fallback failed
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
