import { describe, it, expect } from 'vitest';
import {
  extractDateRanges,
  extractSpecialHours,
  extractScheduleEventFromArticle,
} from '../text-extractor';

describe('extractDateRanges', () => {
  const refDate = new Date('2026-11-24T00:00:00Z');

  it('parses full Japanese date range across month boundary', () => {
    const ranges = extractDateRanges(
      '全面ホールド替えのため、2026年11月30日（月）～12月4日（金）はお休みとなります。',
      refDate,
    );
    expect(ranges).toEqual([{ startDate: '2026-11-30', endDate: '2026-12-04' }]);
  });

  it('parses slash-formatted range without explicit year and handles Dec->Jan rollover', () => {
    const decRef = new Date('2026-12-20T00:00:00Z');
    const ranges = extractDateRanges('年末年始休業のお知らせ：12/30(水)〜1/2(土)', decRef);
    expect(ranges).toEqual([{ startDate: '2026-12-30', endDate: '2027-01-02' }]);
  });

  it('parses single Japanese date with day-of-week', () => {
    const ranges = extractDateRanges('11月26日（木）20:00〜 2F B Wallホールド外し', refDate);
    expect(ranges).toEqual([{ startDate: '2026-11-26', endDate: '2026-11-26' }]);
  });

  it('parses consecutive days joined by ・', () => {
    const ranges = extractDateRanges('11月28日・29日 Climbing Shoes Summit開催', refDate);
    expect(ranges).toEqual([{ startDate: '2026-11-28', endDate: '2026-11-29' }]);
  });
});

describe('extractSpecialHours', () => {
  it('extracts HH:MM range from Japanese shortening notice', () => {
    expect(extractSpecialHours('イベント準備のため 13:00〜19:00 の時短営業となります')).toEqual({
      open: '13:00',
      close: '19:00',
    });
    expect(extractSpecialHours('営業時間変更：10:00 - 18:30')).toEqual({
      open: '10:00',
      close: '18:30',
    });
  });

  it('returns undefined when no valid time range exists', () => {
    expect(extractSpecialHours('通常通り営業いたします')).toBeUndefined();
  });
});

describe('extractScheduleEventFromArticle', () => {
  const refDate = new Date('2026-11-24T00:00:00Z');

  it('classifies full hold change closure', () => {
    const ev = extractScheduleEventFromArticle(
      {
        title: '【調布店】全面ホールド替えによる休業のお知らせ',
        body: '2026年11月30日（月）～12月4日（金）の5日間、全面ホールド替えのため休業いたします。',
        url: 'https://www.westrock-climbing.com/news/123',
        publishedAt: '2026-11-20T00:00:00Z',
      },
      { gymId: 'westrock-chofu', sourceLabel: '公式サイトRSS', storeKeyword: '調布' },
      refDate,
    );

    expect(ev).not.toBeNull();
    expect(ev?.type).toBe('hold_change_full');
    expect(ev?.startDate).toBe('2026-11-30');
    expect(ev?.endDate).toBe('2026-12-04');
  });

  it('skips multi-store article that does not match storeKeyword', () => {
    const ev = extractScheduleEventFromArticle(
      {
        title: '【調布店】全面ホールド替えによる休業のお知らせ',
        body: '2026年11月30日（月）～12月4日（金）は調布店お休みです。',
        url: 'https://www.westrock-climbing.com/news/123',
        publishedAt: '2026-11-20T00:00:00Z',
      },
      { gymId: 'westrock-fuchu', sourceLabel: '公式サイトRSS', storeKeyword: '府中' },
      refDate,
    );

    expect(ev).toBeNull();
  });

  it('classifies partial hold change when wall set does not close whole gym', () => {
    const ev = extractScheduleEventFromArticle(
      {
        title: '2F壁ホールド替えのお知らせ',
        body: '11月26日（木）は2F壁のホールド外し・セットを行います。他エリアは通常営業です。',
        url: 'https://pump-climbing.com/gym/akiba/news/456',
        publishedAt: '2026-11-22T00:00:00Z',
      },
      { gymId: 'bpump-akiba', sourceLabel: '公式サイトRSS' },
      refDate,
    );

    expect(ev?.type).toBe('hold_change_partial');
    expect(ev?.startDate).toBe('2026-11-26');
  });

  it('classifies hours_change and attaches specialHours', () => {
    const ev = extractScheduleEventFromArticle(
      {
        title: '12月5日 時短営業のお知らせ',
        body: '12月5日（土）はイベント準備のため 10:00〜18:00 の時短営業となります。',
        url: 'https://example.com/hours',
        publishedAt: '2026-11-24T00:00:00Z',
      },
      { gymId: 'bpump-ogikubo', sourceLabel: '公式サイトRSS' },
      refDate,
    );

    expect(ev?.type).toBe('hours_change');
    expect(ev?.specialHours).toEqual({ open: '10:00', close: '18:00' });
  });

  it('ignores irrelevant blog posts with no schedule keywords', () => {
    const ev = extractScheduleEventFromArticle(
      {
        title: '新作チョークバッグ入荷しました！',
        body: '11月24日より店頭にて販売開始です。ぜひチェックしてください。',
        url: 'https://example.com/shop',
        publishedAt: '2026-11-24T00:00:00Z',
      },
      { gymId: 'bpump-ogikubo', sourceLabel: '公式サイトRSS' },
      refDate,
    );

    expect(ev).toBeNull();
  });
});
