// ============================================================================
// AI SUMMARIZATION & CHAT - Uses Cloudflare Workers AI
// Generates intelligence briefings and handles real-time analyst chat
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

// Handle real-time chat messages with AI analyst
export async function handleChatMessage(env, message, history, newsData, currentSummary) {
  try {
    // Build context from current news
    let newsContext = '';
    if (newsData) {
      const official = (newsData.official || []).slice(0, 10);
      const unofficial = (newsData.unofficial || []).filter(i => !i.isMonitoring).slice(0, 5);

      if (official.length > 0) {
        newsContext += 'CURRENT NEWS HEADLINES:\n' +
          official.map(i => `- [${i.source}] ${i.title}`).join('\n') + '\n\n';
      }
      if (unofficial.length > 0) {
        newsContext += 'SOCIAL MEDIA POSTS:\n' +
          unofficial.map(i => `- ${i.title}`).join('\n') + '\n\n';
      }
    }

    if (currentSummary) {
      newsContext += 'CURRENT INTELLIGENCE BRIEFING:\n' + currentSummary + '\n\n';
    }

    const systemPrompt = `You are an AI intelligence analyst embedded in the IRAN WATCHER monitoring system. You have access to real-time OSINT data about Iran-US relations and Middle East geopolitics.

${newsContext}

Rules:
- Answer questions based on the current news data and briefing above
- Be concise (2-4 sentences unless asked for detail)
- Stay factual — cite specific headlines when possible
- If asked about something not in the data, say so
- Use intelligence analyst tone — professional, precise
- You can discuss topics like: military posture, nuclear program, sanctions, diplomacy, proxy forces, maritime security, energy`;

    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last few exchanges)
    for (const entry of history.slice(-6)) {
      if (entry.role === 'user' || entry.role === 'assistant') {
        messages.push({ role: entry.role, content: entry.content });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 512,
      temperature: 0.4,
    });

    if (response && response.response) {
      return response.response;
    }

    return 'Unable to generate response. Please try again.';
  } catch (err) {
    console.error('Chat AI error:', err);
    return 'Analysis system temporarily unavailable. Please try again.';
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
