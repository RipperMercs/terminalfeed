import { memo, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import styles from './Typewriter.module.css';

interface Props {
  /** String to type out. Changing this prop restarts the typewriter from empty. */
  text: string;
  /** Milliseconds per character. Default 32. */
  charSpeed?: number;
  /** Show the blinking caret at the tail. Default true. */
  caret?: boolean;
  /** Override the caret color. Defaults to --green via CSS var. */
  caretColor?: string;
}

/**
 * Typewriter — reveals a string char-by-char, with an optional blinking
 * caret at the tail. Rotation through multiple items is the caller's job —
 * wrap the primitive in a hook that swaps the text prop on whatever cadence
 * makes sense (useWire, a queue, etc.). Keeping rotation external means the
 * primitive stays tiny and composable.
 */
function TypewriterInner({
  text,
  charSpeed = 32,
  caret = true,
  caretColor,
}: Props) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    setShown('');
    if (!text) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, charSpeed);
    return () => clearInterval(iv);
  }, [text, charSpeed]);

  const style = caretColor ? ({ ['--typewriter-caret' as string]: caretColor } as CSSProperties) : undefined;

  return (
    <span className={styles.root} style={style}>
      {shown}
      {caret && <span className={styles.caret} aria-hidden="true" />}
    </span>
  );
}

export const Typewriter = memo(TypewriterInner);
