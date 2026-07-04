import { NextRequest, NextResponse } from 'next/server';
import { saveCode } from '@/lib/kv';
import { generateCode, sendVerificationCode } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: '请输入有效邮箱' }, { status: 400 });
    }

    const code = generateCode();
    await saveCode(email, code);
    const result = await sendVerificationCode(email, code);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      testCode: result.code,
    });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}
