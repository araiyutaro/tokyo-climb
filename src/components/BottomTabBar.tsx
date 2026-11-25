'use client';

import { CalendarDays, Compass, Map as MapIcon, Star } from 'lucide-react';

export type AppTab = 'today' | 'map' | 'favorites' | 'calendar';

interface BottomTabBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  favoritesCount: number;
}

export function BottomTabBar({
  activeTab,
  onSelectTab,
  favoritesCount,
}: BottomTabBarProps) {
  return (
    <nav
      aria-label="モバイルナビゲーション"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/92 backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/92 md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-4 items-center px-2">
        <button
          type="button"
          onClick={() => onSelectTab('today')}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-all active:scale-95 ${
            activeTab === 'today'
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span
            className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              activeTab === 'today'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : ''
            }`}
          >
            <Compass className="h-4.5 w-4.5" />
          </span>
          <span className="text-[11px] font-bold">今日</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('map')}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-all active:scale-95 ${
            activeTab === 'map'
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span
            className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              activeTab === 'map'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : ''
            }`}
          >
            <MapIcon className="h-4.5 w-4.5" />
          </span>
          <span className="text-[11px] font-bold">マップ</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('favorites')}
          className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-all active:scale-95 ${
            activeTab === 'favorites'
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span
            className={`relative flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              activeTab === 'favorites' ? 'bg-amber-600 text-white' : ''
            }`}
          >
            <Star className={`h-4.5 w-4.5 ${activeTab === 'favorites' ? 'fill-white' : ''}`} />
            {favoritesCount > 0 && (
              <span
                className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-extrabold ${
                  activeTab === 'favorites'
                    ? 'bg-slate-900 text-white dark:bg-slate-950'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {favoritesCount}
              </span>
            )}
          </span>
          <span className="text-[11px] font-bold">マイジム</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('calendar')}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-all active:scale-95 ${
            activeTab === 'calendar'
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span
            className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              activeTab === 'calendar'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : ''
            }`}
          >
            <CalendarDays className="h-4.5 w-4.5" />
          </span>
          <span className="text-[11px] font-bold">カレンダー</span>
        </button>
      </div>
    </nav>
  );
}
