// ============================================================================
// UI - Full HTML/CSS/JS frontend served inline from the Worker
// ============================================================================

export function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IRAN WATCHER - Intelligence Monitor</title>
  <style>
    :root {
      --bg-primary: #0a0e17;
      --bg-secondary: #111827;
      --bg-card: #1a2235;
      --bg-card-hover: #1f2a42;
      --border: #2a3a5c;
      --text-primary: #e2e8f0;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-red: #ef4444;
      --accent-amber: #f59e0b;
      --accent-green: #22c55e;
      --accent-blue: #3b82f6;
      --accent-purple: #8b5cf6;
      --accent-cyan: #06b6d4;
      --threat-low: #22c55e;
      --threat-elevated: #f59e0b;
      --threat-high: #f97316;
      --threat-critical: #ef4444;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* ---- Animated Background Grid ---- */
    .bg-grid {
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
      z-index: 0;
    }

    /* ---- Header ---- */
    header {
      position: relative;
      z-index: 10;
      background: linear-gradient(180deg, rgba(17, 24, 39, 0.95), rgba(10, 14, 23, 0.9));
      border-bottom: 1px solid var(--border);
      padding: 16px 24px;
    }

    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1400px;
      margin: 0 auto;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--accent-red), #991b1b);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
    }

    .logo-text h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 3px;
      color: var(--accent-red);
      text-transform: uppercase;
    }

    .logo-text p {
      font-size: 11px;
      color: var(--text-muted);
      letter-spacing: 1px;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 20px;
      font-size: 11px;
      color: var(--accent-green);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--accent-green);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .refresh-btn {
      padding: 8px 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .refresh-btn:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
      border-color: var(--accent-blue);
    }

    .refresh-btn.loading {
      opacity: 0.6;
      pointer-events: none;
    }

    .last-updated {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* ---- Main Content ---- */
    main {
      position: relative;
      z-index: 10;
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    /* ---- AI Summary Panel ---- */
    .summary-panel {
      background: linear-gradient(135deg, var(--bg-card), rgba(26, 34, 53, 0.8));
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 28px;
      position: relative;
      overflow: hidden;
    }

    .summary-panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--accent-red), var(--accent-amber), var(--accent-red));
      background-size: 200% 100%;
      animation: shimmer 3s infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .summary-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .summary-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 600;
      color: var(--accent-amber);
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .ai-badge {
      padding: 3px 10px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 12px;
      font-size: 10px;
      color: var(--accent-purple);
      letter-spacing: 1px;
    }

    .summary-content {
      font-size: 13px;
      line-height: 1.8;
      color: var(--text-secondary);
      white-space: pre-wrap;
    }

    .summary-content strong {
      color: var(--text-primary);
    }

    .summary-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px;
      color: var(--text-muted);
      font-size: 13px;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--border);
      border-top-color: var(--accent-blue);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ---- Feed Tabs ---- */
    .feed-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 4px;
      border: 1px solid var(--border);
    }

    .feed-tab {
      flex: 1;
      padding: 12px 20px;
      background: none;
      border: none;
      border-radius: 8px;
      color: var(--text-muted);
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .feed-tab:hover {
      color: var(--text-secondary);
      background: rgba(255,255,255,0.03);
    }

    .feed-tab.active {
      background: var(--bg-card);
      color: var(--text-primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .tab-count {
      padding: 2px 8px;
      background: rgba(59, 130, 246, 0.2);
      border-radius: 10px;
      font-size: 10px;
      color: var(--accent-blue);
    }

    .feed-tab.active .tab-count {
      background: rgba(59, 130, 246, 0.3);
      color: var(--accent-cyan);
    }

    /* ---- News Feed ---- */
    .news-feed {
      display: grid;
      gap: 12px;
    }

    .news-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
      cursor: pointer;
      text-decoration: none;
      display: block;
      color: inherit;
    }

    .news-card:hover {
      background: var(--bg-card-hover);
      border-color: var(--accent-blue);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }

    .news-card.unofficial {
      border-left: 3px solid var(--accent-purple);
    }

    .news-card.official {
      border-left: 3px solid var(--accent-blue);
    }

    .news-card.monitoring {
      border-left: 3px solid var(--accent-amber);
      opacity: 0.7;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .source-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .source-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: white;
    }

    .source-icon.reuters { background: #ff8000; }
    .source-icon.bbc { background: #bb1919; }
    .source-icon.aljazeera { background: #d2a44e; }
    .source-icon.ap { background: #c41230; }
    .source-icon.guardian { background: #052962; }
    .source-icon.google { background: #4285f4; }
    .source-icon.x { background: #000; border: 1px solid #333; }

    .source-name {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-time {
      font-size: 11px;
      color: var(--text-muted);
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.5;
      margin-bottom: 8px;
    }

    .card-description {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .card-tags {
      display: flex;
      gap: 6px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    .tag {
      padding: 3px 10px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 12px;
      font-size: 10px;
      color: var(--accent-blue);
    }

    .tag.unofficial-tag {
      background: rgba(139, 92, 246, 0.1);
      border-color: rgba(139, 92, 246, 0.2);
      color: var(--accent-purple);
    }

    .tag.monitoring-tag {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
      color: var(--accent-amber);
    }

    /* ---- Empty State ---- */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-state .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 16px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .empty-state p {
      font-size: 13px;
    }

    /* ---- Footer ---- */
    footer {
      position: relative;
      z-index: 10;
      text-align: center;
      padding: 24px;
      color: var(--text-muted);
      font-size: 11px;
      border-top: 1px solid var(--border);
      margin-top: 40px;
    }

    footer a {
      color: var(--accent-blue);
      text-decoration: none;
    }

    /* ---- Responsive ---- */
    @media (max-width: 768px) {
      header { padding: 12px 16px; }
      .header-top { flex-direction: column; gap: 12px; }
      main { padding: 16px; }
      .summary-panel { padding: 20px; }
      .feed-tabs { flex-direction: column; }
      .feed-tab { padding: 10px; }
      .logo-text h1 { font-size: 16px; }
    }
  </style>
</head>
<body>
  <div class="bg-grid"></div>

  <header>
    <div class="header-top">
      <div class="logo-section">
        <div class="logo-icon">&#9432;</div>
        <div class="logo-text">
          <h1>IRAN WATCHER</h1>
          <p>Real-Time Intelligence Monitor &mdash; Iran-US Conflict Tracking</p>
        </div>
      </div>
      <div class="header-controls">
        <div class="status-badge">
          <span class="status-dot"></span>
          LIVE MONITORING
        </div>
        <button class="refresh-btn" onclick="refreshData()">
          &#8635; Refresh
        </button>
        <span class="last-updated" id="lastUpdated">Loading...</span>
      </div>
    </div>
  </header>

  <main>
    <!-- AI Summary Panel -->
    <section class="summary-panel" id="summaryPanel">
      <div class="summary-header">
        <div class="summary-title">
          &#9733; Intelligence Briefing
        </div>
        <span class="ai-badge">CLOUDFLARE AI</span>
      </div>
      <div class="summary-content" id="summaryContent">
        <div class="summary-loading">
          <div class="spinner"></div>
          Generating AI intelligence briefing...
        </div>
      </div>
    </section>

    <!-- Feed Tabs -->
    <div class="feed-tabs">
      <button class="feed-tab active" data-tab="all" onclick="switchTab('all')">
        All Updates <span class="tab-count" id="countAll">0</span>
      </button>
      <button class="feed-tab" data-tab="official" onclick="switchTab('official')">
        Official Channels <span class="tab-count" id="countOfficial">0</span>
      </button>
      <button class="feed-tab" data-tab="unofficial" onclick="switchTab('unofficial')">
        X / Unofficial <span class="tab-count" id="countUnofficial">0</span>
      </button>
    </div>

    <!-- News Feed -->
    <div class="news-feed" id="newsFeed">
      <div class="summary-loading">
        <div class="spinner"></div>
        Loading intelligence feeds...
      </div>
    </div>
  </main>

  <footer>
    Powered by <a href="https://workers.cloudflare.com" target="_blank">Cloudflare Workers</a>
    &bull; AI by <a href="https://ai.cloudflare.com" target="_blank">Workers AI</a>
    &bull; Data from official news agencies &amp; X/Twitter
    <br><br>
    This tool aggregates publicly available news for informational purposes only.
    It does not represent the views of any government or organization.
  </footer>

  <script>
    let newsData = { official: [], unofficial: [] };
    let currentTab = 'all';

    // ---- Load News on Page Load ----
    document.addEventListener('DOMContentLoaded', loadNews);

    // Auto-refresh every 5 minutes
    setInterval(loadNews, 5 * 60 * 1000);

    async function loadNews() {
      try {
        const res = await fetch('/api/news');
        const data = await res.json();

        if (data.success) {
          newsData = data.news;
          renderSummary(data.summary);
          renderFeed();
          updateTimestamp(data.lastUpdated);
        } else {
          showError('Failed to load news: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        showError('Network error — retrying in 30 seconds...');
        setTimeout(loadNews, 30000);
      }
    }

    async function refreshData() {
      const btn = document.querySelector('.refresh-btn');
      btn.classList.add('loading');
      btn.innerHTML = '<div class="spinner"></div> Refreshing...';

      try {
        await fetch('/api/refresh');
        await loadNews();
      } catch (err) {
        showError('Refresh failed');
      } finally {
        btn.classList.remove('loading');
        btn.innerHTML = '&#8635; Refresh';
      }
    }

    function renderSummary(summary) {
      const el = document.getElementById('summaryContent');
      if (!summary) {
        el.innerHTML = '<div class="summary-loading"><div class="spinner"></div>Generating AI intelligence briefing...</div>';
        return;
      }

      // Convert markdown bold to HTML
      let html = summary
        .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/^- /gm, '&bull; ')
        .replace(/\\n/g, '<br>');

      // Highlight threat levels
      html = html.replace(/CRITICAL/g, '<span style="color:var(--threat-critical);font-weight:700">CRITICAL</span>');
      html = html.replace(/HIGH/g, '<span style="color:var(--threat-high);font-weight:700">HIGH</span>');
      html = html.replace(/ELEVATED/g, '<span style="color:var(--threat-elevated);font-weight:700">ELEVATED</span>');
      html = html.replace(/LOW/g, '<span style="color:var(--threat-low);font-weight:700">LOW</span>');
      html = html.replace(/MONITORING/g, '<span style="color:var(--accent-blue);font-weight:700">MONITORING</span>');

      el.innerHTML = html;
    }

    function renderFeed() {
      const feed = document.getElementById('newsFeed');
      let items = [];

      if (currentTab === 'all' || currentTab === 'official') {
        items = items.concat(newsData.official || []);
      }
      if (currentTab === 'all' || currentTab === 'unofficial') {
        items = items.concat(newsData.unofficial || []);
      }

      // Sort by date
      items.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Update counts
      document.getElementById('countAll').textContent =
        (newsData.official || []).length + (newsData.unofficial || []).length;
      document.getElementById('countOfficial').textContent =
        (newsData.official || []).length;
      document.getElementById('countUnofficial').textContent =
        (newsData.unofficial || []).length;

      if (items.length === 0) {
        feed.innerHTML = \`
          <div class="empty-state">
            <div class="icon">&#128225;</div>
            <h3>No intelligence items found</h3>
            <p>Monitoring channels for Iran-US conflict updates. Items will appear as they are detected.</p>
          </div>\`;
        return;
      }

      feed.innerHTML = items.map(item => {
        const iconLabel = getIconLabel(item.icon);
        const cardClass = item.isMonitoring ? 'monitoring' : item.category;
        const tagClass = item.isMonitoring ? 'monitoring-tag' : item.category === 'unofficial' ? 'unofficial-tag' : '';
        const tagLabel = item.isMonitoring ? 'MONITORING' : item.category === 'unofficial' ? 'UNOFFICIAL' : 'OFFICIAL';

        return \`
          <a href="\${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer"
             class="news-card \${cardClass}">
            <div class="card-header">
              <div class="source-info">
                <div class="source-icon \${item.icon || ''}">\${iconLabel}</div>
                <span class="source-name">\${escapeHtml(item.source)}</span>
              </div>
              <span class="card-time">\${formatTime(item.date)}</span>
            </div>
            <div class="card-title">\${escapeHtml(item.title)}</div>
            \${item.description ? \`<div class="card-description">\${escapeHtml(item.description)}</div>\` : ''}
            <div class="card-tags">
              <span class="tag \${tagClass}">\${tagLabel}</span>
              \${item.searchQuery ? \`<span class="tag unofficial-tag">Search: \${escapeHtml(item.searchQuery)}</span>\` : ''}
            </div>
          </a>\`;
      }).join('');
    }

    function switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.feed-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
      });
      renderFeed();
    }

    function getIconLabel(icon) {
      const labels = {
        reuters: 'R',
        bbc: 'BBC',
        aljazeera: 'AJ',
        ap: 'AP',
        guardian: 'G',
        google: 'GN',
        x: 'X',
      };
      return labels[icon] || '?';
    }

    function formatTime(dateStr) {
      try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return diffMins + 'm ago';
        if (diffHours < 24) return diffHours + 'h ago';
        if (diffDays < 7) return diffDays + 'd ago';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch {
        return '';
      }
    }

    function updateTimestamp(isoStr) {
      const el = document.getElementById('lastUpdated');
      if (isoStr) {
        const d = new Date(isoStr);
        el.textContent = 'Updated: ' + d.toLocaleTimeString();
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function showError(msg) {
      console.error(msg);
    }
  </script>
</body>
</html>`;
}
