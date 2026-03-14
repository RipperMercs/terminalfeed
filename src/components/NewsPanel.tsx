import { Panel } from './Panel';
import type { HNStory } from '../hooks/useHackerNews';
import styles from './NewsPanel.module.css';

interface Props {
  stories: HNStory[];
}

export function NewsPanel({ stories }: Props) {
  return (
    <Panel title="Tech / AI Feed" status={stories.length > 0 ? 'polling' : 'offline'}>
      <div className={styles.list}>
        {stories.length === 0 && (
          <div className={styles.loading}>loading headlines...</div>
        )}
        {stories.map((story) => (
          <a
            key={story.id}
            href={story.url || `https://news.ycombinator.com/item?id=${story.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.item}
          >
            <span className={styles.score}>{story.score}</span>
            <div className={styles.content}>
              <span className={styles.title}>{story.title}</span>
              <span className={styles.meta}>
                {story.by} · {timeAgo(story.time)} · {story.descendants ?? 0} comments
              </span>
            </div>
          </a>
        ))}
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
