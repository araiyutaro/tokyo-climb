import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { EventsFileSchema, ScheduleEventSchema } from '@/lib/schema';
import {
  removeOverrideEvent,
  serializeOverridesFile,
  upsertOverrideEvent,
} from '@/lib/overrides-store';

const OVERRIDES_PATH = path.resolve(process.cwd(), 'data', 'overrides.json');

async function readOverrides() {
  const raw = await fs.readFile(OVERRIDES_PATH, 'utf8');
  return EventsFileSchema.parse(JSON.parse(raw));
}

export async function GET() {
  try {
    const file = await readOverrides();
    return NextResponse.json(file);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'overrides.json の読み込みに失敗しました。' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedEvent = ScheduleEventSchema.safeParse(body);
    if (!parsedEvent.success) {
      return NextResponse.json(
        { error: '入力内容に誤りがあります。', details: parsedEvent.error.flatten() },
        { status: 400 },
      );
    }

    const current = await readOverrides();
    const updated = upsertOverrideEvent(current.events, parsedEvent.data);
    const content = serializeOverridesFile(updated, new Date());

    try {
      await fs.writeFile(OVERRIDES_PATH, content, 'utf8');
    } catch {
      return NextResponse.json(
        {
          error:
            '現在のホスティング環境は読み取り専用のため保存できません。JSONコピー機能で data/overrides.json に反映してください。',
          readOnly: true,
        },
        { status: 403 },
      );
    }

    revalidatePath('/');
    revalidatePath('/import');
    return NextResponse.json({ ok: true, event: parsedEvent.data, events: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '保存中にエラーが発生しました。' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id パラメータが必要です。' }, { status: 400 });
    }

    const current = await readOverrides();
    const updated = removeOverrideEvent(current.events, id);
    const content = serializeOverridesFile(updated, new Date());

    try {
      await fs.writeFile(OVERRIDES_PATH, content, 'utf8');
    } catch {
      return NextResponse.json(
        { error: '読み取り専用環境のため削除できません。', readOnly: true },
        { status: 403 },
      );
    }

    revalidatePath('/');
    revalidatePath('/import');
    return NextResponse.json({ ok: true, events: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '削除中にエラーが発生しました。' },
      { status: 500 },
    );
  }
}
