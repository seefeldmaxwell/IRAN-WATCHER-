// ============================================================================
// AI SUMMARIZATION - Uses Cloudflare Workers AI (via AI Gateway)
// Generates an intelligence-style briefing from collected news
// ============================================================================

export async function generateSummary(env, news) {
  try {
    const officialItems = (news.official || []).slice(0, 20);
    const unofficialItems = (news.unofficial || []).filter(i => !i.isMonitoring).slice(0, 10);

    if (officialItems.length === 0 && unofficialItems.length === 0) {
      return getDefaultSummary();
    }

    const headlines = officialItems
      .map((item, i) => `${i + 1}. [${item.source}] ${item.title}`)
      .join('\n');

    const socialPosts = unofficialItems
      .map((item, i) => `${i + 1}. ${item.title}`)
      .join('\n');

    const prompt = `You are a senior geopolitical intelligence analyst specializing in Iran-US relations and Middle East security.

Analyze the following news headlines and social media posts about Iran and provide a concise intelligence briefing.

OFFICIAL NEWS SOURCES:
${headlines || 'No official news items available at this time.'}

SOCIAL MEDIA / UNOFFICIAL CHANNELS:
${socialPosts || 'No significant social media activity detected.'}

Provide your analysis in this exact format:

**THREAT ASSESSMENT:** [LOW / ELEVATED / HIGH / CRITICAL] - One sentence on current threat level.

**SITUATION OVERVIEW:** 2-3 sentences summarizing the current state of Iran-US tensions and key developments.

**KEY DEVELOPMENTS:**
- Bullet point 1
- Bullet point 2
- Bullet point 3 (up to 5 max)

**IRAN MILITARY POSTURE:** 1-2 sentences on any military movements, IRGC activity, or proxy force actions.

**DIPLOMATIC STATUS:** 1-2 sentences on negotiations, sanctions, or diplomatic channels.

**SOCIAL MEDIA SENTIMENT:** 1 sentence on what unofficial channels are reporting.

**OUTLOOK:** 1-2 sentences on what to watch for in the next 24-48 hours.

Keep it factual, concise, and intelligence-focused. Do not speculate beyond what the headlines suggest.`;

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a senior geopolitical intelligence analyst. Provide factual, concise intelligence briefings based on the provided source material. Never fabricate information.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    });

    if (response && response.response) {
      return response.response;
    }

    return getDefaultSummary();
  } catch (err) {
    console.error('AI summarization error:', err);
    return getDefaultSummary();
  }
}

function getDefaultSummary() {
  return `**THREAT ASSESSMENT:** MONITORING - Collecting data from news sources.

**SITUATION OVERVIEW:** The Iran Watcher system is actively monitoring official and unofficial news channels for developments in Iran-US relations. The AI summary will be generated once sufficient news data has been collected from RSS feeds and social media monitors.

**KEY DEVELOPMENTS:**
- System is actively polling official news sources (Reuters, BBC, Al Jazeera, AP, The Guardian)
- X/Twitter monitoring is scanning for conflict-related keywords
- Google News aggregation is searching for Iran-specific reporting

**OUTLOOK:** Check back shortly for a full intelligence briefing once news sources have been aggregated.`;
}
