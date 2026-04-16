# Related Content Component Spec

## Overview
Add a "Related Articles" and "Related Tools" section to the bottom of every blog article, between the author box and the footer. This increases internal linking, time-on-site, and pages-per-session. It also helps Google understand content relationships.

## Design

### Visual Layout
Sits inside `<article class="article-body">` after the author-box, before `</div>` container close.

```
[ RELATED ARTICLES ]
---------------------------------------------
|  [teal dot] Article Title 1              |
|  By Author | Category | Date             |
---------------------------------------------
|  [teal dot] Article Title 2              |
|  By Author | Category | Date             |
---------------------------------------------
|  [teal dot] Article Title 3              |
|  By Author | Category | Date             |
---------------------------------------------

[ RELATED TOOLS ]
---------------------------------------------
|  >_ Tool Name 1 - One line description   |
|  >_ Tool Name 2 - One line description   |
---------------------------------------------
```

### CSS (matches existing design system)

```css
.related-content {
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px solid #1E1E24;
}

.related-content h3 {
  font-size: 10px;
  color: #4E4D49;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 14px;
}

.related-article {
  display: block;
  padding: 12px 0;
  border-bottom: 1px solid #1A1A1E;
  text-decoration: none;
}

.related-article:last-child {
  border-bottom: none;
}

.related-article:hover .related-title {
  color: #5DCAA5;
}

.related-title {
  font-size: 13px;
  color: #F0EDE6;
  font-weight: 600;
  margin-bottom: 3px;
  transition: color 0.15s;
}

.related-title::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #5DCAA5;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}

.related-meta {
  font-size: 10px;
  color: #4E4D49;
  padding-left: 14px;
}

.related-tools {
  margin-top: 20px;
}

.related-tool {
  display: block;
  padding: 8px 0;
  font-size: 12px;
  color: #8A8880;
  text-decoration: none;
  border-bottom: 1px solid #1A1A1E;
}

.related-tool:last-child {
  border-bottom: none;
}

.related-tool:hover {
  color: #5DCAA5;
}

.related-tool .tool-prefix {
  color: #4ADE80;
  margin-right: 6px;
}

.related-tool .tool-desc {
  color: #4E4D49;
  margin-left: 6px;
}
```

### HTML Structure (per article)

```html
<div class="related-content">
  <h3>RELATED ARTICLES</h3>
  <a href="/blog/free-apis-2026" class="related-article">
    <div class="related-title">30+ Free APIs for Developers in 2026</div>
    <div class="related-meta">By Node | Dev Tools | March 2026</div>
  </a>
  <a href="/blog/api-rate-limits-explained" class="related-article">
    <div class="related-title">API Rate Limits Explained</div>
    <div class="related-meta">By Node | Dev Tools | March 2026</div>
  </a>
  <a href="/blog/free-api-testing-tools" class="related-article">
    <div class="related-title">Stop Paying for Postman: Free API Testing Tools</div>
    <div class="related-meta">By Node | Dev Tools | April 2026</div>
  </a>

  <div class="related-tools">
    <h3>RELATED TOOLS</h3>
    <a href="/tools/json" class="related-tool">
      <span class="tool-prefix">>_</span> JSON Formatter
      <span class="tool-desc">Format and validate JSON</span>
    </a>
    <a href="/tools/jwt" class="related-tool">
      <span class="tool-prefix">>_</span> JWT Decoder
      <span class="tool-desc">Decode and inspect tokens</span>
    </a>
  </div>
</div>
```

## Content Mapping

Each blog article should show 3 related articles and 1-2 related tools. Here is the mapping:

### Crypto/Markets Articles
- fear-greed-guide: Related to btc-extreme-fear-data, what-the-fear-greed-index-got-wrong, why-data-matters-for-traders | Tools: none
- bitcoin-mempool: Related to fear-greed-guide, why-data-matters-for-traders, building-terminalfeed | Tools: none
- prediction-markets: Related to fear-greed-guide, why-data-matters-for-traders, what-the-fear-greed-index-got-wrong | Tools: none
- why-data-matters-for-traders: Related to fear-greed-guide, prediction-markets, bitcoin-mempool | Tools: none
- btc-extreme-fear-data: Related to fear-greed-guide, what-the-fear-greed-index-got-wrong, why-data-matters-for-traders | Tools: none
- what-the-fear-greed-index-got-wrong: Related to fear-greed-guide, btc-extreme-fear-data, prediction-markets | Tools: none

### Dev Tools Articles
- free-apis-2026: Related to api-rate-limits-explained, free-api-testing-tools, api-security | Tools: json, jwt
- api-rate-limits-explained: Related to free-apis-2026, api-security, free-api-testing-tools | Tools: json, timestamp
- free-api-testing-tools: Related to free-apis-2026, api-rate-limits-explained, building-terminalfeed | Tools: json, base64
- cron-decoded: Related to free-apis-2026, free-api-testing-tools, self-hosting-is-back | Tools: cron, timestamp

### Security Articles
- api-security: Related to read-your-browser-console, free-apis-2026, api-rate-limits-explained | Tools: jwt, hash
- read-your-browser-console: Related to api-security, browser-extensions-watching, building-terminalfeed | Tools: json, regex
- browser-extensions-watching: Related to read-your-browser-console, api-security, 2600-still-matters | Tools: none

### AI Articles
- ai-agents-explained: Related to how-ai-agents-browse, claude-mythos-project-glasswing, websites-humans-ai-agents | Tools: json, base64
- how-ai-agents-browse: Related to ai-agents-explained, websites-humans-ai-agents, building-terminalfeed | Tools: json, regex
- claude-mythos-project-glasswing: Related to ai-agents-explained, how-ai-agents-browse, terminal-aesthetic | Tools: none
- websites-humans-ai-agents: Related to ai-agents-explained, how-ai-agents-browse, free-apis-2026 | Tools: json, uuid

### Culture/Meta Articles
- building-terminalfeed: Related to terminal-aesthetic, self-hosting-is-back, second-monitor | Tools: json, timestamp
- terminal-aesthetic: Related to building-terminalfeed, 2600-still-matters, second-monitor | Tools: none
- 2600-still-matters: Related to terminal-aesthetic, read-your-browser-console, self-hosting-is-back | Tools: none
- self-hosting-is-back: Related to free-tier-is-dead, building-terminalfeed, free-apis-2026 | Tools: json, cron
- free-tier-is-dead: Related to self-hosting-is-back, free-apis-2026, free-api-testing-tools | Tools: none
- second-monitor: Related to why-second-monitor-dashboards-matter, building-terminalfeed, terminal-aesthetic | Tools: none
- why-second-monitor-dashboards-matter: Related to second-monitor, building-terminalfeed, real-time-vs-near-real-time | Tools: none

### Data Articles
- real-time-vs-near-real-time: Related to building-terminalfeed, free-apis-2026, earthquake-monitoring | Tools: json, timestamp
- earthquake-monitoring: Related to real-time-vs-near-real-time, building-terminalfeed, free-apis-2026 | Tools: none

## Implementation Steps for CC

1. Add the CSS to each blog article's `<style>` block (or create a shared blog.css if moving to shared styles)
2. Add the related-content div to each article HTML, using the mapping above
3. Each article gets exactly 3 related articles and 0-2 related tools
4. All links are relative paths (no full URLs needed)
5. Articles should be manually curated (not auto-generated) for relevance

## SEO Impact
- Internal links between related content strengthen topical clusters
- More links per page = better crawl depth for Google
- Related tools links create natural bridges between blog and tools sections
- The glossary terms already linked inline plus these structural links create a strong internal link mesh
