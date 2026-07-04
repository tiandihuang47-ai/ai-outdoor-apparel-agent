import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { kv, historyKey } from '@/lib/kv';
import type { HistoryItem } from '@/lib/historyStorage';

const MAX_ITEMS = 50;

async function getUserHistory(email: string): Promise<HistoryItem[]> {
  const data = await kv.get<HistoryItem[]>(historyKey(email));
  return Array.isArray(data) ? data : [];
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const history = await getUserHistory(session.email);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json({ error: '读取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body as { items?: HistoryItem[] };
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: '格式错误' }, { status: 400 });
    }

    const limited = items.slice(0, MAX_ITEMS);
    await kv.set(historyKey(session.email), limited);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History POST error:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    await kv.del(historyKey(session.email));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History DELETE error:', error);
    return NextResponse.json({ error: '清空失败' }, { status: 500 });
  }
}
