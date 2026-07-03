import { NextRequest, NextResponse } from 'next/server';
import { generateMarketingCopy } from '@/lib/generateMarketingCopy';
import type { GenerationResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { result, tone = 'default' } = body as { result?: GenerationResult; tone?: string };

    if (!result) {
      return NextResponse.json(
        { error: '缺少生成结果' },
        { status: 400 }
      );
    }

    const { parsedRequirement, fabricRecommendations, selectedStyle } = result;
    const selectedFabric = fabricRecommendations[0];

    if (!selectedFabric) {
      return NextResponse.json(
        { error: '未找到推荐面料' },
        { status: 400 }
      );
    }

    // Add variation hint based on tone to encourage different outputs
    const tempRequirement = { ...parsedRequirement };
    if (tone === 'premium') {
      tempRequirement.stylePositioning = `高端${tempRequirement.stylePositioning}`;
      tempRequirement.styleKeywords = [...(tempRequirement.styleKeywords || []), '高端', '品质'];
    } else if (tone === 'youth') {
      tempRequirement.styleKeywords = [...(tempRequirement.styleKeywords || []), '潮流', '年轻'];
    }

    const newCopy = await generateMarketingCopy(tempRequirement, selectedFabric, selectedStyle);
    return NextResponse.json({ marketingCopy: newCopy });
  } catch (error) {
    console.error('Regenerate marketing error:', error);
    const message = error instanceof Error ? error.message : '文案重新生成失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
