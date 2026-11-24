import crypto from 'crypto';
import { ScheduleEventSchema, type Gym, type ScheduleEvent } from '@/lib/schema';
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

interface GeminiImageBatchPayload {
  events?: Array<Omit<GeminiCandidatePayload, 'isScheduleEvent'>>;
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

/**
 * Extracts multiple schedule events from a gym's monthly calendar image or Instagram screenshot
 * using Gemini Vision (multimodal). Returns [] if GEMINI_API_KEY is not configured.
 */
export async function extractFromImageWithGemini(
  base64Data: string,
  mimeType: string,
  gym: Gym,
  sourceUrl: string,
  sourceLabel = 'カレンダー画像（AI解析）',
  referenceDate: Date = new Date(),
): Promise<ScheduleEvent[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = `あなたは日本のボルダリングジムの月間カレンダー画像解析エンジンです。
対象店舗: ${gym.name}
今日の日付: ${referenceDate.toISOString().slice(0, 10)}

添付されたカレンダー画像やSNS告知画像から、「臨時休業」「全面ホールド替え休業」「一部壁ホールド替え」「時短・特別営業」「コンペ・イベント」に該当する予定をすべて抽出し、JSON配列で返してください。通常の営業日は含めないでください。

出力JSON形式:
{
  "events": [
    {
      "type": "closed" | "hold_change_full" | "hold_change_partial" | "hours_change" | "event",
      "title": "簡潔なタイトル",
      "description": "補足（任意）",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "specialHours": { "open": "HH:MM", "close": "HH:MM" },
      "affectedAreas": ["2F壁"]
    }
  ]
}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) return [];

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return [];

    const payload = JSON.parse(rawText) as GeminiImageBatchPayload;
    const valid: ScheduleEvent[] = [];

    for (const item of payload.events ?? []) {
      if (!item.type || !item.startDate || !item.title) continue;
      const hash = crypto
        .createHash('sha1')
        .update(`${gym.id}|vision|${item.startDate}|${item.title}`)
        .digest('hex')
        .slice(0, 10);

      const parsed = ScheduleEventSchema.safeParse({
        id: `ai-img-${gym.id}-${item.startDate}-${hash}`,
        gymId: gym.id,
        type: item.type,
        title: item.title.slice(0, 120),
        description: item.description,
        startDate: item.startDate,
        endDate: item.endDate || item.startDate,
        specialHours: item.type === 'hours_change' ? item.specialHours : undefined,
        affectedAreas: item.affectedAreas,
        source: {
          url: sourceUrl,
          label: sourceLabel,
          confidence: 'ai_extracted',
          fetchedAt: referenceDate.toISOString(),
        },
      });
      if (parsed.success) valid.push(parsed.data);
    }

    return valid;
  } catch {
    return [];
  }
}
