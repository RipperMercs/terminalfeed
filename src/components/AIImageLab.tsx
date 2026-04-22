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
  const [displayPrompt, setDisplayPrompt] = useState(() => {
    const seed = dailySeed();
    return ALL_PROMPTS[seed % ALL_PROMPTS.length];
  });
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    const seed = dailySeed();
    const p = ALL_PROMPTS[seed % ALL_PROMPTS.length];
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=512&height=512&seed=${seed}&model=flux&nologo=true`;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const cooldownRef = useRef(false);

  const generate = useCallback((p: string) => {
    if (cooldownRef.current || !p.trim() || isGenerating) return;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 3000);

    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p.trim())}?width=512&height=512&seed=${seed}&model=flux&nologo=true`;

    setDisplayPrompt(p.trim());
    setIsGenerating(true);
    setError('');
    setImageLoaded(false);

    // Preload image to detect actual load completion
    const img = new Image();
    const timeout = setTimeout(() => {
      setIsGenerating(false);
      setError('Generation timed out: try again');
    }, 30000);

    img.onload = () => {
      clearTimeout(timeout);
      setImageUrl(url);
      setImageLoaded(true);
      setIsGenerating(false);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      setIsGenerating(false);
      setError('Failed to generate: try again');
    };

    img.src = url;
  }, [isGenerating]);

  const randomGenerate = useCallback((category?: string) => {
    const pool = category && PROMPTS[category] ? PROMPTS[category] : ALL_PROMPTS;
    const p = pool[Math.floor(Math.random() * pool.length)];
    setPrompt(p);
    generate(p);
  }, [generate]);

  return (
    <div>
      <div className="aiImgDisplay">
        {isGenerating && (
          <div className="aiImgSpinner">
            <div className="aiImgSpinnerRing" />
            <div className="aiImgSpinnerText">&gt;_ generating image...</div>
            <div className="aiImgSpinnerHint">this can take 5-15 seconds</div>
          </div>
        )}
        {error && (
          <div className="aiImgError">
            <div>{error}</div>
            <button className="aiImgRetry" onClick={() => generate(displayPrompt)}>retry</button>
          </div>
        )}
        {imageUrl && !isGenerating && !error && (
          <img
            src={imageUrl}
            alt={displayPrompt}
            className={`aiImgResult ${imageLoaded ? 'aiImgFadeIn' : ''}`}
            onLoad={() => setImageLoaded(true)}
          />
        )}
      </div>
      <div className="aiImgPromptShow">&gt;_ {displayPrompt}</div>
      <div className="aiImgCategories">
        {Object.keys(PROMPTS).map(cat => (
          <button key={cat} className="aiImgCatBtn" onClick={() => randomGenerate(cat)} disabled={isGenerating}>
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
          disabled={isGenerating}
        />
        <button className="aiImgBtn" onClick={() => generate(prompt)} disabled={isGenerating}>Go</button>
        <button className="aiImgBtn" onClick={() => randomGenerate()} disabled={isGenerating}>Random</button>
      </div>
    </div>
  );
}
