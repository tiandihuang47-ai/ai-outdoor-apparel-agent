import { NextRequest, NextResponse } from 'next/server';
import { parseRequirement } from '@/lib/parseRequirement';
import { generatePlan } from '@/lib/generatePlan';
import type { GenerateRequest, GenerationResult } from '@/types';

interface ScenarioTier {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  multiplier: number;
  minPrice: number;
}

interface Scenario {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  targetPrice: number;
  result: GenerationResult;
}

const TIERS: ScenarioTier[] = [
  { tier: 'basic', tierName: '基础版', multiplier: 0.65, minPrice: 39 },
  { tier: 'mid', tierName: '中端版', multiplier: 1.0, minPrice: 0 },
  { tier: 'premium', tierName: '高端版', multiplier: 1.45, minPrice: 0 },
];

function roundToTen(price: number): number {
  return Math.round(price / 10) * 10;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    const rawRequirement = body.formData || { text: body.text };
    if (!rawRequirement.text && !rawRequirement.category) {
      if (body.text) {
        rawRequirement.text = body.text;
      }
    }

    const parsedRequirement = await parseRequirement(rawRequirement);
    const scenarios: Scenario[] = [];

    for (const tier of TIERS) {
      const targetPrice = Math.max(
        roundToTen(parsedRequirement.targetPrice * tier.multiplier),
        tier.minPrice
      );

      const adjustedRequirement = {
        ...parsedRequirement,
        targetPrice,
      };

      scenarios.push({
        tier: tier.tier,
        tierName: tier.tierName,
        targetPrice,
        result: await generatePlan(adjustedRequirement),
      });
    }

    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error('Scenario generation error:', error);
    const message = error instanceof Error ? error.message : '生成失败，请重试';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
