import { useState, useEffect, memo } from 'react';

interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  author_title: string;
  tags: string[];
  published: string;
  read_time: string;
}

export const OriginalsPanel = memo(function OriginalsPanel() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch('/blog-latest.json');
        const data = await res.json();
        setArticles((data.articles || []).slice(0, 6));
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchArticles();
    const interval = setInterval(fetchArticles, 3600000);
    return () => clearInterval(interval);
  }, []);

  // Rotate through articles every 15 seconds
  useEffect(() => {
    if (articles.length <= 1) return;
    const rotateInterval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % articles.length);
    }, 15000);
    return () => clearInterval(rotateInterval);
  }, [articles.length]);

  if (loading) {
    return (
      <div style={{ padding: 16, fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
        loading latest articles...
      </div>
    );
  }

  if (articles.length === 0) return null;

  const article = articles[currentIndex];

  return (
    <div style={{ overflow: 'hidden' }}>
      {/* Tags */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {article.tags.map(tag => (
          <span key={tag} style={{
            fontSize: 9,
            color: 'var(--accent)',
            background: 'rgba(93,202,165,0.06)',
            border: '1px solid rgba(93,202,165,0.18)',
            padding: '2px 6px',
            borderRadius: 3,
            fontFamily: 'monospace',
            letterSpacing: 0.5,
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <a
        href={`/blog/${article.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'block' }}
      >
        <div style={{
          fontSize: 13,
          color: 'var(--text)',
          fontFamily: 'monospace',
          lineHeight: 1.4,
          marginBottom: 10,
          fontWeight: 600,
        }}>
          {article.title}
        </div>
      </a>

      {/* Excerpt */}
      <div style={{
        fontSize: 11,
        color: 'var(--text-mid)',
        fontFamily: 'monospace',
        lineHeight: 1.6,
        marginBottom: 12,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {article.excerpt}
      </div>

      {/* Author + metadata */}
      <div style={{
        fontSize: 10,
        color: 'var(--text-dim)',
        fontFamily: 'monospace',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>by {article.author} · {article.author_title}</span>
        <span>{article.read_time}</span>
      </div>

      {/* Read more link */}
      <a
        href={`/blog/${article.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
          fontSize: 10,
          color: 'var(--accent)',
          fontFamily: 'monospace',
          textDecoration: 'none',
        }}
      >
        Read full article &rarr;
      </a>

      {/* Dots indicating current article */}
      {articles.length > 1 && (
        <div style={{
          marginTop: 10,
          display: 'flex',
          gap: 4,
          justifyContent: 'center',
        }}>
          {articles.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i === currentIndex ? 'var(--accent)' : 'var(--border)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
              aria-label={`View article ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});
