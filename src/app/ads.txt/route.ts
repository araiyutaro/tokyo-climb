import { NextResponse } from 'next/server';
import { buildAdsTxtLine, getAdSenseConfig } from '@/lib/site';

export function GET() {
  const { client } = getAdSenseConfig();
  const line = buildAdsTxtLine(client);

  if (!line) {
    return new NextResponse('ads.txt is not configured yet.\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new NextResponse(`${line}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
