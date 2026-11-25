'use client';

import { useEffect, useState } from 'react';
import { Download, Share, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'tokyo-climb:pwa-install-dismissed:v1';

export function PwaEnhancer() {
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // 1. Register Service Worker for offline caching & native installability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore registration issues in unsupported contexts
      });
    }

    // 2. Online / offline detection
    const updateOnline = () => setIsOffline(!navigator.onLine);
    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    // 3. Install prompt handling
    let wasDismissed = false;
    try {
      wasDismissed = window.localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      wasDismissed = false;
    }
    setDismissed(wasDismissed);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari standalone property
      Boolean(window.navigator.standalone);

    const ua = window.navigator.userAgent;
    const isIosSafari = /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS/i.test(ua);

    if (!isStandalone && !wasDismissed && isIosSafari) {
      setShowIosGuide(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      if (!isStandalone && !wasDismissed) {
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setShowIosGuide(false);
    setDeferredPrompt(null);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Ignore
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <>
      {isOffline && (
        <div
          role="status"
          className="fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900/95 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md"
        >
          <WifiOff className="h-3.5 w-3.5 text-amber-400" />
          オフライン表示中（キャッシュ済データ）
        </div>
      )}

      {!dismissed && (deferredPrompt || showIosGuide) && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 mx-auto max-w-md animate-[sheet-up_0.25s_ease-out] rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95 md:bottom-5 md:left-auto md:right-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900">
              {deferredPrompt ? <Download className="h-5 w-5" /> : <Share className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                ホーム画面に追加してアプリ化
              </p>
              {deferredPrompt ? (
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  ワンタップ起動＆地下鉄などのオフライン環境でも営業時間をすぐ確認できます。
                </p>
              ) : (
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Safari下部の <strong>共有ボタン</strong> → <strong>「ホーム画面に追加」</strong> でネイティブアプリのように全画面起動できます。
                </p>
              )}

              {deferredPrompt && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white active:scale-95 dark:bg-white dark:text-slate-900"
                >
                  <Download className="h-3.5 w-3.5" />
                  アプリをインストール
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="案内を閉じる"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
