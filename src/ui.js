// ============================================================================
// UI - Full HTML/CSS/JS frontend served inline from the Worker
// y12.ai intelligence dashboard
// ============================================================================

export function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#04060b">
  <title>IRAN WATCHER // y12.ai</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    :root {
      --bg-void: #04060b;
      --bg-primary: #080c14;
      --bg-secondary: #0c1220;
      --bg-card: #0f172a;
      --bg-card-hover: #131d35;
      --bg-elevated: #162036;
      --border-dim: #1a2744;
      --border-mid: #243556;
      --border-bright: #2d4a7c;
      --border-glow: #3b82f6;
      --text-primary: #d1ddf0;
      --text-secondary: #7e93b5;
      --text-muted: #4a5f82;
      --text-label: #5b7099;
      --accent-red: #e53e3e;
      --accent-red-dim: rgba(229, 62, 62, 0.15);
      --accent-amber: #d69e2e;
      --accent-amber-dim: rgba(214, 158, 46, 0.12);
      --accent-green: #38a169;
      --accent-green-dim: rgba(56, 161, 105, 0.12);
      --accent-blue: #3b82f6;
      --accent-blue-dim: rgba(59, 130, 246, 0.1);
      --accent-cyan: #22d3ee;
      --accent-cyan-dim: rgba(34, 211, 238, 0.08);
      --accent-purple: #8b5cf6;
      --accent-purple-dim: rgba(139, 92, 246, 0.1);
      --threat-low: #38a169;
      --threat-elevated: #d69e2e;
      --threat-high: #dd6b20;
      --threat-critical: #e53e3e;
      --glow-blue: 0 0 20px rgba(59, 130, 246, 0.15);
      --glow-cyan: 0 0 20px rgba(34, 211, 238, 0.1);
      --glow-red: 0 0 20px rgba(229, 62, 62, 0.15);
      --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--font-mono);
      background: var(--bg-void);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* ======== PALANTIR GRID OVERLAY ======== */
    .bg-grid {
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }

    .bg-grid::after {
      content: '';
      position: fixed;
      inset: 0;
      background: radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.04) 0%, transparent 60%);
      pointer-events: none;
    }

    /* Scan line effect */
    .scanline {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.08), transparent);
      animation: scanDown 8s linear infinite;
      pointer-events: none;
      z-index: 999;
    }

    @keyframes scanDown {
      0% { top: -2px; }
      100% { top: 100vh; }
    }

    /* ======== CLASSIFICATION BANNER ======== */
    .classification-bar {
      background: var(--accent-red);
      color: white;
      text-align: center;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 4px;
      padding: 3px 0;
      font-family: var(--font-mono);
      text-transform: uppercase;
      z-index: 100;
      position: relative;
    }

    /* ======== HEADER / TOP BAR ======== */
    header {
      position: relative;
      z-index: 10;
      background: linear-gradient(180deg, rgba(12, 18, 32, 0.98), rgba(8, 12, 20, 0.95));
      border-bottom: 1px solid var(--border-dim);
      padding: 0;
    }

    .header-main {
      display: flex;
      align-items: stretch;
      max-width: 1600px;
      margin: 0 auto;
    }

    .logo-block {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 24px;
      border-right: 1px solid var(--border-dim);
    }

    .logo-hex {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--accent-red), #991b1b);
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .logo-text h1 {
      font-family: var(--font-mono);
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 4px;
      color: var(--text-primary);
      text-transform: uppercase;
      line-height: 1;
    }

    .logo-text .subtitle {
      font-family: var(--font-mono);
      font-size: 9px;
      color: var(--text-muted);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 4px;
    }

    .header-stats {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 0;
    }

    .stat-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px 20px;
      border-right: 1px solid var(--border-dim);
      min-width: 100px;
    }

    .stat-label {
      font-size: 8px;
      color: var(--text-muted);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--accent-cyan);
      font-family: var(--font-mono);
    }

    .stat-value.threat-low { color: var(--threat-low); }
    .stat-value.threat-elevated { color: var(--threat-elevated); }
    .stat-value.threat-high { color: var(--threat-high); }
    .stat-value.threat-critical { color: var(--threat-critical); }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 24px;
      margin-left: auto;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: var(--accent-green-dim);
      border: 1px solid rgba(56, 161, 105, 0.3);
      font-size: 9px;
      color: var(--accent-green);
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      background: var(--accent-green);
      border-radius: 50%;
      animation: blink 2s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .ctrl-btn {
      padding: 6px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border-mid);
      color: var(--text-secondary);
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ctrl-btn:hover {
      background: var(--bg-elevated);
      color: var(--accent-cyan);
      border-color: var(--accent-cyan);
      box-shadow: var(--glow-cyan);
    }

    .ctrl-btn.loading { opacity: 0.5; pointer-events: none; }

    .timestamp {
      font-size: 9px;
      color: var(--text-muted);
      letter-spacing: 1px;
    }

    /* ======== MAIN LAYOUT - 3 COLUMN ======== */
    .dashboard {
      position: relative;
      z-index: 10;
      max-width: 1600px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 340px;
      grid-template-rows: auto auto 1fr;
      gap: 0;
      min-height: calc(100vh - 120px);
    }

    /* ======== PANEL CHROME (Palantir-style) ======== */
    .panel {
      background: var(--bg-primary);
      border: 1px solid var(--border-dim);
      position: relative;
      overflow: hidden;
    }

    .panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border-bright), transparent);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-dim);
      min-height: 38px;
    }

    .panel-title {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-label);
      letter-spacing: 2px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-title .dot {
      width: 5px;
      height: 5px;
      background: var(--accent-cyan);
      border-radius: 50%;
    }

    .panel-badge {
      padding: 2px 8px;
      background: var(--accent-purple-dim);
      border: 1px solid rgba(139, 92, 246, 0.25);
      font-size: 8px;
      color: var(--accent-purple);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 600;
    }

    /* ======== AI BRIEFING PANEL ======== */
    .briefing-panel {
      grid-column: 1 / -1;
    }

    .briefing-panel .panel-header {
      background: linear-gradient(90deg, var(--bg-secondary), rgba(139, 92, 246, 0.05));
    }

    .briefing-content {
      padding: 16px 20px;
      font-size: 12px;
      line-height: 1.9;
      color: var(--text-secondary);
      white-space: pre-wrap;
      max-height: 320px;
      overflow-y: auto;
    }

    .briefing-content::-webkit-scrollbar { width: 4px; }
    .briefing-content::-webkit-scrollbar-track { background: var(--bg-primary); }
    .briefing-content::-webkit-scrollbar-thumb { background: var(--border-mid); }

    .briefing-content strong { color: var(--accent-cyan); font-weight: 600; }

    .briefing-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 40px;
      color: var(--text-muted);
      font-size: 11px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--border-dim);
      border-top-color: var(--accent-cyan);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ======== TOPIC FILTER BAR ======== */
    .topic-bar {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      background: var(--bg-secondary);
      border: 1px solid var(--border-dim);
      border-top: none;
      padding: 0 16px;
      gap: 4px;
      overflow-x: auto;
    }

    .topic-bar::-webkit-scrollbar { height: 0; }

    .topic-label {
      font-size: 9px;
      color: var(--text-muted);
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 10px 12px 10px 0;
      border-right: 1px solid var(--border-dim);
      margin-right: 8px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .topic-btn {
      padding: 6px 14px;
      background: none;
      border: 1px solid transparent;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .topic-btn:hover {
      color: var(--text-secondary);
      background: var(--accent-blue-dim);
    }

    .topic-btn.active {
      color: var(--accent-cyan);
      background: var(--accent-cyan-dim);
      border-color: rgba(34, 211, 238, 0.2);
    }

    .topic-btn .count {
      margin-left: 6px;
      font-size: 9px;
      opacity: 0.6;
    }

    /* ======== LIVE CAMS PANEL ======== */
    .cams-panel {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
    }

    .cams-tabs {
      display: flex;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-dim);
      overflow-x: auto;
      gap: 0;
    }

    .cams-tabs::-webkit-scrollbar { height: 0; }

    .cam-tab {
      padding: 8px 16px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .cam-tab:hover { color: var(--text-secondary); background: rgba(255,255,255,0.02); }

    .cam-tab.active {
      color: var(--accent-red);
      border-bottom-color: var(--accent-red);
      background: rgba(229, 62, 62, 0.03);
    }

    .cam-tab .cam-region {
      font-size: 7px;
      opacity: 0.5;
      margin-left: 4px;
    }

    .cams-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      flex: 1;
      min-height: 340px;
    }

    .cam-embed {
      position: relative;
      background: #000;
      border-right: 1px solid var(--border-dim);
      min-height: 280px;
    }

    .cam-embed:last-child { border-right: none; }

    .cam-embed iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }

    /* Subtle bottom fade for branding */
    .cam-embed::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 28px;
      background: linear-gradient(0deg, rgba(4,6,11,0.7) 0%, transparent 100%);
      z-index: 4;
      pointer-events: none;
    }

    .cam-embed-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: linear-gradient(180deg, rgba(4,6,11,0.92) 0%, rgba(4,6,11,0.5) 70%, transparent 100%);
      pointer-events: none;
    }

    .cam-embed-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      pointer-events: none;
    }

    .cam-embed-loc {
      font-family: var(--font-mono);
      font-size: 7px;
      color: rgba(209, 221, 240, 0.4);
      letter-spacing: 1px;
    }

    .cam-embed-time {
      font-family: var(--font-mono);
      font-size: 7px;
      color: rgba(229, 62, 62, 0.6);
      letter-spacing: 1px;
    }

    .cam-embed-label {
      font-family: var(--font-mono);
      font-size: 9px;
      color: var(--text-primary);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .cam-embed-region {
      font-size: 8px;
      color: var(--accent-red);
      letter-spacing: 1px;
      font-weight: 600;
    }

    .cam-live-dot {
      width: 6px;
      height: 6px;
      background: var(--accent-red);
      border-radius: 50%;
      animation: blink 2s infinite;
      display: inline-block;
      margin-right: 6px;
    }

    .cam-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 280px;
      text-align: center;
      padding: 20px;
      background: var(--bg-primary);
    }

    .cam-placeholder-icon {
      font-size: 32px;
      margin-bottom: 10px;
      opacity: 0.15;
    }

    .cam-placeholder-text {
      font-size: 10px;
      color: var(--text-muted);
      margin-bottom: 4px;
      letter-spacing: 1px;
    }

    .cam-placeholder-sub {
      font-size: 8px;
      color: rgba(229, 62, 62, 0.5);
      letter-spacing: 2px;
      text-transform: uppercase;
      animation: blink 3s infinite;
    }

    .cam-status-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-dim);
      font-size: 8px;
      color: var(--text-muted);
      letter-spacing: 1px;
    }

    .cam-fullscreen-btn {
      padding: 4px 10px;
      background: none;
      border: 1px solid var(--border-dim);
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 8px;
      cursor: pointer;
      letter-spacing: 1px;
      transition: all 0.15s;
    }

    .cam-fullscreen-btn:hover {
      color: var(--text-primary);
      border-color: var(--border-mid);
    }

    @media (max-width: 768px) {
      .cams-content {
        grid-template-columns: 1fr;
        min-height: 240px;
      }
      .cam-embed {
        border-right: none;
        border-bottom: 1px solid var(--border-dim);
        min-height: 220px;
      }
    }

    /* ======== FEED TABS ======== */
    .feed-tabs {
      display: flex;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-dim);
    }

    .feed-tab {
      flex: 1;
      padding: 10px 16px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .feed-tab:hover { color: var(--text-secondary); background: rgba(255,255,255,0.02); }

    .feed-tab.active {
      color: var(--accent-cyan);
      border-bottom-color: var(--accent-cyan);
      background: rgba(34, 211, 238, 0.03);
    }

    .tab-count {
      padding: 1px 6px;
      background: var(--accent-blue-dim);
      font-size: 9px;
      color: var(--accent-blue);
    }

    .feed-tab.active .tab-count {
      background: var(--accent-cyan-dim);
      color: var(--accent-cyan);
    }

    /* ======== NEWS FEED ======== */
    .feed-area {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .news-feed {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .news-feed::-webkit-scrollbar { width: 4px; }
    .news-feed::-webkit-scrollbar-track { background: var(--bg-primary); }
    .news-feed::-webkit-scrollbar-thumb { background: var(--border-mid); }

    .news-card {
      display: block;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-dim);
      transition: all 0.12s;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      position: relative;
    }

    .news-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--accent-blue);
      opacity: 0;
      transition: opacity 0.15s;
    }

    .news-card:hover {
      background: var(--bg-card-hover);
    }

    .news-card:hover::before { opacity: 1; }

    .news-card.official::before { background: var(--accent-blue); opacity: 0.6; }
    .news-card.unofficial::before { background: var(--accent-purple); opacity: 0.6; }
    .news-card.monitoring::before { background: var(--accent-amber); opacity: 0.4; }
    .news-card.monitoring { opacity: 0.6; }

    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .source-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .source-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .source-icon.reuters { background: #e87400; }
    .source-icon.bbc { background: #a11; }
    .source-icon.aljazeera { background: #b8922f; }
    .source-icon.ap { background: #b01030; }
    .source-icon.guardian { background: #052962; }
    .source-icon.google { background: #3367d6; }
    .source-icon.x { background: #111; border: 1px solid #333; }

    .source-name {
      font-size: 9px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .card-time {
      font-size: 9px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    .card-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.5;
      margin-bottom: 4px;
      font-family: var(--font-sans);
    }

    .card-desc {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.5;
      font-family: var(--font-sans);
    }

    .card-tags {
      display: flex;
      gap: 4px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .tag {
      padding: 2px 8px;
      font-size: 8px;
      font-family: var(--font-mono);
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 600;
      background: var(--accent-blue-dim);
      color: var(--accent-blue);
      border: 1px solid rgba(59, 130, 246, 0.15);
    }

    .tag.unofficial-tag {
      background: var(--accent-purple-dim);
      color: var(--accent-purple);
      border-color: rgba(139, 92, 246, 0.15);
    }

    .tag.monitoring-tag {
      background: var(--accent-amber-dim);
      color: var(--accent-amber);
      border-color: rgba(214, 158, 46, 0.15);
    }

    .tag.topic-tag {
      background: var(--accent-cyan-dim);
      color: var(--accent-cyan);
      border-color: rgba(34, 211, 238, 0.15);
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-state h3 { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
    .empty-state p { font-size: 11px; }

    /* ======== RIGHT SIDEBAR ======== */
    .sidebar {
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--border-dim);
      overflow: hidden;
    }

    /* ======== X/TWITTER EMBED PANEL ======== */
    .x-feed-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 300px;
    }

    .x-feed-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .x-feed-content::-webkit-scrollbar { width: 4px; }
    .x-feed-content::-webkit-scrollbar-track { background: var(--bg-primary); }
    .x-feed-content::-webkit-scrollbar-thumb { background: var(--border-mid); }

    .x-search-tabs {
      display: flex;
      overflow-x: auto;
      background: rgba(0,0,0,0.3);
      border-bottom: 1px solid var(--border-dim);
    }

    .x-search-tabs::-webkit-scrollbar { height: 0; }

    .x-search-tab {
      padding: 7px 12px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 9px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }

    .x-search-tab:hover { color: var(--text-secondary); }
    .x-search-tab.active { color: #1d9bf0; border-bottom-color: #1d9bf0; }

    .x-live-iframe {
      width: 100%;
      border: none;
      flex: 1;
      min-height: 400px;
      background: var(--bg-primary);
    }

    .x-embed-status {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(29,155,240,0.04);
      border-bottom: 1px solid var(--border-dim);
      font-size: 9px;
      color: var(--text-muted);
      font-family: var(--font-mono);
      letter-spacing: 0.5px;
    }

    .x-iframe-footer {
      display: flex;
      border-top: 1px solid var(--border-dim);
    }

    .x-refresh-btn {
      flex: 1;
      padding: 10px;
      background: none;
      border: none;
      border-right: 1px solid var(--border-dim);
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 9px;
      letter-spacing: 1px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .x-refresh-btn:hover {
      background: rgba(29,155,240,0.06);
      color: #1d9bf0;
    }

    .x-open-btn {
      flex: 1;
      padding: 10px;
      background: none;
      color: #1d9bf0;
      font-family: var(--font-mono);
      font-size: 9px;
      letter-spacing: 1px;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .x-open-btn:hover {
      background: rgba(29,155,240,0.08);
    }

    .x-feed-items {
      padding: 0;
    }

    .x-post {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border-dim);
      font-size: 11px;
      line-height: 1.5;
      color: var(--text-secondary);
      transition: background 0.12s;
      cursor: pointer;
      display: block;
      text-decoration: none;
    }

    .x-post:hover { background: var(--bg-card-hover); }

    .x-post-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    .x-post-source {
      font-size: 9px;
      color: #1d9bf0;
      font-weight: 600;
    }

    .x-post-time {
      font-size: 9px;
      color: var(--text-muted);
      margin-left: auto;
    }

    .x-post-text {
      font-family: var(--font-sans);
      color: var(--text-primary);
    }

    .x-post-desc {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 4px;
      line-height: 1.4;
    }

    .x-post-query {
      display: inline-block;
      margin-top: 6px;
      font-size: 8px;
      padding: 1px 6px;
      background: rgba(29, 155, 240, 0.1);
      color: #1d9bf0;
      border: 1px solid rgba(29, 155, 240, 0.2);
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .x-profile-link {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 14px;
      background: rgba(29,155,240,0.08);
      border: 1px solid rgba(29,155,240,0.2);
      color: #1d9bf0;
      text-decoration: none;
      font-size: 10px;
      letter-spacing: 1px;
      font-family: var(--font-mono);
      transition: all 0.15s;
    }

    .x-profile-link:hover {
      background: rgba(29,155,240,0.15);
      border-color: rgba(29,155,240,0.4);
    }

    .x-empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted);
      font-size: 11px;
      line-height: 1.6;
    }

    /* Iframe overrides */
    .x-live-iframe {
      color-scheme: dark;
    }

    /* ======== AI CHAT PANEL ======== */
    .chat-panel {
      display: flex;
      flex-direction: column;
      border-top: 1px solid var(--border-dim);
      min-height: 280px;
      max-height: 400px;
    }

    .chat-panel .panel-header {
      cursor: pointer;
    }

    .chat-panel .panel-header:hover {
      background: var(--bg-elevated);
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .chat-messages::-webkit-scrollbar { width: 4px; }
    .chat-messages::-webkit-scrollbar-track { background: var(--bg-primary); }
    .chat-messages::-webkit-scrollbar-thumb { background: var(--border-mid); }

    .chat-msg {
      max-width: 90%;
      padding: 8px 12px;
      font-size: 11px;
      line-height: 1.6;
      font-family: var(--font-sans);
    }

    .chat-msg.user {
      align-self: flex-end;
      background: var(--accent-blue-dim);
      border: 1px solid rgba(59, 130, 246, 0.2);
      color: var(--text-primary);
    }

    .chat-msg.ai {
      align-self: flex-start;
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      color: var(--text-secondary);
    }

    .chat-msg.ai strong { color: var(--accent-cyan); }

    .chat-msg.system {
      align-self: center;
      color: var(--text-muted);
      font-size: 10px;
      font-family: var(--font-mono);
      text-align: center;
      padding: 4px;
    }

    .chat-typing {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: 10px;
      color: var(--text-muted);
    }

    .chat-typing .dots span {
      display: inline-block;
      width: 4px;
      height: 4px;
      background: var(--accent-cyan);
      border-radius: 50%;
      animation: typingDot 1.4s infinite;
      margin: 0 1px;
    }

    .chat-typing .dots span:nth-child(2) { animation-delay: 0.2s; }
    .chat-typing .dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typingDot {
      0%, 60%, 100% { opacity: 0.2; transform: translateY(0); }
      30% { opacity: 1; transform: translateY(-3px); }
    }

    .chat-input-area {
      display: flex;
      border-top: 1px solid var(--border-dim);
      background: var(--bg-secondary);
    }

    .chat-input {
      flex: 1;
      padding: 10px 14px;
      background: none;
      border: none;
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 11px;
      outline: none;
    }

    .chat-input::placeholder { color: var(--text-muted); }

    .chat-send {
      padding: 10px 16px;
      background: none;
      border: none;
      border-left: 1px solid var(--border-dim);
      color: var(--accent-cyan);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.15s;
    }

    .chat-send:hover { background: var(--accent-cyan-dim); }
    .chat-send:disabled { opacity: 0.3; cursor: default; }

    /* ======== FOOTER ======== */
    .footer-bar {
      grid-column: 1 / -1;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-dim);
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9px;
      color: var(--text-muted);
      letter-spacing: 1px;
      z-index: 10;
      position: relative;
    }

    .footer-bar a { color: var(--accent-blue); text-decoration: none; }
    .footer-bar a:hover { color: var(--accent-cyan); }

    /* ======== MOBILE NAV ======== */
    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(180deg, rgba(8,12,20,0.95), rgba(4,6,11,0.99));
      border-top: 1px solid var(--border-mid);
      z-index: 200;
      padding: 0;
      padding-bottom: env(safe-area-inset-bottom, 0);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .mobile-nav-inner {
      display: flex;
      justify-content: space-around;
      align-items: stretch;
    }

    .mobile-nav-btn {
      flex: 1;
      padding: 12px 4px 10px;
      min-height: 56px;
      background: none;
      border: none;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 8px;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: color 0.2s, background 0.2s;
      border-top: 2px solid transparent;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      position: relative;
    }

    .mobile-nav-btn .nav-icon {
      font-size: 20px;
      line-height: 1;
    }

    .mobile-nav-btn.active {
      color: var(--accent-cyan);
      border-top-color: var(--accent-cyan);
      background: rgba(34, 211, 238, 0.04);
    }

    .mobile-nav-btn:active {
      background: rgba(255,255,255,0.05);
    }

    /* Mobile notification dot on nav buttons */
    .mobile-nav-btn .nav-badge {
      position: absolute;
      top: 8px;
      right: 50%;
      transform: translateX(14px);
      width: 6px;
      height: 6px;
      background: var(--accent-red);
      border-radius: 50%;
      animation: blink 2s infinite;
    }

    /* ======== PULL TO REFRESH ======== */
    .pull-indicator {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
      z-index: 300;
      animation: pullGlow 1s ease-in-out infinite;
    }

    .pull-indicator.active { display: block; }

    @keyframes pullGlow {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }

    /* ======== RESPONSIVE - TABLET ======== */
    @media (max-width: 1024px) {
      .dashboard {
        grid-template-columns: 1fr;
      }
      .sidebar {
        border-left: none;
        border-top: 1px solid var(--border-dim);
      }
      .header-stats { display: none; }
    }

    /* ======== RESPONSIVE - MOBILE ======== */
    @media (max-width: 768px) {
      /* Safe area support */
      body {
        padding-top: env(safe-area-inset-top, 0);
      }

      .header-main { flex-direction: column; }
      .logo-block {
        border-right: none;
        border-bottom: 1px solid var(--border-dim);
        padding: 10px 14px;
      }
      .logo-hex { width: 32px; height: 32px; font-size: 12px; }
      .logo-text h1 { font-size: 13px; letter-spacing: 3px; }
      .logo-text .subtitle { font-size: 8px; }
      .header-controls {
        justify-content: center;
        flex-wrap: wrap;
        padding: 8px 14px;
        gap: 8px;
      }
      .ctrl-btn {
        min-height: 44px;
        padding: 8px 16px;
        font-size: 11px;
      }
      .classification-bar { font-size: 7px; letter-spacing: 2px; padding: 2px 0; }

      .dashboard {
        grid-template-columns: 1fr;
        padding-bottom: calc(60px + env(safe-area-inset-bottom, 0));
      }

      .briefing-panel .panel-header { padding: 8px 12px; }
      .briefing-content { padding: 12px 14px; font-size: 11px; max-height: 250px; }

      .tldr-banner { padding: 8px 12px; gap: 10px; }
      .tldr-text { font-size: 11px; }

      .ticker-banner { height: 26px; }
      .ticker-item { font-size: 10px; padding: 0 16px; }
      .ticker-label { font-size: 8px; padding: 0 8px; }

      .topic-bar {
        padding: 0 8px;
        gap: 2px;
        -webkit-overflow-scrolling: touch;
      }
      .topic-btn {
        padding: 8px 12px;
        font-size: 9px;
        min-height: 36px;
      }
      .topic-label { padding: 8px 8px 8px 0; font-size: 8px; }

      .feed-tabs {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .feed-tab {
        padding: 10px 12px;
        font-size: 10px;
        white-space: nowrap;
        min-height: 42px;
      }

      /* News cards — bigger touch targets */
      .news-card {
        padding: 14px 14px;
        min-height: 60px;
      }
      .card-title { font-size: 13px; line-height: 1.4; }
      .card-desc { font-size: 11px; }
      .card-meta { margin-bottom: 6px; }
      .source-icon { width: 24px; height: 24px; font-size: 9px; }
      .card-tags { gap: 6px; }
      .tag { padding: 3px 10px; font-size: 9px; }

      /* Sidebar becomes full-screen on mobile */
      .sidebar {
        border-left: none;
        border-top: 1px solid var(--border-dim);
        min-height: 0;
      }

      /* X feed mobile — full height iframe */
      .x-feed-panel {
        min-height: calc(100vh - 180px);
      }
      .x-live-iframe {
        min-height: calc(100vh - 280px);
      }
      .x-search-tabs {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .x-search-tab {
        font-size: 10px;
        padding: 10px 14px;
        min-height: 40px;
      }
      .x-embed-status {
        font-size: 10px;
        padding: 8px 14px;
      }
      .x-iframe-footer {
        position: sticky;
        bottom: 0;
        background: var(--bg-secondary);
      }
      .x-refresh-btn, .x-open-btn {
        min-height: 44px;
        font-size: 11px;
      }
      .x-post {
        padding: 14px 14px;
        font-size: 13px;
        min-height: 50px;
      }
      .x-post-header { gap: 8px; margin-bottom: 8px; }
      .x-post-source { font-size: 11px; }
      .x-post-time { font-size: 10px; }
      .x-post-text { font-size: 13px; line-height: 1.5; }
      .x-post-desc { font-size: 11px; }
      .x-profile-link {
        padding: 14px;
        font-size: 12px;
        min-height: 48px;
      }

      /* Chat panel mobile — full screen when active */
      .chat-panel {
        min-height: 240px;
        max-height: none;
      }
      .chat-panel.mobile-fullscreen {
        min-height: calc(100vh - 180px);
        max-height: none;
      }
      .chat-messages {
        padding: 12px;
        min-height: 120px;
        -webkit-overflow-scrolling: touch;
      }
      .chat-msg {
        font-size: 14px;
        max-width: 85%;
        padding: 10px 14px;
        line-height: 1.6;
      }
      .chat-input {
        font-size: 16px; /* prevent iOS zoom */
        padding: 14px;
        min-height: 48px;
      }
      .chat-send {
        padding: 14px 18px;
        font-size: 12px;
        min-height: 48px;
      }

      /* Footer */
      .footer-bar {
        flex-direction: column;
        gap: 4px;
        text-align: center;
        font-size: 8px;
        padding: 8px 12px;
      }

      /* Show mobile nav */
      .mobile-nav { display: block; }

      /* Mobile panel switching with smooth transitions */
      .mobile-hidden { display: none !important; }

      /* All scrollable areas get momentum scrolling */
      .news-feed,
      .briefing-content,
      .x-feed-content,
      .chat-messages {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: contain;
      }
    }

    /* ======== RESPONSIVE - SMALL MOBILE ======== */
    @media (max-width: 400px) {
      .logo-text h1 { font-size: 11px; letter-spacing: 2px; }
      .status-indicator { font-size: 8px; padding: 6px 10px; min-height: 36px; }
      .ctrl-btn { font-size: 10px; padding: 8px 12px; }
      .timestamp { font-size: 8px; }
      .topic-btn { font-size: 8px; padding: 6px 10px; }
      .x-search-tab { font-size: 9px; padding: 8px 10px; }
      .news-card { padding: 12px; }
      .card-title { font-size: 12px; }
      .mobile-nav-btn { min-height: 52px; font-size: 7px; }
      .mobile-nav-btn .nav-icon { font-size: 18px; }
    }

    /* ======== RESPONSIVE - LANDSCAPE MOBILE ======== */
    @media (max-width: 768px) and (orientation: landscape) {
      .dashboard {
        padding-bottom: calc(50px + env(safe-area-inset-bottom, 0));
      }
      .mobile-nav-btn {
        min-height: 44px;
        padding: 6px 4px;
      }
      .mobile-nav-btn .nav-icon { font-size: 16px; }
      .briefing-content { max-height: 150px; }
      .x-feed-panel { min-height: calc(100vh - 140px); }
    }

    /* ======== TLDR BANNER ======== */
    .tldr-banner {
      grid-column: 1 / -1;
      background: linear-gradient(90deg, var(--bg-secondary), rgba(34, 211, 238, 0.04), var(--bg-secondary));
      border: 1px solid var(--border-dim);
      border-top: none;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .tldr-label {
      padding: 3px 10px;
      background: var(--accent-cyan-dim);
      border: 1px solid rgba(34, 211, 238, 0.2);
      font-size: 9px;
      font-weight: 700;
      color: var(--accent-cyan);
      letter-spacing: 2px;
      text-transform: uppercase;
      flex-shrink: 0;
      font-family: var(--font-mono);
    }

    .tldr-text {
      font-size: 12px;
      color: var(--text-secondary);
      font-family: var(--font-sans);
      line-height: 1.5;
      flex: 1;
    }

    .tldr-text strong { color: var(--accent-cyan); }

    /* ======== LIVE TICKER BANNER ======== */
    .ticker-banner {
      grid-column: 1 / -1;
      background: var(--accent-red-dim);
      border: 1px solid rgba(229, 62, 62, 0.2);
      border-top: none;
      overflow: hidden;
      position: relative;
      height: 28px;
    }

    .ticker-label {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background: var(--accent-red);
      color: white;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      z-index: 2;
      font-family: var(--font-mono);
    }

    .ticker-label .blink-dot {
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
      margin-right: 8px;
      animation: blink 1s infinite;
    }

    .ticker-track {
      display: flex;
      align-items: center;
      height: 100%;
      padding-left: 120px;
      animation: tickerScroll var(--ticker-duration, 30s) linear infinite;
      white-space: nowrap;
    }

    .ticker-item {
      font-size: 11px;
      color: var(--text-primary);
      font-family: var(--font-sans);
      padding: 0 24px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .ticker-item .sep {
      color: var(--accent-red);
      font-weight: 700;
    }

    .ticker-item .ticker-source {
      font-size: 9px;
      color: var(--accent-amber);
      font-family: var(--font-mono);
      letter-spacing: 1px;
    }

    @keyframes tickerScroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* ======== SCROLLBAR GLOBAL ======== */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg-void); }
    ::-webkit-scrollbar-thumb { background: var(--border-dim); }
    ::-webkit-scrollbar-thumb:hover { background: var(--border-mid); }
  </style>
</head>
<body>
  <div class="bg-grid"></div>
  <div class="scanline"></div>

  <div class="classification-bar">UNCLASSIFIED // OSINT AGGREGATION // FOR INFORMATIONAL PURPOSES ONLY</div>

  <header>
    <div class="header-main">
      <div class="logo-block">
        <div class="logo-hex">IW</div>
        <div class="logo-text">
          <h1>IRAN WATCHER</h1>
          <div class="subtitle">y12.ai // OSINT MONITOR</div>
        </div>
      </div>

      <div class="header-stats">
        <div class="stat-cell">
          <span class="stat-label">Status</span>
          <span class="stat-value" id="threatLevel">ACTIVE</span>
        </div>
        <div class="stat-cell">
          <span class="stat-label">Sources</span>
          <span class="stat-value" id="sourceCount">0</span>
        </div>
        <div class="stat-cell">
          <span class="stat-label">Items</span>
          <span class="stat-value" id="itemCount">0</span>
        </div>
        <div class="stat-cell">
          <span class="stat-label">Updated</span>
          <span class="stat-value" id="lastUpdatedStat">--:--</span>
        </div>
      </div>

      <div class="header-controls">
        <div class="status-indicator">
          <span class="status-dot"></span>
          LIVE
        </div>
        <button class="ctrl-btn" onclick="refreshData()">&#8635; REFRESH</button>
        <span class="timestamp" id="lastUpdated">AWAITING DATA...</span>
      </div>
    </div>
  </header>

  <div class="dashboard">
    <!-- AI BRIEFING -->
    <div class="panel briefing-panel">
      <div class="panel-header">
        <div class="panel-title"><span class="dot"></span> INTELLIGENCE BRIEFING</div>
        <span class="panel-badge">y12.ai</span>
      </div>
      <div class="briefing-content" id="summaryContent">
        <div class="briefing-loading">
          <div class="spinner"></div>
          Generating AI intelligence briefing...
        </div>
      </div>
    </div>

    <!-- TLDR BANNER -->
    <div class="tldr-banner" id="tldrBanner">
      <span class="tldr-label">TL;DR</span>
      <div class="tldr-text" id="tldrText">
        <strong>IRAN WATCHER</strong> is a real-time OSINT intelligence dashboard tracking Iran-US conflict developments. It aggregates official news (Reuters, BBC, Al Jazeera, AP, Guardian), Google News, and X/Twitter feeds, then uses AI to generate threat assessments and intelligence briefings. Filter by topic, chat with the AI analyst, and monitor live X feeds &mdash; powered by <strong>y12.ai</strong>.
      </div>
    </div>

    <!-- LIVE TICKER -->
    <div class="ticker-banner" id="tickerBanner">
      <div class="ticker-label"><span class="blink-dot"></span>BREAKING</div>
      <div class="ticker-track" id="tickerTrack">
        <span class="ticker-item">Awaiting real-time updates...</span>
      </div>
    </div>

    <!-- TOPIC FILTER BAR -->
    <div class="topic-bar" id="topicBar">
      <span class="topic-label">Filter</span>
      <button class="topic-btn active" data-topic="all" onclick="filterTopic('all')">ALL</button>
      <button class="topic-btn" data-topic="military" onclick="filterTopic('military')">MILITARY</button>
      <button class="topic-btn" data-topic="nuclear" onclick="filterTopic('nuclear')">NUCLEAR</button>
      <button class="topic-btn" data-topic="diplomacy" onclick="filterTopic('diplomacy')">DIPLOMACY</button>
      <button class="topic-btn" data-topic="sanctions" onclick="filterTopic('sanctions')">SANCTIONS</button>
      <button class="topic-btn" data-topic="proxy" onclick="filterTopic('proxy')">PROXY FORCES</button>
      <button class="topic-btn" data-topic="maritime" onclick="filterTopic('maritime')">MARITIME</button>
      <button class="topic-btn" data-topic="energy" onclick="filterTopic('energy')">ENERGY</button>
    </div>

    <!-- LIVE CAMERAS -->
    <div class="panel cams-panel" id="camsPanel">
      <div class="panel-header">
        <div class="panel-title"><span class="cam-live-dot"></span> LIVE CAMERAS</div>
        <span class="panel-badge" style="background:var(--accent-red-dim);color:var(--accent-red);border-color:rgba(229,62,62,0.25)">LIVE FEED</span>
      </div>
      <div class="cams-tabs" id="camsTabs"></div>
      <div class="cams-content" id="camsContent">
        <div class="cam-placeholder">
          <div class="cam-placeholder-icon">&#9673;</div>
          <div class="cam-placeholder-text">Loading camera feeds...</div>
        </div>
      </div>
      <div class="cam-status-bar">
        <span>y12.ai SURVEILLANCE GRID // AUTO-REFRESH 5 MIN</span>
        <button class="cam-fullscreen-btn" onclick="toggleCamLayout()">&#9633; EXPAND</button>
      </div>
    </div>

    <!-- LEFT: NEWS FEED -->
    <div class="panel feed-area">
      <div class="feed-tabs">
        <button class="feed-tab active" data-tab="all" onclick="switchTab('all')">
          ALL <span class="tab-count" id="countAll">0</span>
        </button>
        <button class="feed-tab" data-tab="official" onclick="switchTab('official')">
          OFFICIAL <span class="tab-count" id="countOfficial">0</span>
        </button>
        <button class="feed-tab" data-tab="unofficial" onclick="switchTab('unofficial')">
          SIGINT / X <span class="tab-count" id="countUnofficial">0</span>
        </button>
      </div>
      <div class="news-feed" id="newsFeed">
        <div class="briefing-loading">
          <div class="spinner"></div>
          Loading intelligence feeds...
        </div>
      </div>
    </div>

    <!-- RIGHT SIDEBAR -->
    <div class="sidebar">
      <!-- X/Twitter Embedded Feed -->
      <div class="panel x-feed-panel">
        <div class="panel-header">
          <div class="panel-title"><span class="dot" style="background:#1d9bf0"></span> X / TWITTER FEED</div>
          <span class="panel-badge" style="background:rgba(29,155,240,0.1);color:#1d9bf0;border-color:rgba(29,155,240,0.2)">LIVE FEED</span>
        </div>
        <div class="x-search-tabs" id="xSearchTabs"></div>
        <div class="x-feed-content" id="xFeedContent">
          <div class="briefing-loading">
            <div class="spinner"></div>
            Connecting to X feeds...
          </div>
        </div>
      </div>

      <!-- AI Chat -->
      <div class="panel chat-panel" id="chatPanel">
        <div class="panel-header" onclick="toggleChat()">
          <div class="panel-title"><span class="dot" style="background:var(--accent-purple)"></span> y12.ai ANALYST</div>
          <span class="panel-badge">y12.ai</span>
        </div>
        <div class="chat-messages" id="chatMessages">
          <div class="chat-msg system">y12.ai analyst ready. Ask about the briefing or current events.</div>
        </div>
        <div class="chat-input-area">
          <input type="text" class="chat-input" id="chatInput" placeholder="Ask y12.ai analyst..." onkeydown="if(event.key==='Enter')sendChat()" />
          <button class="chat-send" id="chatSend" onclick="sendChat()">SEND</button>
        </div>
      </div>
    </div>

    <!-- PULL TO REFRESH INDICATOR -->
    <div class="pull-indicator" id="pullIndicator"></div>

    <!-- MOBILE BOTTOM NAV -->
    <nav class="mobile-nav">
      <div class="mobile-nav-inner">
        <button class="mobile-nav-btn active" onclick="mobileSwitch('feed')" data-panel="feed">
          <span class="nav-icon">&#9776;</span>
          FEED
        </button>
        <button class="mobile-nav-btn" onclick="mobileSwitch('cams')" data-panel="cams">
          <span class="nav-icon">&#9673;</span>
          CAMS
        </button>
        <button class="mobile-nav-btn" onclick="mobileSwitch('xfeed')" data-panel="xfeed">
          <span class="nav-icon">&#120143;</span>
          X LIVE
        </button>
        <button class="mobile-nav-btn" onclick="mobileSwitch('chat')" data-panel="chat">
          <span class="nav-icon">&#9993;</span>
          INTEL AI
        </button>
        <button class="mobile-nav-btn" onclick="mobileSwitch('brief')" data-panel="brief">
          <span class="nav-icon">&#9733;</span>
          BRIEF
        </button>
      </div>
    </nav>

    <!-- FOOTER -->
    <div class="footer-bar">
      <span>IRAN WATCHER v2.0 // Powered by <a href="https://y12.ai" target="_blank" rel="noopener noreferrer">y12.ai</a></span>
      <span>OSINT ONLY // NOT INTELLIGENCE PRODUCT</span>
    </div>
  </div>

  <script>
    // ========================================================================
    // STATE
    // ========================================================================
    let newsData = { official: [], unofficial: [] };
    let currentTab = 'all';
    let currentTopic = 'all';
    let chatHistory = [];

    const TOPIC_KEYWORDS = {
      military: ['military', 'irgc', 'revolutionary guard', 'missile', 'drone', 'strike', 'attack', 'air defense', 'ballistic', 'cruise missile', 'quds force', 'armed forces', 'army', 'navy', 'aircraft', 'weapon'],
      nuclear: ['nuclear', 'enrichment', 'uranium', 'centrifuge', 'jcpoa', 'nuclear deal', 'iaea', 'atomic energy', 'plutonium', 'reactor', 'fordow', 'natanz'],
      diplomacy: ['diplomatic', 'negotiation', 'talks', 'ambassador', 'un security', 'united nations', 'foreign minister', 'summit', 'treaty', 'accord', 'dialogue', 'envoy'],
      sanctions: ['sanctions', 'embargo', 'treasury', 'ofac', 'blocked', 'designated', 'restricted', 'economic pressure', 'trade ban'],
      proxy: ['hezbollah', 'houthi', 'proxy', 'militia', 'axis of resistance', 'pmu', 'hashd', 'kata\\'ib', 'islamic jihad', 'hamas'],
      maritime: ['strait of hormuz', 'persian gulf', 'oil tanker', 'shipping lane', 'red sea', 'naval', 'maritime', 'vessel', 'cargo ship', 'piracy', 'seizure'],
      energy: ['oil', 'petroleum', 'opec', 'crude', 'barrel', 'pipeline', 'natural gas', 'energy', 'refinery', 'export'],
    };

    // X/Twitter accounts + search queries for embed tabs
    const X_ACCOUNTS = [
      { label: '@IranIntl', handle: 'IranIntl', type: 'account' },
      { label: '@IranWire', handle: 'IranWireEnglish', type: 'account' },
      { label: '@ABORACIR', handle: 'ABORACIR', type: 'account' },
      { label: 'Iran+US', query: 'iran US conflict', type: 'search' },
      { label: 'IRGC', query: 'IRGC attack OR IRGC news', type: 'search' },
      { label: 'Nuclear', query: 'iran nuclear program', type: 'search' },
    ];

    // ========================================================================
    // INIT
    // ========================================================================
    document.addEventListener('DOMContentLoaded', () => {
      loadNews();
      buildXSearchTabs();
    });

    // Primary refresh interval (overridden by 2-min X feed interval below)

    // ========================================================================
    // NEWS LOADING
    // ========================================================================
    async function loadNews() {
      try {
        const res = await fetch('/api/news');
        const data = await res.json();

        if (data.success) {
          newsData = data.news;
          renderSummary(data.summary);
          renderFeed();
          renderXFeed();
          renderTicker();
          updateTldr(data.summary);
          updateStats(data);
          updateTimestamp(data.lastUpdated);
        } else {
          showError('Failed to load: ' + (data.error || 'Unknown'));
        }
      } catch (err) {
        showError('Network error');
        setTimeout(loadNews, 30000);
      }
    }

    async function refreshData() {
      const btn = document.querySelector('.ctrl-btn');
      btn.classList.add('loading');
      btn.textContent = 'REFRESHING...';
      try {
        await fetch('/api/refresh');
        await loadNews();
      } catch (err) {
        showError('Refresh failed');
      } finally {
        btn.classList.remove('loading');
        btn.innerHTML = '&#8635; REFRESH';
      }
    }

    // ========================================================================
    // STATS HEADER
    // ========================================================================
    function updateStats(data) {
      const all = [...(newsData.official || []), ...(newsData.unofficial || [])];
      const sources = new Set(all.map(i => i.source));
      document.getElementById('sourceCount').textContent = sources.size;
      document.getElementById('itemCount').textContent = all.length;

      // Extract threat level from summary
      const summary = data.summary || '';
      const el = document.getElementById('threatLevel');
      if (summary.includes('CRITICAL')) { el.textContent = 'CRITICAL'; el.className = 'stat-value threat-critical'; }
      else if (summary.includes('HIGH')) { el.textContent = 'HIGH'; el.className = 'stat-value threat-high'; }
      else if (summary.includes('ELEVATED')) { el.textContent = 'ELEVATED'; el.className = 'stat-value threat-elevated'; }
      else if (summary.includes('LOW')) { el.textContent = 'LOW'; el.className = 'stat-value threat-low'; }
      else { el.textContent = 'ACTIVE'; el.className = 'stat-value'; }
    }

    // ========================================================================
    // AI BRIEFING
    // ========================================================================
    function renderSummary(summary) {
      const el = document.getElementById('summaryContent');
      if (!summary) {
        el.innerHTML = '<div class="briefing-loading"><div class="spinner"></div>Generating AI intelligence briefing...</div>';
        return;
      }

      let html = summary
        .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/^- /gm, '&bull; ')
        .replace(/\\n/g, '<br>');

      html = html.replace(/CRITICAL/g, '<span style="color:var(--threat-critical);font-weight:700">CRITICAL</span>');
      html = html.replace(/HIGH/g, '<span style="color:var(--threat-high);font-weight:700">HIGH</span>');
      html = html.replace(/ELEVATED/g, '<span style="color:var(--threat-elevated);font-weight:700">ELEVATED</span>');
      html = html.replace(/LOW/g, '<span style="color:var(--threat-low);font-weight:700">LOW</span>');
      html = html.replace(/MONITORING/g, '<span style="color:var(--accent-cyan);font-weight:700">MONITORING</span>');

      el.innerHTML = html;
    }

    // ========================================================================
    // TOPIC FILTERING
    // ========================================================================
    function matchesTopic(item, topic) {
      if (topic === 'all') return true;
      const keywords = TOPIC_KEYWORDS[topic] || [];
      const text = ((item.title || '') + ' ' + (item.description || '')).toLowerCase();
      return keywords.some(k => text.includes(k));
    }

    function filterTopic(topic) {
      currentTopic = topic;
      document.querySelectorAll('.topic-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.topic === topic);
      });
      renderFeed();
    }

    // ========================================================================
    // NEWS FEED RENDERING
    // ========================================================================
    function renderFeed() {
      const feed = document.getElementById('newsFeed');
      let items = [];

      if (currentTab === 'all' || currentTab === 'official') {
        items = items.concat(newsData.official || []);
      }
      if (currentTab === 'all' || currentTab === 'unofficial') {
        items = items.concat(newsData.unofficial || []);
      }

      // Apply topic filter
      items = items.filter(item => matchesTopic(item, currentTopic));

      items.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Update counts (unfiltered)
      const allItems = [...(newsData.official || []), ...(newsData.unofficial || [])];
      document.getElementById('countAll').textContent = allItems.filter(i => matchesTopic(i, currentTopic)).length;
      document.getElementById('countOfficial').textContent = (newsData.official || []).filter(i => matchesTopic(i, currentTopic)).length;
      document.getElementById('countUnofficial').textContent = (newsData.unofficial || []).filter(i => matchesTopic(i, currentTopic)).length;

      if (items.length === 0) {
        feed.innerHTML = '<div class="empty-state"><h3>NO ITEMS MATCHING FILTER</h3><p>Adjust topic or tab filters to view intelligence items.</p></div>';
        return;
      }

      feed.innerHTML = items.map(item => {
        const iconLabel = getIconLabel(item.icon);
        const cardClass = item.isMonitoring ? 'monitoring' : item.category;
        const tagClass = item.isMonitoring ? 'monitoring-tag' : item.category === 'unofficial' ? 'unofficial-tag' : '';
        const tagLabel = item.isMonitoring ? 'MONITORING' : item.category === 'unofficial' ? 'SIGINT' : 'OSINT';

        // Detect topic for tag
        const topicTag = detectTopic(item);

        return \`
          <a href="\${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="news-card \${cardClass}">
            <div class="card-meta">
              <div class="source-info">
                <div class="source-icon \${item.icon || ''}">\${iconLabel}</div>
                <span class="source-name">\${escapeHtml(item.source)}</span>
              </div>
              <span class="card-time">\${formatTime(item.date)}</span>
            </div>
            <div class="card-title">\${escapeHtml(item.title)}</div>
            \${item.description ? \`<div class="card-desc">\${escapeHtml(item.description).slice(0, 200)}</div>\` : ''}
            <div class="card-tags">
              <span class="tag \${tagClass}">\${tagLabel}</span>
              \${topicTag ? \`<span class="tag topic-tag">\${topicTag}</span>\` : ''}
              \${item.searchQuery ? \`<span class="tag unofficial-tag">\${escapeHtml(item.searchQuery)}</span>\` : ''}
            </div>
          </a>\`;
      }).join('');
    }

    function detectTopic(item) {
      const text = ((item.title || '') + ' ' + (item.description || '')).toLowerCase();
      for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        if (keywords.some(k => text.includes(k))) {
          return topic.toUpperCase();
        }
      }
      return '';
    }

    function switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.feed-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
      });
      renderFeed();
    }

    // ========================================================================
    // X / TWITTER FEED — JSON API + card-based rendering (no iframes)
    // ========================================================================
    let currentXTab = 0;
    let xAutoRefreshTimer = null;

    function buildXSearchTabs() {
      const container = document.getElementById('xSearchTabs');
      container.innerHTML = X_ACCOUNTS.map((item, i) =>
        \`<button class="x-search-tab \${i === 0 ? 'active' : ''}" onclick="switchXTab(\${i})">\${escapeHtml(item.label)}</button>\`
      ).join('');
      renderXEmbed(0);
    }

    function switchXTab(idx) {
      currentXTab = idx;
      document.querySelectorAll('.x-search-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
      renderXEmbed(idx);
    }

    function renderXEmbed(idx) {
      const container = document.getElementById('xFeedContent');
      const item = X_ACCOUNTS[idx];

      if (xAutoRefreshTimer) clearInterval(xAutoRefreshTimer);

      const statusLabel = item.type === 'account'
        ? \`LIVE TIMELINE — @\${item.handle.toUpperCase()}\`
        : \`LIVE SEARCH — "\${escapeHtml(item.query).toUpperCase()}"\`;

      const openUrl = item.type === 'account'
        ? \`https://x.com/\${item.handle}\`
        : \`https://x.com/search?q=\${encodeURIComponent(item.query)}&f=live\`;

      container.innerHTML = \`
        <div class="x-embed-status" id="xEmbedStatus">
          <span class="status-dot" style="width:5px;height:5px;background:#1d9bf0;border-radius:50%;animation:blink 2s infinite;"></span>
          <span>\${statusLabel}</span>
          <span style="margin-left:auto;font-size:8px;opacity:0.6;" id="xRefreshTime">LOADING...</span>
        </div>
        <div class="x-feed-items" id="xFeedItems" style="flex:1;overflow-y:auto;">
          <div class="briefing-loading"><div class="spinner"></div>Fetching X posts...</div>
        </div>
        <div class="x-iframe-footer">
          <button class="x-refresh-btn" onclick="loadXFeedData(\${idx})">&#8635; REFRESH</button>
          <a href="\${openUrl}" target="_blank" rel="noopener noreferrer" class="x-open-btn">OPEN ON X &rarr;</a>
        </div>\`;

      loadXFeedData(idx);
      xAutoRefreshTimer = setInterval(() => loadXFeedData(idx), 2 * 60 * 1000);
    }

    async function loadXFeedData(idx) {
      const item = X_ACCOUNTS[idx];
      const itemsContainer = document.getElementById('xFeedItems');
      const timeEl = document.getElementById('xRefreshTime');
      const statusEl = document.getElementById('xEmbedStatus');

      if (!itemsContainer) return;
      if (timeEl) timeEl.textContent = 'FETCHING...';

      try {
        const url = item.type === 'account'
          ? \`/api/x-timeline/\${encodeURIComponent(item.handle)}\`
          : \`/api/x-search/\${encodeURIComponent(item.query)}\`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.tweets && data.tweets.length > 0) {
          itemsContainer.innerHTML = data.tweets.map(tweet => \`
            <a href="\${escapeHtml(tweet.url)}" target="_blank" rel="noopener noreferrer" class="x-post">
              <div class="x-post-header">
                <span class="x-post-source">@\${escapeHtml(tweet.handle || tweet.author || '')}</span>
                <span class="x-post-time">\${formatTime(tweet.date)}</span>
              </div>
              <div class="x-post-text">\${escapeHtml(tweet.text)}</div>
              \${tweet.media ? \`<img src="\${escapeHtml(tweet.media)}" style="max-width:100%;border-radius:8px;margin-top:8px;" onerror="this.style.display='none'">\` : ''}
            </a>
          \`).join('');

          if (timeEl) timeEl.textContent = 'UPDATED ' + new Date().toLocaleTimeString('en-US', { hour12: false });
          if (statusEl) {
            const dot = statusEl.querySelector('.status-dot');
            if (dot) dot.style.background = 'var(--accent-green)';
          }
        } else {
          // No tweets from API — show RSS fallback data
          renderXFallbackCards(idx);
        }
      } catch {
        renderXFallbackCards(idx);
      }
    }

    function renderXFallbackCards(idx) {
      const itemsContainer = document.getElementById('xFeedItems');
      const timeEl = document.getElementById('xRefreshTime');
      const statusEl = document.getElementById('xEmbedStatus');
      const item = X_ACCOUNTS[idx];

      if (!itemsContainer) return;

      const unofficial = newsData.unofficial || [];
      let posts;

      if (item.type === 'account') {
        posts = unofficial.filter(p => !p.isMonitoring && (p.handle === item.handle || (p.source && p.source === '@' + item.handle)));
      } else {
        const q = item.query.toLowerCase().split(' OR ')[0].trim();
        posts = unofficial.filter(p => {
          if (p.isMonitoring) return false;
          const text = ((p.title || '') + ' ' + (p.source || '') + ' ' + (p.searchQuery || '')).toLowerCase();
          return text.includes(q) || q.split(' ').some(w => w.length > 3 && text.includes(w));
        });
      }

      if (posts.length > 0) {
        itemsContainer.innerHTML = posts.slice(0, 30).map(post => \`
          <a href="\${escapeHtml(post.link)}" target="_blank" rel="noopener noreferrer" class="x-post">
            <div class="x-post-header">
              <span class="x-post-source">\${escapeHtml(post.source || 'X')}</span>
              <span class="x-post-time">\${formatTime(post.date)}</span>
            </div>
            <div class="x-post-text">\${escapeHtml(post.title)}</div>
            \${post.description && post.description !== post.title ? '<div class="x-post-desc">' + escapeHtml(post.description).slice(0, 250) + '</div>' : ''}
          </a>\`).join('');
      } else {
        itemsContainer.innerHTML = \`
          <div class="x-empty-state">
            <div style="font-size:28px;margin-bottom:10px;opacity:0.2;">&#120143;</div>
            <div>Connecting to X feeds...</div>
            <div style="font-size:10px;margin-top:8px;color:var(--text-muted);">Posts will appear when sources respond</div>
          </div>\`;
      }

      if (timeEl) timeEl.textContent = posts.length > 0 ? 'RSS FALLBACK' : 'WAITING...';
      if (statusEl) {
        const dot = statusEl.querySelector('.status-dot');
        if (dot) dot.style.background = posts.length > 0 ? 'var(--accent-amber)' : 'var(--accent-red)';
      }
    }

    function renderXFeed() {
      // Re-render current tab when news data updates
      loadXFeedData(currentXTab);
    }

    // Refresh news data every 2 minutes for real-time feel
    setInterval(loadNews, 2 * 60 * 1000);

    // ========================================================================
    // LIVE CAMERAS
    // ========================================================================
    // All cameras are embedded — NO external links
    const LIVE_CAMERAS = [
      // ISRAEL — City cameras
      { id: 'i24', label: 'i24 NEWS', region: 'IL', channelId: 'UCvHDpsWKADrDia0c99X37vg', loc: '32.06\u00b0N 34.76\u00b0E // JAFFA PORT', desc: 'Israeli news — Tel Aviv' },
      { id: 'telaviv', label: 'TEL AVIV', region: 'IL', channelId: 'UC1tBnbs03VJ34oLD8cmJSVw', loc: '32.08\u00b0N 34.77\u00b0E // GORDON BEACH', desc: 'Mediterranean coast cam' },
      { id: 'jerusalem', label: 'JERUSALEM', region: 'IL', channelId: 'UC6qrG3W8SMK0jior2olka3g', loc: '31.77\u00b0N 35.23\u00b0E // OLD CITY', desc: 'Western Wall / Kotel' },
      // NEWS — 24/7 broadcasts
      { id: 'aljazeera', label: 'AL JAZEERA', region: 'ME', channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', loc: '25.29\u00b0N 51.53\u00b0E // DOHA', desc: 'Middle East 24/7' },
      { id: 'france24', label: 'FRANCE 24', region: 'INT', channelId: 'UCQfwfsi5VrQ8yKZ-UWmAEFg', loc: '48.85\u00b0N 2.35\u00b0E // PARIS', desc: 'International 24/7' },
      { id: 'sky', label: 'SKY NEWS', region: 'INT', channelId: 'UCoMdktPbSTixAyNGwb-UYkQ', loc: '51.50\u00b0N 0.14\u00b0W // LONDON', desc: 'UK/Global 24/7' },
      { id: 'dw', label: 'DW NEWS', region: 'INT', channelId: 'UCknLrEdhRCp1aegoMqRhGGQ', loc: '52.52\u00b0N 13.40\u00b0E // BERLIN', desc: 'Deutsche Welle 24/7' },
      // DC
      { id: 'dc', label: 'WASH DC', region: 'DC', channelId: null, handle: 'earthTV', loc: '38.89\u00b0N 77.03\u00b0W // WHITE HOUSE', desc: 'Pennsylvania Ave cam' },
    ];

    let activeCams = [0, 1];
    let resolvedVideoIds = {};
    let camLayoutExpanded = false;
    let camClockTimer = null;

    // YouTube embed params that hide all branding/controls
    const YT_PARAMS = 'autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&fs=1&disablekb=0&playsinline=1';

    function buildCamTabs() {
      const container = document.getElementById('camsTabs');
      container.innerHTML = LIVE_CAMERAS.map((cam, i) =>
        \`<button class="cam-tab \${activeCams.includes(i) ? 'active' : ''}" onclick="selectCam(\${i})" data-cam="\${i}">
          \${cam.label}
          <span class="cam-region">\${cam.region}</span>
        </button>\`
      ).join('');
    }

    function selectCam(idx) {
      if (activeCams[0] === idx) return;
      if (activeCams[1] === idx) return;
      if (window.innerWidth <= 768) {
        activeCams = [idx];
      } else {
        activeCams = [idx, activeCams[0]];
      }
      buildCamTabs();
      renderCams();
    }

    function getCamEmbedUrl(cam) {
      // 1. Use resolved video ID if available
      if (cam.channelId && resolvedVideoIds[cam.channelId]) {
        return \`https://www.youtube.com/embed/\${resolvedVideoIds[cam.channelId]}?\${YT_PARAMS}\`;
      }
      // 2. Use resolved handle-based video ID
      if (cam.handle && resolvedVideoIds[cam.handle]) {
        return \`https://www.youtube.com/embed/\${resolvedVideoIds[cam.handle]}?\${YT_PARAMS}\`;
      }
      // 3. Fallback: channel-based live embed
      if (cam.channelId) {
        return \`https://www.youtube.com/embed/live_stream?channel=\${cam.channelId}&\${YT_PARAMS}\`;
      }
      return null;
    }

    function renderCams() {
      const container = document.getElementById('camsContent');
      const camsToShow = window.innerWidth <= 768 ? [activeCams[0]] : activeCams;

      container.innerHTML = camsToShow.map(idx => {
        const cam = LIVE_CAMERAS[idx];
        if (!cam) return '';

        const embedUrl = getCamEmbedUrl(cam);

        if (embedUrl) {
          return \`<div class="cam-embed">
            <div class="cam-embed-header">
              <span class="cam-embed-label"><span class="cam-live-dot"></span>CAM-\${String(idx + 1).padStart(2, '0')} // \${cam.label}</span>
              <span class="cam-embed-region">\${cam.region}</span>
            </div>
            <iframe src="\${embedUrl}" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>
            <div class="cam-embed-footer">
              <span class="cam-embed-loc">\${cam.loc}</span>
              <span class="cam-embed-time cam-clock" data-tz="\${cam.id}">--:--:--</span>
            </div>
          </div>\`;
        }

        // No embed URL — show "acquiring signal" placeholder
        return \`<div class="cam-embed">
          <div class="cam-embed-header">
            <span class="cam-embed-label">CAM-\${String(idx + 1).padStart(2, '0')} // \${cam.label}</span>
            <span class="cam-embed-region">\${cam.region}</span>
          </div>
          <div class="cam-placeholder">
            <div class="cam-placeholder-icon">&#9673;</div>
            <div class="cam-placeholder-text">\${cam.desc}</div>
            <div class="cam-placeholder-sub">ACQUIRING SIGNAL...</div>
          </div>
          <div class="cam-embed-footer">
            <span class="cam-embed-loc">\${cam.loc}</span>
            <span class="cam-embed-time">STANDBY</span>
          </div>
        </div>\`;
      }).join('');

      startCamClocks();
    }

    function startCamClocks() {
      if (camClockTimer) clearInterval(camClockTimer);
      function updateClocks() {
        document.querySelectorAll('.cam-clock').forEach(el => {
          const now = new Date();
          el.textContent = now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC' + (now.getTimezoneOffset() > 0 ? '-' : '+') + Math.abs(now.getTimezoneOffset() / 60);
        });
      }
      updateClocks();
      camClockTimer = setInterval(updateClocks, 1000);
    }

    async function loadLiveCams() {
      try {
        const res = await fetch('/api/live-cams');
        const data = await res.json();
        if (data.success && data.cams) {
          data.cams.forEach(cam => {
            if (cam.videoId && cam.channelId) {
              resolvedVideoIds[cam.channelId] = cam.videoId;
            }
            if (cam.videoId && cam.handle) {
              resolvedVideoIds[cam.handle] = cam.videoId;
            }
          });
          renderCams();
        }
      } catch { /* silent — channel embed fallback still works */ }
    }

    function toggleCamLayout() {
      camLayoutExpanded = !camLayoutExpanded;
      const content = document.getElementById('camsContent');
      const btn = document.querySelector('.cam-fullscreen-btn');
      if (camLayoutExpanded) {
        content.style.minHeight = '500px';
        btn.innerHTML = '&#9632; COLLAPSE';
      } else {
        content.style.minHeight = '';
        btn.innerHTML = '&#9633; EXPAND';
      }
    }

    // Init cams
    buildCamTabs();
    renderCams();
    loadLiveCams();
    setInterval(loadLiveCams, 5 * 60 * 1000);

    // ========================================================================
    // AI CHAT
    // ========================================================================
    function toggleChat() {
      const panel = document.getElementById('chatPanel');
      const msgs = panel.querySelector('.chat-messages');
      const input = panel.querySelector('.chat-input-area');
      if (msgs.style.display === 'none') {
        msgs.style.display = 'flex';
        input.style.display = 'flex';
      } else {
        msgs.style.display = 'none';
        input.style.display = 'none';
      }
    }

    async function sendChat() {
      const input = document.getElementById('chatInput');
      const msg = input.value.trim();
      if (!msg) return;

      input.value = '';
      appendChat('user', msg);
      chatHistory.push({ role: 'user', content: msg });

      // Show typing
      const typingEl = appendTyping();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msg,
            history: chatHistory.slice(-6),
          }),
        });

        const data = await res.json();
        typingEl.remove();

        if (data.success) {
          appendChat('ai', data.response);
          chatHistory.push({ role: 'assistant', content: data.response });
        } else {
          appendChat('system', 'Error: ' + (data.error || 'Failed to get response'));
        }
      } catch (err) {
        typingEl.remove();
        appendChat('system', 'Connection error. Try again.');
      }
    }

    function appendChat(role, text) {
      const container = document.getElementById('chatMessages');
      const div = document.createElement('div');
      div.className = 'chat-msg ' + role;

      if (role === 'ai') {
        div.innerHTML = text
          .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
          .replace(/\\n/g, '<br>');
      } else {
        div.textContent = text;
      }

      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      return div;
    }

    function appendTyping() {
      const container = document.getElementById('chatMessages');
      const div = document.createElement('div');
      div.className = 'chat-typing';
      div.innerHTML = '<div class="dots"><span></span><span></span><span></span></div> Analyzing...';
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      return div;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================
    function getIconLabel(icon) {
      const labels = { reuters: 'R', bbc: 'BB', aljazeera: 'AJ', ap: 'AP', guardian: 'G', google: 'GN', x: 'X' };
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
        if (diffMins < 1) return 'NOW';
        if (diffMins < 60) return diffMins + 'M';
        if (diffHours < 24) return diffHours + 'H';
        if (diffDays < 7) return diffDays + 'D';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch { return ''; }
    }

    function updateTimestamp(isoStr) {
      if (isoStr) {
        const d = new Date(isoStr);
        const time = d.toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('lastUpdated').textContent = 'LAST: ' + time;
        document.getElementById('lastUpdatedStat').textContent = time.slice(0, 5);
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    // ========================================================================
    // LIVE TICKER
    // ========================================================================
    function renderTicker() {
      const track = document.getElementById('tickerTrack');
      const all = [...(newsData.official || []), ...(newsData.unofficial || []).filter(i => !i.isMonitoring)];
      all.sort((a, b) => new Date(b.date) - new Date(a.date));

      const headlines = all.slice(0, 15);
      if (headlines.length === 0) {
        track.innerHTML = '<span class="ticker-item">Monitoring feeds for breaking developments...</span>';
        return;
      }

      // Duplicate items for seamless infinite scroll
      const html = headlines.map(item =>
        \`<span class="ticker-item"><span class="sep">&bull;</span> <span class="ticker-source">\${escapeHtml(item.source)}</span> \${escapeHtml(item.title)}</span>\`
      ).join('');

      track.innerHTML = html + html;

      // Adjust animation speed based on content length
      const duration = Math.max(20, headlines.length * 4);
      track.style.setProperty('--ticker-duration', duration + 's');
      track.style.animationDuration = duration + 's';
    }

    // ========================================================================
    // TLDR UPDATE
    // ========================================================================
    function updateTldr(summary) {
      const el = document.getElementById('tldrText');
      if (!summary) return;

      // Extract the situation overview line for a short TLDR
      const overviewMatch = summary.match(/SITUATION OVERVIEW[:\\s]*([^*]+?)(?=\\*\\*|$)/i);
      const threatMatch = summary.match(/THREAT ASSESSMENT[:\\s]*([^*]+?)(?=\\*\\*|$)/i);

      let tldr = '<strong>IRAN WATCHER</strong> &mdash; ';
      if (threatMatch) {
        const threat = threatMatch[1].trim().replace(/\\n/g, ' ');
        tldr += threat;
      }
      if (overviewMatch) {
        const overview = overviewMatch[1].trim().replace(/\\n/g, ' ');
        tldr += ' ' + overview;
      }

      if (!threatMatch && !overviewMatch) {
        tldr += 'Real-time OSINT intelligence dashboard tracking Iran-US conflict developments across official news, social media, and AI-powered analysis.';
      }

      el.innerHTML = tldr;
    }

    // ========================================================================
    // MOBILE PANEL SWITCHING + GESTURES
    // ========================================================================
    let currentMobilePanel = 'feed';
    const MOBILE_PANELS = ['feed', 'cams', 'xfeed', 'chat', 'brief'];

    function mobileSwitch(panel) {
      if (window.innerWidth > 768) return;
      currentMobilePanel = panel;

      // Update nav buttons
      document.querySelectorAll('.mobile-nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.panel === panel);
      });

      // Get all panel elements
      const feedArea = document.querySelector('.feed-area');
      const sidebar = document.querySelector('.sidebar');
      const briefing = document.querySelector('.briefing-panel');
      const camsPanel = document.getElementById('camsPanel');
      const xPanel = document.querySelector('.x-feed-panel');
      const chatPanel = document.getElementById('chatPanel');
      const topicBar = document.getElementById('topicBar');
      const tldr = document.getElementById('tldrBanner');
      const ticker = document.getElementById('tickerBanner');

      // Hide everything first
      [feedArea, sidebar, briefing, camsPanel, topicBar, tldr, ticker].forEach(el => {
        if (el) el.classList.add('mobile-hidden');
      });
      if (chatPanel) chatPanel.classList.remove('mobile-fullscreen');

      // Show chat elements
      if (chatPanel) {
        const msgs = chatPanel.querySelector('.chat-messages');
        const input = chatPanel.querySelector('.chat-input-area');
        if (msgs) msgs.style.display = 'flex';
        if (input) input.style.display = 'flex';
      }

      switch (panel) {
        case 'feed':
          // Show feed + topic bar + ticker
          if (feedArea) feedArea.classList.remove('mobile-hidden');
          if (topicBar) topicBar.classList.remove('mobile-hidden');
          if (ticker) ticker.classList.remove('mobile-hidden');
          if (sidebar) sidebar.classList.add('mobile-hidden');
          break;

        case 'cams':
          // Show cams panel full-screen
          if (camsPanel) {
            camsPanel.classList.remove('mobile-hidden');
            camsPanel.style.minHeight = 'calc(100vh - 160px)';
            // Re-render with single cam for mobile
            activeCams = [activeCams[0]];
            renderCams();
          }
          break;

        case 'xfeed':
          // Show only X feed panel full-screen
          if (sidebar) sidebar.classList.remove('mobile-hidden');
          if (chatPanel) chatPanel.classList.add('mobile-hidden');
          break;

        case 'chat':
          // Show chat panel full-screen
          if (sidebar) sidebar.classList.remove('mobile-hidden');
          if (xPanel) xPanel.classList.add('mobile-hidden');
          if (chatPanel) {
            chatPanel.classList.add('mobile-fullscreen');
            chatPanel.style.minHeight = 'calc(100vh - 160px)';
            chatPanel.style.maxHeight = 'none';
          }
          setTimeout(() => {
            const input = document.getElementById('chatInput');
            if (input) input.focus();
          }, 150);
          break;

        case 'brief':
          // Show briefing + TLDR
          if (briefing) briefing.classList.remove('mobile-hidden');
          if (tldr) tldr.classList.remove('mobile-hidden');
          break;
      }

      // Reset chat panel size when not chat
      if (panel !== 'chat' && chatPanel) {
        chatPanel.style.minHeight = '';
        chatPanel.style.maxHeight = '';
      }

      // Reset cams panel size when not cams
      if (panel !== 'cams' && camsPanel) {
        camsPanel.style.minHeight = '';
      }

      // Scroll to top of visible content
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ========================================================================
    // MOBILE SWIPE GESTURES
    // ========================================================================
    (function() {
      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartTime = 0;
      const MIN_SWIPE_DIST = 60;
      const MAX_SWIPE_TIME = 400;

      document.addEventListener('touchstart', function(e) {
        if (window.innerWidth > 768) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }, { passive: true });

      document.addEventListener('touchend', function(e) {
        if (window.innerWidth > 768) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const elapsed = Date.now() - touchStartTime;

        // Only horizontal swipes (not vertical scrolling)
        if (elapsed > MAX_SWIPE_TIME) return;
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;
        if (Math.abs(deltaX) < MIN_SWIPE_DIST) return;

        const currentIdx = MOBILE_PANELS.indexOf(currentMobilePanel);
        if (deltaX < 0 && currentIdx < MOBILE_PANELS.length - 1) {
          // Swipe left → next panel
          mobileSwitch(MOBILE_PANELS[currentIdx + 1]);
        } else if (deltaX > 0 && currentIdx > 0) {
          // Swipe right → previous panel
          mobileSwitch(MOBILE_PANELS[currentIdx - 1]);
        }
      }, { passive: true });
    })();

    // ========================================================================
    // PULL TO REFRESH
    // ========================================================================
    (function() {
      let pullStartY = 0;
      let isPulling = false;
      const PULL_THRESHOLD = 80;

      document.addEventListener('touchstart', function(e) {
        if (window.innerWidth > 768) return;
        if (window.scrollY === 0) {
          pullStartY = e.touches[0].clientY;
          isPulling = true;
        }
      }, { passive: true });

      document.addEventListener('touchmove', function(e) {
        if (!isPulling || window.innerWidth > 768) return;
        const deltaY = e.touches[0].clientY - pullStartY;
        const indicator = document.getElementById('pullIndicator');
        if (deltaY > 20 && window.scrollY === 0) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      }, { passive: true });

      document.addEventListener('touchend', function(e) {
        if (!isPulling || window.innerWidth > 768) return;
        const deltaY = e.changedTouches[0].clientY - pullStartY;
        const indicator = document.getElementById('pullIndicator');
        isPulling = false;
        indicator.classList.remove('active');

        if (deltaY > PULL_THRESHOLD && window.scrollY === 0) {
          // Trigger refresh
          indicator.classList.add('active');
          refreshData().finally(() => {
            indicator.classList.remove('active');
          });
        }
      }, { passive: true });
    })();

    function showError(msg) { console.error('[IRAN WATCHER]', msg); }
  </script>
</body>
</html>`;
}
