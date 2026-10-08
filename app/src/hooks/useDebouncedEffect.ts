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
  immediateFirst = true
) {
  const cleanupRef = useRef<(() => void) | void>(undefined);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    if (isFirstMountRef.current && immediateFirst) {
      isFirstMountRef.current = false;
      cleanupRef.current = effect();
      return () => {
        if (typeof cleanupRef.current === 'function') {
          cleanupRef.current();
          cleanupRef.current = undefined;
        }
      };
    }

    isFirstMountRef.current = false;
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

