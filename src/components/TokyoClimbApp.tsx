'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  Compass,
  Mountain,
  PlusCircle,
  RefreshCw,
  Star,
} from 'lucide-react';
import type { CollectorRunMeta, Gym, ScheduleEvent } from '@/lib/schema';
import { evaluateGymDayStatus, getJstDateParts, type GymDayStatus } from '@/lib/schedule';
import { haversineDistanceKm, type Coordinates } from '@/lib/geo';
import { TodayGymList } from './TodayGymList';
import { MonthlyCalendar } from './MonthlyCalendar';
import { BottomTabBar, type AppTab } from './BottomTabBar';
import { GymDetailSheet } from './GymDetailSheet';
import { ThemeToggle } from './ThemeToggle';
import { PullToRefresh } from './PullToRefresh';

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [now, setNow] = useState<Date>(() => new Date(initialNowIso));
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [detailDayStatus, setDetailDayStatus] = useState<GymDayStatus | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);

  // GPS geolocation state shared across views & detail sheet
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const gymMap = useMemo(() => new Map(gyms.map((g) => [g.id, g])), [gyms]);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'today' || tabParam === 'favorites' || tabParam === 'calendar') {
      setActiveTab(tabParam);
    }
  }, []);

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

  const showToast = useCallback((msg: string) => {
    setToastText(msg);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore on unsupported devices
      }
    }
  }, []);

  useEffect(() => {
    if (!toastText) return;
    const t = setTimeout(() => setToastText(null), 2200);
    return () => clearTimeout(t);
  }, [toastText]);

  const toggleFavorite = (gymId: string) => {
    const gymName = gymMap.get(gymId)?.shortName ?? gymMap.get(gymId)?.name ?? 'ジム';
    setFavorites((prev) => {
      const next = new Set(prev);
      const willAdd = !next.has(gymId);
      if (willAdd) next.add(gymId);
      else next.delete(gymId);
      try {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Ignore storage errors
      }
      showToast(willAdd ? `★ ${gymName} をお気に入りに追加` : `${gymName} をお気に入りから解除`);
      return next;
    });
  };

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestLocation = useCallback((onSuccess?: () => void) => {
    if (!('geolocation' in navigator)) {
      setLocationError('お使いのブラウザは位置情報（GPS）に対応していません。');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
        onSuccess?.();
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            '位置情報の利用が許可されていません。ブラウザの設定から位置情報を許可すると「近い順」が使えます。',
          );
        } else {
          setLocationError('現在地の取得に失敗しました。電波状況を確認してもう一度お試しください。');
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, []);

  const handleSelectGymFromCalendar = useCallback(
    (gymId: string, dateStr: string) => {
      const gym = gymMap.get(gymId);
      if (!gym) return;
      const status = evaluateGymDayStatus(gym, dateStr, events, now);
      setDetailDayStatus(status);
    },
    [gymMap, events, now],
  );

  const handlePullRefresh = useCallback(async () => {
    setNow(new Date());
    router.refresh();
    await new Promise((resolve) => setTimeout(resolve, 400));
  }, [router]);

  const jstParts = getJstDateParts(now);
  const okCount = syncStatus.filter((s) => s.status === 'ok').length;

  const detailDistanceKm =
    detailDayStatus && userLocation && detailDayStatus.gym.coordinates
      ? haversineDistanceKm(userLocation, detailDayStatus.gym.coordinates)
      : undefined;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 transition-colors duration-200 dark:bg-slate-950 md:pb-16">
      {/* Sticky Top Header */}
      <header className="pt-safe sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/90">
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 md:py-3">
          <div className="flex items-center justify-between gap-2.5">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900 md:h-9 md:w-9">
                <Mountain className="h-4.5 w-4.5 md:h-5 md:w-5" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white md:text-lg">
                  Tokyo Climb
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 md:text-[11px]">
                  東京・近郊ボルダリング {gyms.length}店舗
                </p>
              </div>
            </div>

            {/* Desktop Tab Switcher */}
            <nav
              aria-label="表示切替"
              className="hidden items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 md:flex"
            >
              <button
                type="button"
                onClick={() => handleSelectTab('today')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold transition-all ${
                  activeTab === 'today'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Compass className="h-4 w-4" />
                今日・営業一覧
              </button>
              <button
                type="button"
                onClick={() => handleSelectTab('favorites')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold transition-all ${
                  activeTab === 'favorites'
                    ? 'bg-white text-amber-600 shadow-xs dark:bg-slate-800 dark:text-amber-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Star className={`h-4 w-4 ${activeTab === 'favorites' ? 'fill-amber-400' : ''}`} />
                お気に入り
                {favorites.size > 0 && (
                  <span className="rounded-full bg-amber-100 px-1.5 text-[11px] font-extrabold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    {favorites.size}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleSelectTab('calendar')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                月間カレンダー
              </button>
            </nav>

            {/* Right Utility Controls */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200 md:px-3 md:py-1.5 md:text-xs">
                <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                {formatJstClock(now)}
              </div>

              <ThemeToggle />

              <Link
                href="/import"
                className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:inline-flex"
                title="Instagram / X の告知文やカレンダー画像から予定を取り込む"
              >
                <PlusCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                SNS取込
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content wrapped with native Pull-to-Refresh */}
      <PullToRefresh onRefresh={handlePullRefresh}>
        <main className="mx-auto max-w-7xl px-3.5 pt-4 sm:px-6 md:pt-5">
          {activeTab === 'calendar' ? (
            <MonthlyCalendar
              gyms={gyms}
              events={events}
              todayStr={jstParts.dateStr}
              favorites={favorites}
              onSelectGym={handleSelectGymFromCalendar}
            />
          ) : (
            <TodayGymList
              gyms={gyms}
              events={events}
              now={now}
              todayStr={jstParts.dateStr}
              favorites={favorites}
              favoritesOnlyTab={activeTab === 'favorites'}
              userLocation={userLocation}
              locating={locating}
              locationError={locationError}
              onRequestLocation={handleRequestLocation}
              onToggleFavorite={toggleFavorite}
              onOpenGymDetail={(ds) => setDetailDayStatus(ds)}
              onSwitchToAllTab={() => handleSelectTab('today')}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="mx-auto mt-10 max-w-7xl border-t border-slate-200 px-4 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-6">
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
            <div className="flex flex-wrap items-center gap-3">
              <p>
                ※ 突発的な臨時休業やSNS限定告知（Instagramストーリー等）は各店舗の公式リンクより最新情報をご確認ください。
              </p>
              <a
                href="https://github.com/araiyutaro/tokyo-climb/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                掲載ジム追加・情報修正リクエスト (GitHub)
              </a>
            </div>
          </div>
        </footer>
      </PullToRefresh>

      {/* Native Tactile Toast Feedback */}
      {toastText && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 animate-[sheet-up_0.18s_ease-out] whitespace-nowrap rounded-full bg-slate-900/95 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md dark:bg-slate-100/95 dark:text-slate-900 md:bottom-6"
        >
          {toastText}
        </div>
      )}

      {/* Native Mobile Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        favoritesCount={favorites.size}
      />

      {/* Native Gym Detail Bottom Sheet / Modal (swipe down to dismiss!) */}
      <GymDetailSheet
        dayStatus={detailDayStatus}
        distanceKm={detailDistanceKm}
        allEvents={events}
        isFavorite={detailDayStatus ? favorites.has(detailDayStatus.gym.id) : false}
        onToggleFavorite={toggleFavorite}
        onClose={() => setDetailDayStatus(null)}
      />
    </div>
  );
}
