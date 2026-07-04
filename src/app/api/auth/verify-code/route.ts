import { NextRequest, NextResponse } from 'next/server';
import { getCode, deleteCode } from '@/lib/kv';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: '缺少邮箱或验证码' }, { status: 400 });
    }

    const savedCode = await getCode(email);
    if (!savedCode || savedCode !== code.trim()) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
    }

    await deleteCode(email);
    await createSession(email);

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: '验证失败' }, { status: 500 });
  }
}
