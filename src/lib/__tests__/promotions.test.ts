import { describe, it, expect } from 'vitest';
import { getActivePromotions, type PromotionItem } from '../promotions';

const samplePromotions: PromotionItem[] = [
  {
    id: 'chalk-liquid',
    title: '液体チョーク（定番）',
    subtitle: '粉飛散NGのジムでも使える必須アイテム',
    category: 'chalk',
    badge: '消耗品',
    description: '手汗対策・下地づくりに定番の液体チョーク。',
    placement: ['gear', 'detail'],
    affiliateUrl: 'https://af.moshimo.com/example-chalk',
    active: true,
  },
  {
    id: 'tape-unconfigured',
    title: 'クライミングテーピング',
    subtitle: '指皮保護の定番',
    category: 'tape',
    badge: 'ケア',
    description: 'まだアフィリエイトURL未設定のガイドアイテム。',
    placement: ['gear', 'infeed'],
    active: true,
  },
  {
    id: 'expired-sponsor',
    title: '終了済みキャンペーン',
    subtitle: '過去のスポンサー枠',
    category: 'sponsor',
    badge: 'PR',
    description: '期限切れ。',
    placement: ['infeed'],
    affiliateUrl: 'https://example.com/expired',
    startsAt: '2026-01-01',
    endsAt: '2026-01-31',
    active: true,
  },
];

describe('promotions filtering', () => {
  it('requires affiliateUrl for infeed and detail placements so unconfigured items stay hidden', () => {
    const infeed = getActivePromotions(samplePromotions, 'infeed', '2026-11-27');
    expect(infeed).toHaveLength(0);

    const detail = getActivePromotions(samplePromotions, 'detail', '2026-11-27');
    expect(detail.map((p) => p.id)).toEqual(['chalk-liquid']);
  });

  it('includes active guide items on the gear page even before affiliateUrl is configured', () => {
    const gear = getActivePromotions(samplePromotions, 'gear', '2026-11-27');
    expect(gear.map((p) => p.id)).toEqual(['chalk-liquid', 'tape-unconfigured']);
  });
});
