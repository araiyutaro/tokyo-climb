'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Check, RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}

const THRESHOLD_PX = 72;
const MAX_PULL_PX = 108;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [status, setStatus] = useState<'idle' | 'pulling' | 'ready' | 'refreshing' | 'done'>('idle');

  const handleTouchStart = (e: React.TouchEvent) => {
    if (status === 'refreshing') return;
    if (window.scrollY <= 0 && e.touches.length === 1) {
      startYRef.current = e.touches[0].clientY;
    } else {
      startYRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null || status === 'refreshing') return;
    if (window.scrollY > 0) {
      startYRef.current = null;
      setPullDistance(0);
      setStatus('idle');
      return;
    }

    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 8) {
      // Smooth rubber-band damping
      const damped = Math.min(MAX_PULL_PX, Math.round((delta - 8) * 0.55));
      setPullDistance(damped);
      setStatus(damped >= THRESHOLD_PX ? 'ready' : 'pulling');
    } else {
      setPullDistance(0);
      setStatus('idle');
    }
  };

  const handleTouchEnd = async () => {
    if (startYRef.current === null) return;
    startYRef.current = null;

    if (status === 'ready') {
      setStatus('refreshing');
      setPullDistance(52);
      try {
        await onRefresh();
      } finally {
        setStatus('done');
        setTimeout(() => {
          setPullDistance(0);
          setStatus('idle');
        }, 700);
      }
    } else {
      setPullDistance(0);
      setStatus('idle');
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Indicator Pill */}
      <div
        aria-live="polite"
        className="pointer-events-none flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: pullDistance }}
      >
        {status !== 'idle' && (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-md dark:bg-slate-800/95">
            {status === 'done' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                最新情報に更新しました
              </>
            ) : (
              <>
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    status === 'refreshing' ? 'animate-spin text-emerald-400' : ''
                  }`}
                  style={
                    status !== 'refreshing'
                      ? { transform: `rotate(${Math.min(180, pullDistance * 2.5)}deg)` }
                      : undefined
                  }
                />
                {status === 'refreshing'
                  ? '更新中...'
                  : status === 'ready'
                    ? '離して更新'
                    : '引っ張って更新'}
              </>
            )}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
