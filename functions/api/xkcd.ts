// Cloudflare Pages Function — proxies XKCD JSON API to avoid CORS issues
export const onRequestGet: PagesFunction = async () => {
  try {
    const res = await fetch('https://xkcd.com/info.0.json', {
      headers: { 'User-Agent': 'TerminalFeed/1.0' },
    });
    if (!res.ok) return new Response('Upstream error', { status: res.status });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return new Response('Failed to fetch XKCD', { status: 502 });
  }
};
