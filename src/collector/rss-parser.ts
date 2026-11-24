import * as cheerio from 'cheerio';
import type { FeedArticle } from './types';

function stripHtml(html: string): string {
  const $ = cheerio.load(`<div>${html}</div>`);
  $('script, style, noscript').remove();
  return $('div')
    .text()
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseFeedXml(xml: string): FeedArticle[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const articles: FeedArticle[] = [];

  // RSS 2.0 <item>
  $('item').each((_, el) => {
    const title = $(el).find('title').first().text().trim();
    const url = $(el).find('link').first().text().trim();
    const contentEncoded = $(el).find('content\\:encoded').first().text();
    const description = $(el).find('description').first().text();
    const body = stripHtml(contentEncoded || description || '');
    const pubDate = $(el).find('pubDate').first().text().trim() || undefined;

    if (title && url) {
      articles.push({
        title,
        body,
        url,
        publishedAt: pubDate,
      });
    }
  });

  if (articles.length > 0) return articles;

  // Atom <entry>
  $('entry').each((_, el) => {
    const title = $(el).find('title').first().text().trim();
    const linkEl = $(el).find('link[rel="alternate"]').first().length
      ? $(el).find('link[rel="alternate"]').first()
      : $(el).find('link').first();
    const url = (linkEl.attr('href') || linkEl.text()).trim();
    const content = $(el).find('content').first().text();
    const summary = $(el).find('summary').first().text();
    const body = stripHtml(content || summary || '');
    const updated =
      $(el).find('updated').first().text().trim() ||
      $(el).find('published').first().text().trim() ||
      undefined;

    if (title && url) {
      articles.push({
        title,
        body,
        url,
        publishedAt: updated,
      });
    }
  });

  return articles;
}

export function parseHtmlNewsPage(html: string, baseUrl: string): FeedArticle[] {
  const $ = cheerio.load(html);
  $('script, style, noscript, nav, footer, aside, .sidebar, .widget').remove();
  const articles: FeedArticle[] = [];
  const seenUrls = new Set<string>();

  $('article, .news-item, .post, li, tr').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length < 10 || text.length > 600) return;

    // Look for climbing schedule related keywords + date indicator
    if (!/(ホールド|セット|休業|お休み|時短|営業時間|コンペ|イベント|カレンダー)/.test(text)) {
      return;
    }
    if (!/(\d{1,2}月\d{1,2}日|\d{1,2}\/\d{1,2})/.test(text)) {
      return;
    }

    const linkHref = $(el).find('a[href]').first().attr('href');
    let url = baseUrl;
    if (linkHref) {
      try {
        url = new URL(linkHref, baseUrl).toString();
      } catch {
        url = baseUrl;
      }
    }

    const dedupeKey = `${url}::${text.slice(0, 40)}`;
    if (seenUrls.has(dedupeKey)) return;
    seenUrls.add(dedupeKey);

    const heading = $(el).find('h1, h2, h3, h4, a').first().text().replace(/\s+/g, ' ').trim();
    articles.push({
      title: heading && heading.length >= 4 ? heading.slice(0, 120) : text.slice(0, 80),
      body: text,
      url,
    });
  });

  return articles.slice(0, 20);
}
