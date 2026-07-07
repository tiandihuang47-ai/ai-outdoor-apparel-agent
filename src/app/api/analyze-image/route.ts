import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/analyzeImage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: '请上传图片' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '请上传图片文件' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '图片大小不能超过 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const result = await analyzeImage(buffer);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Image analysis error:', error);
    const message = error instanceof Error ? error.message : '图片分析失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
