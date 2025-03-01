import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useEffect, useState } from 'react';
import useMeasure from 'react-use-measure';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight = 40,
  overscan = 5,
  className = '',
  onEndReached,
  endReachedThreshold = 0.8
}: VirtualListProps<T>) {
  const [ref, bounds] = useMeasure();
  const parentRef = useRef<HTMLDivElement>(null);
  const [isNearEnd, setIsNearEnd] = useState(false);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  useEffect(() => {
    if (isNearEnd && onEndReached) {
      onEndReached();
    }
  }, [isNearEnd, onEndReached]);

  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const checkEndReached = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      setIsNearEnd(scrollPercentage > endReachedThreshold);
    };

    scrollElement.addEventListener('scroll', checkEndReached);
    return () => scrollElement.removeEventListener('scroll', checkEndReached);
  }, [endReachedThreshold]);

  return (
    <div ref={ref} className={className}>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: bounds.height || '100%' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(items[virtualItem.index], virtualItem.index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}