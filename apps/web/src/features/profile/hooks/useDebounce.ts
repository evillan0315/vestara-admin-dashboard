import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value` that only updates once `delay` ms
 * have elapsed since the last change. Useful for throttling expensive
 * operations like MUI theme recomputation during slider drags.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
