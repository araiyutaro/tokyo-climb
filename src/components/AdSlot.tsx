'use client';

import { useEffect, useRef } from 'react';
import { isValidAdSenseClient } from '@/lib/site';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export type AdSlotVariant = 'infeed' | 'detail';

interface AdSlotProps {
  variant: AdSlotVariant;
  client?: string | null;
  slot?: string | null;
  className?: string;
}

const DEFAULT_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? null;
const DEFAULT_SLOTS: Record<AdSlotVariant, string | null> = {
  infeed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INFEED ?? null,
  detail: process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL ?? null,
};

/**
 * CLS-safe, manual-only Google AdSense slot designed to blend cleanly with the PWA UI.
 * - Renders nothing when AdSense env vars are not configured (zero empty boxes before approval).
 * - Reserves fixed vertical height so layout never shifts when an ad loads.
 * - Defers `adsbygoogle.push` until the slot approaches the viewport via IntersectionObserver.
 */
export function AdSlot({ variant, client, slot, className = '' }: AdSlotProps) {
  const resolvedClient = client !== undefined ? client : DEFAULT_CLIENT;
  const resolvedSlot = slot !== undefined ? slot : DEFAULT_SLOTS[variant];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pushedRef = useRef(false);

  const isEnabled = isValidAdSenseClient(resolvedClient) && Boolean(resolvedSlot?.trim());

  useEffect(() => {
    if (!isEnabled || pushedRef.current) return;
    const node = containerRef.current;
    if (!node) return;

    const triggerAd = () => {
      if (pushedRef.current) return;
      pushedRef.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Ignore when blocked by ad-blocker or not yet loaded
      }
    };

    if (typeof IntersectionObserver === 'undefined') {
      triggerAd();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          triggerAd();
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isEnabled]);

  if (!isEnabled || !resolvedClient || !resolvedSlot) {
    return null;
  }

  const minHeightClass = variant === 'infeed' ? 'min-h-[120px]' : 'min-h-[140px]';

  return (
    <aside
      ref={containerRef}
      aria-label="広告"
      className={`overflow-hidden rounded-2xl border border-slate-200/85 bg-white/90 p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 ${className}`}
    >
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold tracking-wide text-slate-500 dark:text-slate-400">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">PR / 広告</span>
        <span>Sponsored</span>
      </div>
      <div className={`flex w-full items-center justify-center ${minHeightClass}`}>
        <ins
          className="adsbygoogle block w-full"
          style={{ display: 'block' }}
          data-ad-client={resolvedClient.trim()}
          data-ad-slot={resolvedSlot.trim()}
          data-ad-format={variant === 'infeed' ? 'fluid' : 'auto'}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
