import { useEffect, useRef, useState } from 'react';

/**
 * Returns `shouldHide: true` after `timeoutMs` if `hasData` never flips to true.
 * Safety net so a broken hook or dead upstream does not wedge visitors on a
 * "loading..." placeholder indefinitely.
 *
 *   const { data, loading } = useSomeData();
 *   const shouldHide = useLoadingTimeout(!!data, 10000);
 *   if (shouldHide) return null;
 */
export function useLoadingTimeout(hasData: boolean, timeoutMs = 10000): boolean {
  const [shouldHide, setShouldHide] = useState(false);
  const hasDataRef = useRef(hasData);
  hasDataRef.current = hasData;

  useEffect(() => {
    if (hasData) return;
    const t = setTimeout(() => {
      if (!hasDataRef.current) setShouldHide(true);
    }, timeoutMs);
    return () => clearTimeout(t);
  }, [hasData, timeoutMs]);

  useEffect(() => {
    if (hasData && shouldHide) setShouldHide(false);
  }, [hasData, shouldHide]);

  return shouldHide;
}
