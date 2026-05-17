import { Panel } from './Panel';
import type { HNStory } from '../hooks/useHackerNews';
import styles from './NewsPanel.module.css';

interface Props {
  stories: HNStory[];
}

// Spelled-out phrases and product names: case-insensitive.
const VR_PHRASES =
  /\b(virtual reality|augmented reality|mixed reality|extended reality|spatial comput\w*|metaverse|oculus|meta quest|quest [23]|vision ?pro|visionos|openxr|webxr|vrchat|valve index|pico (?:4|neo)|varjo|headset)\b/i;
// Bare abbreviations: only when authors write them uppercase (VR / AR / XR),
// which avoids matching common lowercase words.
const VR_ABBR = /\b(VR|AR|XR)\b/;

// VR/AR/XR coverage lives on vr.org (our sister site). The original headline
// link is left untouched (honest); we add a separate sister link alongside it.
function vrOrgLink(title: string): string | null {
  if (!title) return null;
  if (VR_PHRASES.test(title) || VR_ABBR.test(title)) return 'https://vr.org';
  return null;
}

export function NewsPanel({ stories }: Props) {
  return (
    <Panel title="Tech / AI Feed" status={stories.length > 0 ? 'polling' : 'offline'}>
      <div className={styles.list}>
        {stories.length === 0 && (
          <div className={styles.loading}>loading headlines...</div>
        )}
        {stories.map((story) => {
          const href = story.url || `https://news.ycombinator.com/item?id=${story.id}`;
          const vrHref = vrOrgLink(story.title);
          return (
            <div key={story.id} className={styles.item}>
              <span className={styles.score}>{story.score}</span>
              <div className={styles.content}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.titleLink}
                >
                  <span className={styles.title}>{story.title}</span>
                </a>
                <span className={styles.meta}>
                  {story.by} · {timeAgo(story.time)} · {story.descendants ?? 0} comments
                  {vrHref && (
                    <>
                      {' · '}
                      <a
                        href={vrHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.sister}
                        title="More VR / AR / XR coverage on VR.org"
                      >
                        VR·AR·XR → vr.org
                      </a>
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
