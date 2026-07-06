import { parseRequirement } from './parseRequirement';
import { recommendFabrics } from './recommendFabrics';
import { selectStyleTemplate } from './selectStyleTemplate';
import { calculateCost } from './calculateCost';
import { generateMarketingCopy } from './generateMarketingCopy';
import { generateRiskWarnings } from './generateRiskWarnings';
import type { GenerationResult, ParsedRequirement, RawRequirement } from '@/types';

export async function generatePlanFromRaw(raw: RawRequirement): Promise<GenerationResult> {
  const parsedRequirement = await parseRequirement(raw);
  return generatePlan(parsedRequirement);
}

export async function generatePlan(parsedRequirement: ParsedRequirement): Promise<GenerationResult> {
  const fabricRecommendations = await recommendFabrics(parsedRequirement);
  if (fabricRecommendations.length === 0) {
    throw new Error('未找到匹配的面料方案');
  }

  const selectedStyle = selectStyleTemplate(parsedRequirement);
  const selectedFabric = fabricRecommendations[0];
  const costResult = calculateCost(parsedRequirement, selectedFabric.fabric, selectedStyle);
  const marketingCopy = await generateMarketingCopy(parsedRequirement, selectedFabric, selectedStyle);
  const riskWarnings = generateRiskWarnings(parsedRequirement, selectedFabric, selectedStyle, costResult);
  const summary = generateSummary(parsedRequirement, selectedFabric, selectedStyle, costResult);

  return {
    parsedRequirement,
    fabricRecommendations,
    selectedStyle,
    costResult,
    marketingCopy,
    riskWarnings,
    summary,
    techPack: {
      productName: `${parsedRequirement.stylePositioning}${parsedRequirement.category}`,
      category: parsedRequirement.category,
      gender: parsedRequirement.gender,
      season: parsedRequirement.season,
      scenes: parsedRequirement.scenes,
      targetPrice: parsedRequirement.targetPrice,
      stylePositioning: parsedRequirement.stylePositioning,
      sizeChart: [],
      bom: [],
      construction: [],
      colorways: [],
      packaging: {
        hangtag: '',
        washingLabel: '',
        polybag: '',
        carton: '',
        specialNotes: '',
      },
      risks: [],
    },
  };
}

function generateSummary(
  requirement: GenerationResult['parsedRequirement'],
  fabricScore: GenerationResult['fabricRecommendations'][0],
  style: GenerationResult['selectedStyle'],
  cost: GenerationResult['costResult']
): string {
  return `${requirement.stylePositioning}${requirement.category}，面向${requirement.ageRange}${requirement.gender}，零售价${requirement.targetPrice}元以内，首单${requirement.orderQuantity}件。推荐面料：${fabricScore.fabric.name}，预计单件成本${cost.costRangeLow}-${cost.costRangeHigh}元。`;
}
