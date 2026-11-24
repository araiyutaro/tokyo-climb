import { NextResponse } from 'next/server';
import { loadDataset } from '@/lib/data';
import { extractScheduleEventFromArticle } from '@/collector/text-extractor';
import { extractFromImageWithGemini, extractWithGemini } from '@/collector/llm-extractor';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      gymId?: string;
      text?: string;
      sourceUrl?: string;
      sourceLabel?: string;
      imageBase64?: string;
      imageMimeType?: string;
    };

    const dataset = loadDataset();
    const gym = dataset.gyms.find((g) => g.id === body.gymId);
    if (!gym) {
      return NextResponse.json({ error: '指定されたジムが見つかりません。' }, { status: 400 });
    }

    const now = new Date();
    const sourceUrl =
      body.sourceUrl?.trim() || gym.links.instagram || gym.links.scheduleUrl || gym.links.website;
    const sourceLabel = body.sourceLabel?.trim() || 'SNS・手動取込';
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

    // 1. Image extraction (calendar screenshot / Instagram image)
    if (body.imageBase64 && body.imageMimeType) {
      if (!hasGeminiKey) {
        return NextResponse.json({
          events: [],
          usedAi: false,
          hasGeminiKey: false,
          message:
            '画像の自動解析には環境変数 GEMINI_API_KEY の設定が必要です。テキスト貼付による自動抽出や手動入力はAPIキーなしで利用できます。',
        });
      }

      const events = await extractFromImageWithGemini(
        body.imageBase64,
        body.imageMimeType,
        gym,
        sourceUrl,
        sourceLabel,
        now,
      );
      return NextResponse.json({
        events,
        usedAi: true,
        hasGeminiKey: true,
        message:
          events.length > 0
            ? `画像から ${events.length} 件の予定を抽出しました。内容を確認して登録してください。`
            : '画像から予定を抽出できませんでした。手動で入力してください。',
      });
    }

    // 2. Text extraction (Instagram caption / X post / official notice)
    const rawText = body.text?.trim() ?? '';
    if (!rawText) {
      return NextResponse.json(
        { error: '告知文テキストまたは画像を入力してください。' },
        { status: 400 },
      );
    }

    const firstLine = rawText.split(/\r?\n/).find((l) => l.trim().length > 0) ?? `${gym.name} 予定`;
    const article = {
      title: firstLine.trim().slice(0, 100),
      body: rawText,
      url: sourceUrl,
    };

    const ruleEvent = extractScheduleEventFromArticle(
      article,
      { gymId: gym.id, sourceLabel },
      now,
    );

    if (ruleEvent) {
      return NextResponse.json({
        events: [ruleEvent],
        usedAi: false,
        hasGeminiKey,
        message: '告知文から日程と種別を自動抽出しました。必要に応じて修正して登録してください。',
      });
    }

    if (hasGeminiKey) {
      const aiEvent = await extractWithGemini(article, { gymId: gym.id, sourceLabel }, now);
      if (aiEvent) {
        return NextResponse.json({
          events: [aiEvent],
          usedAi: true,
          hasGeminiKey: true,
          message: 'Gemini AI で予定を抽出しました。内容を確認して登録してください。',
        });
      }
    }

    return NextResponse.json({
      events: [],
      usedAi: false,
      hasGeminiKey,
      message:
        '日付またはホールド替え・休業キーワードを自動判別できませんでした。下のフォームから直接入力して登録できます。',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '解析中にエラーが発生しました。' },
      { status: 500 },
    );
  }
}
