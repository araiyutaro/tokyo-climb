import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Gym } from '@/lib/schema';
import { evaluateGymDayStatus } from '@/lib/schedule';
import { GymDetailSheet } from '../GymDetailSheet';

const mockGym: Gym = {
  id: 'mitaka-gym',
  name: '三鷹ジム',
  chain: '独立系',
  area: 'chuo-west',
  prefecture: '東京都',
  address: '東京都武蔵野市中町1-1-8',
  nearestStation: '三鷹駅 北口 徒歩1分',
  regularHours: {
    mon: { open: '13:00', close: '24:00' },
    tue: { open: '13:00', close: '24:00' },
    wed: { open: '13:00', close: '24:00' },
    thu: { open: '13:00', close: '24:00' },
    fri: { open: '13:00', close: '24:00' },
    sat: { open: '10:00', close: '21:00' },
    sun: { open: '10:00', close: '21:00' },
    holiday: { open: '10:00', close: '21:00' },
  },
  links: {
    website: 'http://mitakagym.com/',
  },
};

describe('GymDetailSheet mobile touch & close behavior', () => {
  it('closes cleanly when tapping the close (X) button via mobile touch sequence and does not start dragging', () => {
    const onClose = vi.fn();
    const dayStatus = evaluateGymDayStatus(mockGym, '2026-11-25', []);

    render(
      <GymDetailSheet
        dayStatus={dayStatus}
        todayStr="2026-11-25"
        allEvents={[]}
        isFavorite={false}
        visitedToday={false}
        onLogVisit={vi.fn()}
        onToggleFavorite={vi.fn()}
        onClose={onClose}
      />,
    );

    const closeBtn = screen.getByRole('button', { name: '詳細を閉じる' });
    const dialog = screen.getByRole('dialog');
    const sheetCard = dialog.firstElementChild as HTMLElement;

    // Simulate mobile touch tap on close button (touchStart -> touchEnd -> click)
    const initialClassName = sheetCard.className;
    fireEvent.touchStart(closeBtn, { touches: [{ clientY: 120 }] });
    // Should NOT start dragging or toggle animation class on button touch
    expect(sheetCard.style.transform).toBe('');
    expect(sheetCard.className).toBe(initialClassName);
    fireEvent.touchEnd(closeBtn);
    expect(sheetCard.className).toBe(initialClassName);
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when swiping downward past threshold on the drag handle area', () => {
    const onClose = vi.fn();
    const dayStatus = evaluateGymDayStatus(mockGym, '2026-11-25', []);

    render(
      <GymDetailSheet
        dayStatus={dayStatus}
        todayStr="2026-11-25"
        allEvents={[]}
        isFavorite={false}
        visitedToday={false}
        onLogVisit={vi.fn()}
        onToggleFavorite={vi.fn()}
        onClose={onClose}
      />,
    );

    const handle = screen.getByTestId('sheet-drag-handle');
    fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(handle, { touches: [{ clientY: 230 }] });
    fireEvent.touchEnd(handle);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not trigger swipe drag when starting touch on the favorite button', () => {
    const onClose = vi.fn();
    const onToggleFavorite = vi.fn();
    const dayStatus = evaluateGymDayStatus(mockGym, '2026-11-25', []);

    render(
      <GymDetailSheet
        dayStatus={dayStatus}
        todayStr="2026-11-25"
        allEvents={[]}
        isFavorite={false}
        visitedToday={false}
        onLogVisit={vi.fn()}
        onToggleFavorite={onToggleFavorite}
        onClose={onClose}
      />,
    );

    const favBtn = screen.getByRole('button', { name: 'お気に入りに追加' });
    fireEvent.touchStart(favBtn, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(favBtn, { touches: [{ clientY: 240 }] });
    fireEvent.touchEnd(favBtn);
    fireEvent.click(favBtn);

    expect(onToggleFavorite).toHaveBeenCalledWith('mitaka-gym');
    expect(onClose).not.toHaveBeenCalled();
  });
});
