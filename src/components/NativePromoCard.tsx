import { ExternalLink, Sparkles } from 'lucide-react';
import type { PromotionItem } from '@/lib/promotions';

interface NativePromoCardProps {
  item: PromotionItem | null;
  className?: string;
}

/**
 * Native-styled PR / affiliate / sponsor card that blends cleanly with Tokyo Climb cards.
 * - Renders nothing unless a real affiliate/sponsor URL is configured.
 * - Always displays an explicit "PR" label and uses `rel="noopener noreferrer sponsored"`.
 */
export function NativePromoCard({ item, className = '' }: NativePromoCardProps) {
  if (!item || !item.affiliateUrl) {
    return null;
  }

  return (
    <aside
      aria-label="PR・おすすめ情報"
      className={`rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-white p-4 shadow-xs dark:border-amber-900/60 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900 dark:bg-amber-950 dark:text-amber-300">
            PR
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
            <Sparkles className="h-3 w-3 text-amber-500" />
            {item.badge}
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          Sponsored
        </span>
      </div>

      <a
        href={item.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
      >
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-400">
            {item.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{item.subtitle}</p>
        </div>
        <span className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition-transform group-hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900">
          {item.ctaLabel ?? '詳細を見る'}
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </a>
    </aside>
  );
}
