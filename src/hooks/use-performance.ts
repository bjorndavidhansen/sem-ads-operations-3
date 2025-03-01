import { useEffect, useRef } from 'react';

interface PerformanceOptions {
  componentName: string;
  threshold?: number;
}

export function usePerformance({ componentName, threshold = 16 }: PerformanceOptions) {
  const renderStartTime = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();

    return () => {
      const renderEndTime = performance.now();
      const renderDuration = renderEndTime - (renderStartTime.current || 0);
      renderCount.current += 1;

      if (renderDuration > threshold) {
        console.warn(
          `[Performance] ${componentName} took ${renderDuration.toFixed(2)}ms to render ` +
          `(render #${renderCount.current})`
        );
      }
    };
  });
}