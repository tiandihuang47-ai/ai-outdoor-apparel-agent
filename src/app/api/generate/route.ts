import { NextRequest, NextResponse } from 'next/server';
import { generatePlanFromRaw } from '@/lib/generatePlan';
import type { GenerateRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    const rawRequirement = body.formData || { text: body.text };
    if (!rawRequirement.text && !rawRequirement.category) {
      if (body.text) {
        rawRequirement.text = body.text;
      }
    }

    const result = await generatePlanFromRaw(rawRequirement);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    const message = error instanceof Error ? error.message : '生成失败，请重试';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
