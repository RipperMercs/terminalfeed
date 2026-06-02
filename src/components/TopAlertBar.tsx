import { useBreaking } from '../hooks/useBreaking';
import styles from './TopAlertBar.module.css';

// Same-origin relative href only, re-validated at render time as defense in depth
// against a malformed value that somehow reached the client (the server validates
// on write too). A protocol-relative //evil passes a naive "starts with slash"
// check, so the second char must be a non-slash.
function isSafeHref(href: string | undefined): href is string {
  return (
    typeof href === 'string' &&
    href.length > 1 &&
    href[0] === '/' &&
    href[1] !== '/' &&
    href.indexOf('\\') === -1
  );
}

// Single operator-raised banner. The headline is rendered as a React text child
// only (never dangerouslySetInnerHTML), so any markup in it is inert. Renders
// nothing unless there is an active, undismissed alert.
export function TopAlertBar() {
  const { alert, dismiss } = useBreaking();
  if (!alert) return null;

  const sevClass =
    alert.severity === 'critical'
      ? styles.critical
      : alert.severity === 'warning'
        ? styles.warning
        : styles.info;

  return (
    <div className={`${styles.bar} ${sevClass}`} role="alert" aria-live="assertive">
      <span className={styles.label}>BREAKING</span>
      <span className={styles.headline}>{alert.headline}</span>
      {isSafeHref(alert.href) ? (
        <a className={styles.link} href={alert.href}>
          Details &rarr;
        </a>
      ) : null}
      <button
        className={styles.dismiss}
        aria-label="Dismiss alert"
        onClick={() => {
          if (alert.id) dismiss(alert.id);
        }}
      >
        &times;
      </button>
    </div>
  );
}
