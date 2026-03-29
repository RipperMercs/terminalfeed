// Cloudflare Pages Function — scrapes GitHub trending repos and returns structured data
// Caches results for 5 minutes at the edge to avoid hitting GitHub too frequently

interface TrendingRepo {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  todayStars: number;
  url: string;
}

function parseNumber(text: string): number {
  const cleaned = text.replace(/,/g, '').trim();
  if (cleaned.includes('k')) {
    return Math.round(parseFloat(cleaned) * 1000);
  }
  return parseInt(cleaned, 10) || 0;
}

function extractTrendingRepos(html: string): TrendingRepo[] {
  const repos: TrendingRepo[] = [];
  // Each trending repo is in an <article> element
  const articleRegex = /<article[^>]*class="Box-row"[^>]*>([\s\S]*?)<\/article>/gi;
  let match;

  while ((match = articleRegex.exec(html)) !== null && repos.length < 15) {
    const block = match[1];

    // Repo name: <h2> with an <a> containing "/owner/repo"
    const nameMatch = block.match(/href="\/([^"]+?)"\s/);
    if (!nameMatch) continue;
    const fullName = nameMatch[1].trim().replace(/\s+/g, '');

    // Description
    const descMatch = block.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    const description = descMatch
      ? descMatch[1].replace(/<[^>]+>/g, '').trim()
      : '';

    // Language
    const langMatch = block.match(/itemprop="programmingLanguage"[^>]*>([^<]+)</);
    const language = langMatch ? langMatch[1].trim() : '';

    // Stars total
    const starsMatch = block.match(/href="\/[^"]*\/stargazers"[^>]*>\s*([\d,\.k]+)\s*</i);
    const stars = starsMatch ? parseNumber(starsMatch[1]) : 0;

    // Forks
    const forksMatch = block.match(/href="\/[^"]*\/forks"[^>]*>\s*([\d,\.k]+)\s*</i);
    const forks = forksMatch ? parseNumber(forksMatch[1]) : 0;

    // Today's stars
    const todayMatch = block.match(/([\d,]+)\s*stars?\s*today/i);
    const todayStars = todayMatch ? parseNumber(todayMatch[1]) : 0;

    repos.push({
      name: fullName,
      description,
      language,
      stars,
      forks,
      todayStars,
      url: `https://github.com/${fullName}`,
    });
  }

  return repos;
}

export const onRequestGet: PagesFunction = async (context) => {
  const cacheHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300, s-maxage=300',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const res = await fetch('https://github.com/trending', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TerminalFeed/1.0)',
        'Accept': 'text/html',
      },
    });

    if (!res.ok) {
      throw new Error(`GitHub returned ${res.status}`);
    }

    const html = await res.text();
    const repos = extractTrendingRepos(html);

    if (repos.length === 0) {
      throw new Error('No repos parsed from GitHub trending');
    }

    return new Response(
      JSON.stringify({
        source: 'terminalfeed',
        endpoint: 'github-trending',
        updated_at: new Date().toISOString(),
        data: repos,
      }),
      { headers: cacheHeaders }
    );
  } catch (err) {
    // Fallback: return curated static data so consumers never get an empty response
    const fallback: TrendingRepo[] = [
      { name: 'anthropics/claude-code', description: 'Official CLI for Claude. Agentic coding in your terminal.', language: 'TypeScript', stars: 48200, forks: 3100, todayStars: 0, url: 'https://github.com/anthropics/claude-code' },
      { name: 'vllm-project/vllm', description: 'High-throughput inference engine for LLMs.', language: 'Python', stars: 52100, forks: 8200, todayStars: 0, url: 'https://github.com/vllm-project/vllm' },
      { name: 'huggingface/transformers', description: 'State-of-the-art ML for PyTorch, TensorFlow, and JAX.', language: 'Python', stars: 142000, forks: 28400, todayStars: 0, url: 'https://github.com/huggingface/transformers' },
      { name: 'langchain-ai/langchain', description: 'Build context-aware reasoning applications.', language: 'Python', stars: 102000, forks: 16200, todayStars: 0, url: 'https://github.com/langchain-ai/langchain' },
      { name: 'ollama/ollama', description: 'Get up and running with large language models locally.', language: 'Go', stars: 120000, forks: 9100, todayStars: 0, url: 'https://github.com/ollama/ollama' },
      { name: 'openai/openai-python', description: 'The official Python library for the OpenAI API.', language: 'Python', stars: 25800, forks: 3600, todayStars: 0, url: 'https://github.com/openai/openai-python' },
    ];

    return new Response(
      JSON.stringify({
        source: 'terminalfeed',
        endpoint: 'github-trending',
        updated_at: new Date().toISOString(),
        data: fallback,
      }),
      { headers: cacheHeaders }
    );
  }
};
