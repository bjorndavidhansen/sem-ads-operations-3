import { useMemo, useCallback } from 'react';

export function memoWithPrevious<T, U>(
  value: T,
  compare: (prev: T, next: T) => boolean,
  compute: (value: T) => U
): U {
  const ref = useMemo(() => ({
    value,
    computed: compute(value),
  }), []);

  if (!compare(ref.value, value)) {
    ref.value = value;
    ref.computed = compute(value);
  }

  return ref.computed;
}

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[],
  options: { maxSize?: number } = {}
) {
  const cache = useRef(new Map<string, any>());
  const { maxSize = 100 } = options;

  return useCallback((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.current.has(key)) {
      return cache.current.get(key);
    }

    const result = callback(...args);
    
    if (cache.current.size >= maxSize) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
    
    cache.current.set(key, result);
    return result;
  }, dependencies);
}