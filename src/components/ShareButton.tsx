'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  path: string;
  compact?: boolean;
  className?: string;
}

export function ShareButton({
  title,
  text,
  path,
  compact = false,
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl =
      typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url: fullUrl });
        return;
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${fullUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`;
      window.open(intent, '_blank', 'noopener,noreferrer');
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onTouchStart={(e) => e.stopPropagation()}
        onClick={handleShare}
        aria-label="このジムの情報を共有"
        title="このジムの情報を共有"
        className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-slate-100 p-2.5 text-slate-600 transition-colors hover:bg-slate-200 active:scale-90 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 ${className}`}
      >
        {copied ? (
          <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Share2 className="h-5 w-5" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-800 ring-1 ring-slate-200 transition-all hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700 ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          URLをコピーしました
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" />
          シェア / URLコピー
        </>
      )}
    </button>
  );
}
