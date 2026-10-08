import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it has stayed unchanged for `delay` milliseconds
 * (conventions.md §15). Used by search inputs so typing does not fire a request
 * on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
