import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdSlot } from '../AdSlot';

describe('AdSlot component', () => {
  it('renders nothing when client or slot is missing or invalid', () => {
    const { container: c1 } = render(<AdSlot variant="infeed" client="" slot="1234567890" />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <AdSlot variant="detail" client="ca-pub-1234567890123456" slot="" />,
    );
    expect(c2.firstChild).toBeNull();
  });

  it('renders a CLS-safe container with PR label and adsbygoogle ins tag when configured', () => {
    const { container } = render(
      <AdSlot
        variant="infeed"
        client="ca-pub-1234567890123456"
        slot="9876543210"
      />,
    );

    expect(screen.getByText('PR / 広告')).toBeTruthy();
    const ins = container.querySelector('ins.adsbygoogle');
    expect(ins).not.toBeNull();
    expect(ins?.getAttribute('data-ad-client')).toBe('ca-pub-1234567890123456');
    expect(ins?.getAttribute('data-ad-slot')).toBe('9876543210');
  });
});
