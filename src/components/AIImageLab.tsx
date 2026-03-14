import { useState, useCallback, useRef } from 'react';

const PROMPTS: Record<string, string[]> = {
  cyber: [
    "neon-lit Tokyo alley at midnight, rain reflections, cyberpunk",
    "holographic billboards above a foggy cityscape",
    "cyberpunk hacker desk with glowing monitors and code",
    "android sitting in a ramen shop, blade runner vibes",
  ],
  space: [
    "astronaut floating above earth at golden hour",
    "alien landscape with two moons and crystal formations",
    "space station interior with holographic displays",
    "nebula swirling around a dying star, deep space",
  ],
  fantasy: [
    "ancient dragon perched on a ruined castle at sunset",
    "enchanted forest with bioluminescent mushrooms",
    "floating islands connected by chain bridges",
    "wizard tower during a lightning storm",
  ],
  abstract: [
    "fractals made of liquid gold and mercury",
    "quantum foam at planck scale, artistic visualization",
    "data streams visualized as flowing neon particles",
    "synaptic networks as glowing threads in darkness",
  ],
  nature: [
    "bioluminescent ocean waves at midnight",
    "aurora borealis over a frozen waterfall iceland",
    "macro morning dew on spider web with bokeh",
    "volcanic lightning eruption at dusk",
  ],
  retro: [
    "retro computer terminal green phosphor glow dark room",
    "80s arcade at night neon lights pixel art",
    "synthwave sunset over a grid landscape",
    "vintage space mission control room analog displays",
  ],
};

const ALL_PROMPTS = Object.values(PROMPTS).flat();

function dailySeed(): number {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash << 5) - hash + today.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function AIImageLab() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(() => {
    const seed = dailySeed();
    const p = ALL_PROMPTS[seed % ALL_PROMPTS.length];
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=512&height=512&seed=${seed}&model=flux`;
  });
  const [loading, setLoading] = useState(false);
  const [displayPrompt, setDisplayPrompt] = useState(() => {
    const seed = dailySeed();
    return ALL_PROMPTS[seed % ALL_PROMPTS.length];
  });
  const cooldownRef = useRef(false);

  const generate = useCallback((p: string) => {
    if (cooldownRef.current || !p.trim()) return;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 3000);

    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p.trim())}?width=512&height=512&seed=${seed}&model=flux`;
    setDisplayPrompt(p.trim());
    setLoading(true);
    setImageUrl(url);
  }, []);

  const randomGenerate = useCallback((category?: string) => {
    const pool = category && PROMPTS[category] ? PROMPTS[category] : ALL_PROMPTS;
    const p = pool[Math.floor(Math.random() * pool.length)];
    setPrompt(p);
    generate(p);
  }, [generate]);

  return (
    <div>
      <div className="aiImgDisplay">
        {loading && (
          <div className="aiImgLoading">
            <div className="aiImgLoadLine">&gt;_ generating image...</div>
            <div className="aiImgLoadLine">&gt;_ model: flux</div>
            <div className="aiImgLoadBar">
              <div className="aiImgLoadFill" />
            </div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={displayPrompt}
          className="aiImgResult"
          style={{ opacity: loading ? 0 : 1 }}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      </div>
      <div className="aiImgPromptShow">&gt;_ {displayPrompt}</div>
      <div className="aiImgCategories">
        {Object.keys(PROMPTS).map(cat => (
          <button key={cat} className="aiImgCatBtn" onClick={() => randomGenerate(cat)}>
            {cat}
          </button>
        ))}
      </div>
      <div className="aiImgInputRow">
        <input
          className="aiImgInput"
          placeholder="type a prompt..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') generate(prompt); }}
        />
        <button className="aiImgBtn" onClick={() => generate(prompt)}>Go</button>
        <button className="aiImgBtn" onClick={() => randomGenerate()}>Random</button>
      </div>
    </div>
  );
}
