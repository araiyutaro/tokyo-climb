import crypto from 'crypto';
import { ScheduleEventSchema, type ScheduleEvent } from '@/lib/schema';
import type { ExtractContext, FeedArticle } from './types';

interface GeminiCandidatePayload {
  isScheduleEvent: boolean;
  type?: 'closed' | 'hold_change_full' | 'hold_change_partial' | 'hours_change' | 'event';
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  specialHours?: { open: string; close: string };
  affectedAreas?: string[];
}

/**
 * Optional Gemini 2.5 Flash extractor for ambiguous gym announcements or SNS text.
 * Gracefully returns null when GEMINI_API_KEY is not configured.
 */
export async function extractWithGemini(
  article: FeedArticle,
  context: ExtractContext,
  referenceDate: Date = new Date(),
): Promise<ScheduleEvent | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = `あなたは日本のボルダリングジムの営業・ホールド替え情報抽出エンジンです。
今日の日付は ${referenceDate.toISOString().slice(0, 10)} です。
以下の告知文が「臨時休業」「全面ホールド替え休業」「一部壁ホールド替え」「時短・特別営業」「コンペ/イベント」のいずれかに該当する場合、JSONのみで返してください。該当しない場合や日付が特定できない場合は {"isScheduleEvent": false} を返してください。
${context.storeKeyword ? `対象店舗キーワード: ${context.storeKeyword}（他店舗のみの情報なら isScheduleEvent: false にしてください）` : ''}

タイトル: ${article.title}
本文: ${article.body.slice(0, 1200)}

出力JSON形式:
{
  "isScheduleEvent": boolean,
  "type": "closed" | "hold_change_full" | "hold_change_partial" | "hours_change" | "event",
  "title": "簡潔なタイトル",
  "description": "補足（任意）",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "specialHours": { "open": "HH:MM", "close": "HH:MM" },
  "affectedAreas": ["2F壁"]
}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const extracted = JSON.parse(rawText) as GeminiCandidatePayload;
    if (!extracted.isScheduleEvent || !extracted.type || !extracted.startDate) {
      return null;
    }

    const hash = crypto
      .createHash('sha1')
      .update(`${context.gymId}|gemini|${article.url}|${extracted.startDate}`)
      .digest('hex')
      .slice(0, 10);

    const parsed = ScheduleEventSchema.safeParse({
      id: `ai-${context.gymId}-${extracted.startDate}-${hash}`,
      gymId: context.gymId,
      type: extracted.type,
      title: extracted.title || article.title.slice(0, 120),
      description: extracted.description,
      startDate: extracted.startDate,
      endDate: extracted.endDate || extracted.startDate,
      specialHours: extracted.type === 'hours_change' ? extracted.specialHours : undefined,
      affectedAreas: extracted.affectedAreas,
      source: {
        url: article.url,
        label: context.sourceLabel,
        confidence: 'ai_extracted',
        fetchedAt: referenceDate.toISOString(),
      },
    });

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
