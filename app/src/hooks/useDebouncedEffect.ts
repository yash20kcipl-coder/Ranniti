import { useEffect, useRef } from 'react';

/**
 * Debounced version of useEffect.
 * Prevents duplicate API requests from React 18+ StrictMode double-mount cycles.
 * Uses a configurable delay (default: 200ms).
 */
export function useDebouncedEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  delay = 200,
) {
  const cleanupRef = useRef<(() => void) | void>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      cleanupRef.current = effect();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default useDebouncedEffect;
