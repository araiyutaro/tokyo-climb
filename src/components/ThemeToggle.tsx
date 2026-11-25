'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'tokyo-climb:theme:v1';

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isDark ? '#020617' : '#ffffff');
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let initial: ThemeMode = 'system';
    try {
      const saved = window.localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        initial = saved;
      }
    } catch {
      // Ignore storage errors
    }
    setMode(initial);
    applyTheme(initial);
    setMounted(true);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOsChange = () => {
      try {
        const cur = (window.localStorage.getItem(THEME_KEY) as ThemeMode | null) || 'system';
        if (cur === 'system') applyTheme('system');
      } catch {
        // Ignore
      }
    };
    mq.addEventListener('change', handleOsChange);
    return () => mq.removeEventListener('change', handleOsChange);
  }, []);

  const cycleMode = () => {
    const next: ThemeMode = mode === 'system' ? 'dark' : mode === 'dark' ? 'light' : 'system';
    setMode(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Ignore
    }
    applyTheme(next);
  };

  const label =
    mode === 'dark' ? 'ダークモード' : mode === 'light' ? 'ライトモード' : 'テーマ: システム連動';

  return (
    <button
      type="button"
      onClick={cycleMode}
      aria-label={`テーマ切替（現在: ${label}）`}
      title={`現在: ${label}（タップで切替）`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-all hover:bg-slate-200 active:scale-90 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:h-9 md:w-9"
    >
      {!mounted || mode === 'system' ? (
        <Monitor className="h-4 w-4" />
      ) : mode === 'dark' ? (
        <Moon className="h-4 w-4 text-amber-300" />
      ) : (
        <Sun className="h-4 w-4 text-amber-500" />
      )}
    </button>
  );
}
