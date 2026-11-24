import { describe, it, expect } from 'vitest';
import { parseFeedXml } from '../rss-parser';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Sample Gym News</title>
    <item>
      <title><![CDATA[【調布店】全面ホールド替えのお知らせ]]></title>
      <link>https://www.westrock-climbing.com/news/100</link>
      <pubDate>Fri, 20 Nov 2026 09:00:00 +0000</pubDate>
      <description><![CDATA[<p>2026年11月30日（月）～12月4日（金）はお休みです。</p>]]></description>
    </item>
  </channel>
</rss>`;

const SAMPLE_ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Gym Feed</title>
  <entry>
    <title>12月コンペ開催！</title>
    <link href="https://example.com/comp" />
    <updated>2026-11-22T10:00:00Z</updated>
    <summary>12月12日（土）にマンスリーセッションを開催します。</summary>
  </entry>
</feed>`;

describe('parseFeedXml', () => {
  it('parses WordPress RSS 2.0 XML and strips HTML tags from description', () => {
    const items = parseFeedXml(SAMPLE_RSS);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('【調布店】全面ホールド替えのお知らせ');
    expect(items[0].url).toBe('https://www.westrock-climbing.com/news/100');
    expect(items[0].body).toContain('2026年11月30日（月）～12月4日（金）はお休みです。');
    expect(items[0].body).not.toContain('<p>');
  });

  it('parses Atom XML feeds', () => {
    const items = parseFeedXml(SAMPLE_ATOM);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('12月コンペ開催！');
    expect(items[0].url).toBe('https://example.com/comp');
    expect(items[0].body).toContain('12月12日');
  });
});
