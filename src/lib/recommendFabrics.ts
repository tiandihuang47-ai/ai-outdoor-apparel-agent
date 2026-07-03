import type { ParsedRequirement, Fabric, FabricScore } from '@/types';
import fabricsData from '@/data/fabrics.json';
import { chatCompletion, isMockMode } from './aiClient';

export async function recommendFabrics(requirement: ParsedRequirement): Promise<FabricScore[]> {
  const fabrics = fabricsData as Fabric[];

  let relevantFabrics = fabrics.filter((f) => f.suitableProducts.includes(requirement.category));

  // Fallback: if no specific fabrics for this category, use all fabrics
  if (relevantFabrics.length === 0) {
    relevantFabrics = fabrics;
  }

  const scored = relevantFabrics.map((fabric) => {
    const sceneScore = calculateSceneScore(fabric, requirement);
    const functionScore = calculateFunctionScore(fabric, requirement);
    const priceScore = calculatePriceScore(fabric, requirement);
    const quickResponseScore = calculateQuickResponseScore(fabric, requirement);
    const seasonScore = calculateSeasonScore(fabric, requirement);

    const totalScore =
      sceneScore * 0.25 +
      functionScore * 0.25 +
      priceScore * 0.2 +
      quickResponseScore * 0.2 +
      seasonScore * 0.1;

    const recommendationReason = generateRecommendationReason(fabric, requirement, totalScore);

    return {
      fabric,
      totalScore,
      sceneScore,
      functionScore,
      priceScore,
      quickResponseScore,
      seasonScore,
      recommendationReason,
    } as FabricScore;
  });

  scored.sort((a, b) => b.totalScore - a.totalScore);

  const top5 = scored.slice(0, 5);

  // Use AI to re-rank and refine reasons if real AI is available
  if (!isMockMode() && top5.length > 1) {
    try {
      const aiRanked = await aiRankFabrics(requirement, top5);
      if (aiRanked && aiRanked.length > 0) {
        return applyAiRanking(top5, aiRanked);
      }
    } catch (error) {
      console.warn('AI fabric ranking failed, using rule-based result:', error);
    }
  }

  return labelTop3(top5);
}

function labelTop3(top: FabricScore[]): FabricScore[] {
  const top3 = top.slice(0, 3);
  if (top3.length === 0) return [];

  if (top3.length === 3) {
    const sorted = [...top3].sort((a, b) => a.fabric.pricePerMeter - b.fabric.pricePerMeter);
    return [
      { ...sorted[0], recommendationReason: `【方案A：成本优先】${sorted[0].recommendationReason}` },
      { ...sorted[1], recommendationReason: `【方案B：性能均衡】${sorted[1].recommendationReason}` },
      { ...sorted[2], recommendationReason: `【方案C：高性能方案】${sorted[2].recommendationReason}` },
    ];
  }

  return top3;
}

interface AiFabricRanking {
  fabricId: string;
  rank: number;
  reason: string;
}

async function aiRankFabrics(
  requirement: ParsedRequirement,
  candidates: FabricScore[]
): Promise<AiFabricRanking[]> {
  const systemPrompt = `你是一位资深的户外服装面料推荐专家。请根据用户需求，从候选面料中选出最合适的 3 款，并给出专业、简洁的推荐理由。
只返回 JSON 数组，不要返回其他内容。格式示例：
[
  { "fabricId": "fabric_001", "rank": 1, "reason": "..." },
  { "fabricId": "fabric_002", "rank": 2, "reason": "..." },
  { "fabricId": "fabric_003", "rank": 3, "reason": "..." }
]`;

  const userPrompt = `用户需求：
- 品类：${requirement.category}
- 目标人群：${requirement.ageRange}${requirement.gender}
- 使用场景：${requirement.scenes.join('、')}
- 季节：${requirement.season}
- 目标价格：${requirement.targetPrice}元
- 订单量：${requirement.orderQuantity}件
- 功能优先级：${requirement.functionPriorities.join(' > ')}
- 风格定位：${requirement.stylePositioning}
- 小单快反：${requirement.quickResponseRequired ? '是' : '否'}
- 用户款式关键词：${requirement.styleKeywords?.join('、') || '无'}

候选面料（按规则评分从高到低）：
${candidates
  .map(
    (c, i) =>
      `${i + 1}. ID=${c.fabric.id}, 名称=${c.fabric.name}, 成分=${c.fabric.composition}, 克重=${c.fabric.weightGsm}g/㎡, 米价=${c.fabric.pricePerMeter}元, 静水压=${c.fabric.hydrostaticHead || 0}mm, 透湿=${c.fabric.breathability || 0}, 防风=${c.fabric.windproof ? '是' : '否'}, 弹力=${c.fabric.elasticity}, 保暖=${c.fabric.warmLevel || '普通'}, 现货=${c.fabric.stockStatus}, 起订=${c.fabric.moqMeters}米, 适用场景=${c.fabric.suitableScenes.join('、')}, 风险=${c.fabric.riskNotes}`
  )
  .join('\n')}

请返回排名前 3 的面料 JSON 数组，reason 控制在 30 字以内，突出为什么适合该需求。`;

  const response = await chatCompletion(systemPrompt, userPrompt);
  return parseAiRanking(response, candidates.map((c) => c.fabric.id));
}

function parseAiRanking(response: string, validIds: string[]): AiFabricRanking[] {
  const cleaned = response.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) return [];

  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as AiFabricRanking[];
  return parsed
    .filter((item) => validIds.includes(item.fabricId))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);
}

function applyAiRanking(top5: FabricScore[], aiRanked: AiFabricRanking[]): FabricScore[] {
  const fabricMap = new Map(top5.map((item) => [item.fabric.id, item]));

  const ranked = aiRanked
    .map((ranking) => {
      const item = fabricMap.get(ranking.fabricId);
      if (!item) return null;
      return {
        ...item,
        recommendationReason: ranking.reason,
      };
    })
    .filter(Boolean) as FabricScore[];

  // Append any remaining candidates if AI returned fewer than 3
  const usedIds = new Set(ranked.map((r) => r.fabric.id));
  for (const item of top5) {
    if (!usedIds.has(item.fabric.id) && ranked.length < 3) {
      ranked.push(item);
    }
  }

  return labelTop3(ranked);
}

function calculateSceneScore(fabric: Fabric, requirement: ParsedRequirement): number {
  const matchCount = requirement.scenes.filter((s) => fabric.suitableScenes.includes(s)).length;

  if (matchCount === 0) return 20;
  if (matchCount >= requirement.scenes.length) return 100;
  return 100 * (matchCount / requirement.scenes.length);
}

function calculateFunctionScore(fabric: Fabric, requirement: ParsedRequirement): number {
  let score = 50;

  for (const func of requirement.functionPriorities) {
    switch (func) {
      case '防水':
        if (fabric.hydrostaticHead >= 10000) score += 25;
        else if (fabric.hydrostaticHead >= 5000) score += 15;
        else if (fabric.hydrostaticHead > 0) score += 5;
        else score -= 20;
        break;
      case '防泼水':
        if (fabric.waterRepellent && fabric.waterRepellent !== '无') score += 20;
        else score -= 10;
        break;
      case '防风':
        if (fabric.windproof) score += 20;
        else score -= 20;
        break;
      case '透湿':
        if (fabric.breathability >= 8000) score += 25;
        else if (fabric.breathability >= 5000) score += 15;
        else if (fabric.breathability >= 3000) score += 5;
        else score -= 10;
        break;
      case '轻量':
        if (fabric.weightGsm <= 100) score += 25;
        else if (fabric.weightGsm <= 150) score += 15;
        else if (fabric.weightGsm <= 200) score += 5;
        else score -= 5;
        break;
      case '防晒':
        if (fabric.upf && fabric.upf >= 50) score += 25;
        else if (fabric.upf && fabric.upf >= 40) score += 15;
        else score -= 5;
        break;
      case '保暖':
        if (fabric.warmLevel === '高保暖') score += 25;
        else if (fabric.warmLevel === '中等保暖') score += 15;
        else if (fabric.warmLevel) score += 5;
        break;
      case '弹力':
        if (fabric.elasticity === '高弹' || fabric.elasticity === '超高弹') score += 25;
        else if (fabric.elasticity === '中弹') score += 15;
        else if (fabric.elasticity === '微弹') score += 5;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

function calculatePriceScore(fabric: Fabric, requirement: ParsedRequirement): number {
  const estimatedFabricCost = fabric.pricePerMeter * 2.0;
  const targetTotalCost = requirement.targetPrice * 0.35;

  if (estimatedFabricCost <= targetTotalCost) return 100;
  if (estimatedFabricCost <= targetTotalCost * 1.3) return 70;
  if (estimatedFabricCost <= targetTotalCost * 1.6) return 40;
  return 10;
}

function calculateQuickResponseScore(fabric: Fabric, requirement: ParsedRequirement): number {
  let score = 50;

  if (requirement.quickResponseRequired) {
    if (fabric.stockStatus === '现货') score += 30;
    else score -= 30;

    if (fabric.moqMeters <= requirement.orderQuantity) score += 20;
    else if (fabric.moqMeters <= requirement.orderQuantity * 3) score += 10;
    else score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateSeasonScore(fabric: Fabric, requirement: ParsedRequirement): number {
  const matches = fabric.suitableSeasons.includes(requirement.season);
  return matches ? 100 : 30;
}

function generateRecommendationReason(
  fabric: Fabric,
  requirement: ParsedRequirement,
  totalScore: number
): string {
  const sceneText = fabric.suitableScenes.join('、');
  const reasons: string[] = [];
  const isFallback = !fabric.suitableProducts.includes(requirement.category);

  if (isFallback) {
    reasons.push(`系统暂未收录「${requirement.category}」的专属面料，以下为通用参考面料`);
  }
  if (totalScore >= 80) reasons.push('综合匹配度高');
  if (fabric.stockStatus === '现货') reasons.push('现货面料');
  if (requirement.quickResponseRequired && fabric.stockStatus === '现货') {
    reasons.push('适合小单快反');
  }
  if (fabric.stockStatus === '需定织') reasons.push('需定织，注意交期');

  const priceEstimate = fabric.pricePerMeter * 2.0;
  if (priceEstimate <= requirement.targetPrice * 0.35) {
    reasons.push('面料成本在预算范围内');
  } else if (priceEstimate <= requirement.targetPrice * 0.45) {
    reasons.push('面料成本略高但可控');
  } else {
    reasons.push('面料成本偏高');
  }

  reasons.push(`适合场景：${sceneText}`);
  reasons.push(fabric.riskNotes);

  return reasons.join('。');
}
