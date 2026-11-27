import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PromotionItem } from '@/lib/promotions';
import { NativePromoCard } from '../NativePromoCard';

const promoWithUrl: PromotionItem = {
  id: 'pd9-chalk',
  title: 'PD9 液体チョーク',
  subtitle: '松脂不使用・都内ジム対応の定番液体チョーク',
  category: 'chalk',
  badge: 'おすすめギア',
  description: 'ホールドを汚しにくく、都内の多くのジムで使用可能。',
  placement: ['detail', 'gear'],
  affiliateUrl: 'https://af.moshimo.com/example-pd9',
  ctaLabel: '詳細を見る',
  active: true,
};

describe('NativePromoCard', () => {
  it('renders nothing when item is null or missing affiliateUrl', () => {
    const { container: c1 } = render(<NativePromoCard item={null} />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <NativePromoCard item={{ ...promoWithUrl, affiliateUrl: undefined }} />,
    );
    expect(c2.firstChild).toBeNull();
  });

  it('renders PR disclosure and sponsored link when valid affiliateUrl is set', () => {
    render(<NativePromoCard item={promoWithUrl} />);
    expect(screen.getByText('PR')).toBeTruthy();
    const link = screen.getByRole('link', { name: /PD9 液体チョーク/ });
    expect(link.getAttribute('href')).toBe('https://af.moshimo.com/example-pd9');
    expect(link.getAttribute('rel')).toContain('sponsored');
  });
});
