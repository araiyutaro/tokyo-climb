'use client';

import { useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  ImagePlus,
  Mountain,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Gym, ScheduleEvent, ScheduleEventType } from '@/lib/schema';
import { formatDateRangeJa, getEventTypeMeta } from '@/lib/ui-helpers';

interface QuickImportClientProps {
  gyms: Gym[];
  initialOverrides: ScheduleEvent[];
  todayStr: string;
  canSaveLocally: boolean;
}

const EVENT_TYPES: { value: ScheduleEventType; label: string }[] = [
  { value: 'hold_change_full', label: '全面ホールド替え休業（終日休）' },
  { value: 'hold_change_partial', label: '一部壁ホールド替え（エリア制限あり）' },
  { value: 'closed', label: '臨時休業・メンテナンス休館' },
  { value: 'hours_change', label: '時短営業・特別営業時間' },
  { value: 'event', label: 'コンペ・セッション・イベント' },
];

export function QuickImportClient({
  gyms,
  initialOverrides,
  todayStr,
  canSaveLocally,
}: QuickImportClientProps) {
  const [overrides, setOverrides] = useState<ScheduleEvent[]>(initialOverrides);
  const [gymId, setGymId] = useState<string>(gyms[0]?.id ?? '');
  const [rawText, setRawText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePayload, setImagePayload] = useState<{ base64: string; mimeType: string } | null>(
    null,
  );
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  // Structured event form state
  const [eventType, setEventType] = useState<ScheduleEventType>('hold_change_full');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [openTime, setOpenTime] = useState('10:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [affectedAreasText, setAffectedAreasText] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState(gyms[0]?.links.instagram ?? gyms[0]?.links.website ?? '');
  const [sourceLabel, setSourceLabel] = useState('Instagram手動登録');

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const selectedGym = gyms.find((g) => g.id === gymId);
  const gymNameMap = new Map(gyms.map((g) => [g.id, g.name]));

  const handleGymChange = (nextGymId: string) => {
    setGymId(nextGymId);
    const gym = gyms.find((g) => g.id === nextGymId);
    if (gym) {
      setSourceUrl(gym.links.instagram ?? gym.links.scheduleUrl ?? gym.links.website);
    }
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const match = result.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        setImagePreview(result);
        setImagePayload({ mimeType: match[1], base64: match[2] });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    setParsing(true);
    setParseMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymId,
          text: rawText,
          sourceUrl,
          sourceLabel,
          imageBase64: imagePayload?.base64,
          imageMimeType: imagePayload?.mimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setParseMessage(data.error || '解析に失敗しました。');
        return;
      }
      setParseMessage(data.message || null);

      const first: ScheduleEvent | undefined = data.events?.[0];
      if (first) {
        setEventType(first.type);
        setTitle(first.title);
        setStartDate(first.startDate);
        setEndDate(first.endDate);
        if (first.specialHours) {
          setOpenTime(first.specialHours.open);
          setCloseTime(first.specialHours.close);
        }
        setAffectedAreasText((first.affectedAreas ?? []).join(', '));
        setDescription(first.description ?? '');
      }
    } catch {
      setParseMessage('通信エラーが発生しました。');
    } finally {
      setParsing(false);
    }
  };

  const buildEventObject = (): ScheduleEvent => {
    const id = `manual-${gymId}-${startDate}-${Date.now().toString(36)}`;
    const areas = affectedAreasText
      .split(/[,、]/)
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      id,
      gymId,
      type: eventType,
      title: title.trim() || `${selectedGym?.shortName ?? selectedGym?.name ?? gymId} 予定`,
      description: description.trim() || undefined,
      startDate,
      endDate: endDate >= startDate ? endDate : startDate,
      ...(eventType === 'hours_change' ? { specialHours: { open: openTime, close: closeTime } } : {}),
      ...(areas.length > 0 ? { affectedAreas: areas } : {}),
      source: {
        url: sourceUrl.trim() || selectedGym?.links.website || 'https://example.com/',
        label: sourceLabel.trim() || 'SNS手動登録',
        confidence: 'verified',
        fetchedAt: new Date().toISOString(),
      },
    };
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const event = buildEventObject();
      const res = await fetch('/api/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({
          kind: 'err',
          text: data.error || '保存に失敗しました。',
        });
        return;
      }
      setOverrides(data.events);
      setTitle('');
      setDescription('');
      setAffectedAreasText('');
      setRawText('');
      setImagePreview(null);
      setImagePayload(null);
      setStatusMessage({
        kind: 'ok',
        text: 'data/overrides.json に登録しました！トップ画面の一覧・カレンダーにすぐ反映されます。',
      });
    } catch {
      setStatusMessage({ kind: 'err', text: '保存中にエラーが発生しました。' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/overrides?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      setOverrides(data.events);
    }
  };

  const handleCopyJson = async () => {
    const event = buildEventObject();
    await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildGitHubIssueUrl = (): string => {
    const event = buildEventObject();
    const issueTitle = `[予定提供] ${selectedGym?.name ?? gymId}: ${event.title}`;
    const issueBody = [
      '以下の予定情報を提供します（Tokyo Climb SNS取込フォームより生成）:',
      '',
      '```json',
      JSON.stringify(event, null, 2),
      '```',
    ].join('\n');
    return `https://github.com/araiyutaro/tokyo-climb/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              一覧に戻る
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Mountain className="h-4 w-4" />
              </div>
              <h1 className="text-sm font-extrabold text-slate-900 sm:text-base">
                SNS・カレンダー予定 簡易取込
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 pt-6 sm:px-6">
        {/* Step 1: Paste SNS caption or upload screenshot */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">
            1. 対象ジムを選び、Instagram / X の告知文またはカレンダー画像を貼付
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            テキスト貼付はAPIキー不要で日付・ホールド替え種別を自動抽出します。カレンダー画像解析は環境変数
            <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-[11px]">GEMINI_API_KEY</code>
            設定時に Gemini Vision で自動抽出できます。
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">ジムを選択</label>
              <select
                value={gymId}
                onChange={(e) => handleGymChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
              >
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}（{g.nearestStation}）
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                情報源ラベル
              </label>
              <input
                type="text"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700">
              Instagram / X 投稿文・お知らせテキスト
            </label>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="例：12月8日(火)〜12月9日(水)は全面ホールド替えのため休業いたします。12/10(木)は18:00オープンです！"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              <ImagePlus className="h-4 w-4 text-slate-500" />
              カレンダー画像を添付（任意）
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleParse}
              disabled={parsing || (!rawText.trim() && !imagePayload)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              {parsing ? '解析中...' : '自動で日時・種別を抽出'}
            </button>
          </div>

          {imagePreview && (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="添付カレンダー画像"
                className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200"
              />
              <div className="text-xs text-slate-600">
                画像を選択済みです。「自動で日時・種別を抽出」を押してください。
              </div>
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImagePayload(null);
                }}
                className="ml-auto text-xs font-semibold text-rose-600 hover:underline"
              >
                クリア
              </button>
            </div>
          )}

          {parseMessage && (
            <div className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-xs font-medium text-sky-900 ring-1 ring-sky-200">
              {parseMessage}
            </div>
          )}
        </section>

        {/* Step 2: Review / Edit & Save */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">2. 登録内容の確認・編集</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">種別</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as ScheduleEventType)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：12月全面ホールド替え休業"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">開始日</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">終了日</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>

            {eventType === 'hours_change' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">特別 開店時間</label>
                  <input
                    type="text"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    placeholder="10:00"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">特別 閉店時間</label>
                  <input
                    type="text"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    placeholder="18:00"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                制限エリア・壁（任意・カンマ区切り）
              </label>
              <input
                type="text"
                value={affectedAreasText}
                onChange={(e) => setAffectedAreasText(e.target.value)}
                placeholder="例：2F壁, スラブ"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">元URL</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700">詳細メモ（任意）</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900"
            />
          </div>

          {statusMessage && (
            <div
              className={`mt-4 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                statusMessage.kind === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                  : 'bg-rose-50 text-rose-800 ring-1 ring-rose-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {!canSaveLocally && (
            <div className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 ring-1 ring-amber-200">
              公開サイトでは予定データの自動抽出・JSON生成および GitHub Issue での情報提供ツールとして利用できます。
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {canSaveLocally && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                {saving ? '保存中...' : '予定を登録する'}
              </button>
            )}

            <a
              href={buildGitHubIssueUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
            >
              GitHub Issue で情報提供
            </a>

            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'JSONをコピーしました' : 'JSONをコピー（手動反映用）'}
            </button>
          </div>
        </section>

        {/* Step 3: Current manual/SNS overrides */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">
            登録済みの手動・SNS取込予定（{overrides.length}件）
          </h2>
          {overrides.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              まだ手動・SNS取込予定は登録されていません。
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {overrides.map((ev) => {
                const meta = getEventTypeMeta(ev.type);
                return (
                  <li
                    key={ev.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-700">
                          {formatDateRangeJa(ev.startDate, ev.endDate)}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.pillClass}`}>
                          {meta.shortLabel}
                        </span>
                        <span className="font-bold text-slate-900">
                          {gymNameMap.get(ev.gymId) ?? ev.gymId}
                        </span>
                      </div>
                      <p className="mt-0.5 text-slate-700">{ev.title}</p>
                    </div>

                    {canSaveLocally && (
                      <button
                        type="button"
                        onClick={() => handleDelete(ev.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        削除
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
