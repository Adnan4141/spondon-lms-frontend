'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function VirtualList<T>({
  items,
  rowHeight,
  maxHeight = 420,
  overscan = 6,
  getKey,
  renderRow,
  emptyState,
}: {
  items: T[];
  rowHeight: number;
  maxHeight?: number;
  overscan?: number;
  getKey: (item: T, index: number) => string;
  renderRow: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(maxHeight);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateHeight = () => {
      setViewportHeight(Math.min(maxHeight, node.clientHeight || maxHeight));
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [maxHeight]);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200">
        {emptyState || <p className="px-4 py-10 text-center text-sm text-slate-500">No items to display.</p>}
      </div>
    );
  }

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan);
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * rowHeight;
  const offsetY = startIndex * rowHeight;

  return (
    <div
      ref={containerRef}
      className="max-h-[420px] overflow-auto rounded-lg border border-slate-200"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, visibleIndex) => {
            const index = startIndex + visibleIndex;
            return (
              <div key={getKey(item, index)} style={{ height: rowHeight }}>
                {renderRow(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
