import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, delay = 200, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<number>();

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const coords = calculatePosition(rect, position);
        setCoords(coords);
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const calculatePosition = (rect: DOMRect, position: string) => {
    const spacing = 8;
    switch (position) {
      case 'top':
        return {
          x: rect.left + rect.width / 2,
          y: rect.top - spacing
        };
      case 'bottom':
        return {
          x: rect.left + rect.width / 2,
          y: rect.bottom + spacing
        };
      case 'left':
        return {
          x: rect.left - spacing,
          y: rect.top + rect.height / 2
        };
      case 'right':
        return {
          x: rect.right + spacing,
          y: rect.top + rect.height / 2
        };
      default:
        return { x: 0, y: 0 };
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const child = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip
  });

  return (
    <>
      {child}
      {isVisible && createPortal(
        <div
          className={`
            absolute z-50 px-2 py-1 text-xs font-medium text-white 
            bg-gray-900 rounded shadow-sm pointer-events-none
            transform -translate-x-1/2 -translate-y-full
            ${position === 'bottom' ? 'translate-y-2' : ''}
            ${position === 'left' ? '-translate-x-full -translate-y-1/2' : ''}
            ${position === 'right' ? 'translate-x-2 -translate-y-1/2' : ''}
          `}
          style={{ left: coords.x, top: coords.y }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}