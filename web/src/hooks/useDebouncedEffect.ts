import { useEffect, useRef, type DependencyList } from 'react';

/**
 * Custom hook to execute an effect with debouncing.
 * This is particularly useful in React 18+ development to avoid duplicate execution
 * caused by StrictMode's mount/unmount/mount cycle.
 */
export const useDebouncedEffect = (effect: () => void, delay: number, deps: DependencyList) => {
    const callback = useRef(effect);

    // Update the ref whenever the effect function changes
    useEffect(() => {
        callback.current = effect;
    }, [effect]);

    useEffect(() => {
        const handler = setTimeout(() => {
            callback.current();
        }, delay);

        // Cleanup: cancels the previous timer if dependencies change or the component unmounts.
        return () => clearTimeout(handler);
    }, [...deps, delay]);
};
