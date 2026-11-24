'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, ListFilter, Mountain, PlusCircle, RefreshCw } from 'lucide-react';
import type { CollectorRunMeta, Gym, ScheduleEvent } from '@/lib/schema';
import { getJstDateParts } from '@/lib/schedule';
import { TodayGymList } from './TodayGymList';
import { MonthlyCalendar } from './MonthlyCalendar';

interface TokyoClimbAppProps {
  gyms: Gym[];
  events: ScheduleEvent[];
  eventsUpdatedAt: string;
  syncStatus: CollectorRunMeta[];
  initialNowIso: string;
}

const FAVORITES_KEY = 'tokyo-climb:favorites:v1';

function formatJstClock(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const hh = String(jst.getUTCHours()).padStart(2, '0');
  const mm = String(jst.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} JST`;
}

function formatUpdatedAtJst(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const m = jst.getUTCMonth() + 1;
  const day = jst.getUTCDate();
  const hh = String(jst.getUTCHours()).padStart(2, '0');
  const mm = String(jst.getUTCMinutes()).padStart(2, '0');
  return `${m}/${day} ${hh}:${mm}`;
}

export function TokyoClimbApp({
  gyms,
  events,
  eventsUpdatedAt,
  syncStatus,
  initialNowIso,
}: TokyoClimbAppProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'calendar'>('today');
  const [now, setNow] = useState<Date>(() => new Date(initialNowIso));
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());

  // Sync live clock on client & refresh every 60s
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Load saved favorites from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavorites(new Set(parsed.filter((v) => typeof v === 'string')));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleFavorite = (gymId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(gymId)) next.delete(gymId);
      else next.add(gymId);
      try {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const jstParts = getJstDateParts(now);
  const okCount = syncStatus.filter((s) => s.status === 'ok').length;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Brand */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                  <Mountain className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                    Tokyo Climb
                  </h1>
                  <p className="text-[11px] text-slate-500">
                    東京・近郊ボルダリング {gyms.length}店舗 営業＆ホールド替えまとめ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 sm:hidden">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                {formatJstClock(now)}
              </div>
            </div>

            {/* Tab Switcher + Clock */}
            <div className="flex items-center justify-between gap-3">
              <nav
                aria-label="表示切替"
                className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1 sm:w-auto"
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('today')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all sm:text-sm ${
                    activeTab === 'today'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListFilter className="h-4 w-4" />
                  今日・営業一覧
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('calendar')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all sm:text-sm ${
                    activeTab === 'calendar'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                  月間カレンダー
                </button>
              </nav>

              <div className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 sm:inline-flex">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                {formatJstClock(now)}
              </div>

              <Link
                href="/import"
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100"
                title="Instagram / X の告知文やカレンダー画像から予定を取り込む"
              >
                <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden md:inline">SNS取込</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
        {activeTab === 'today' ? (
          <TodayGymList
            gyms={gyms}
            events={events}
            now={now}
            todayStr={jstParts.dateStr}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <MonthlyCalendar
            gyms={gyms}
            events={events}
            todayStr={jstParts.dateStr}
            favorites={favorites}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-12 max-w-7xl border-t border-slate-200 px-4 pt-6 text-xs text-slate-500 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              最終データ更新: {formatUpdatedAtJst(eventsUpdatedAt)} JST
            </span>
            {syncStatus.length > 0 && (
              <span>
                自動収集成功: {okCount} / {syncStatus.length} 店舗
              </span>
            )}
          </div>
          <p>
            ※ 突発的な臨時休業やSNS限定告知（Instagramストーリー等）は各店舗の公式リンクより最新情報をご確認ください。
          </p>
        </div>
      </footer>
    </div>
  );
}
