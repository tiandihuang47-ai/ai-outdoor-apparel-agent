import type {
  ParsedRequirement,
  Fabric,
  StyleTemplate,
  CostResult,
  BomItem,
  BomRule,
  CostRules,
  ProcessType,
} from '@/types';
import bomRulesData from '@/data/bomRules.json';
import costRulesData from '@/data/costRules.json';

export function calculateCost(
  requirement: ParsedRequirement,
  selectedFabric: Fabric,
  selectedStyle: StyleTemplate
): CostResult {
  const bomRules = bomRulesData as Record<string, BomRule>;
  const costRules = costRulesData as CostRules;

  const rule = bomRules[requirement.category] || bomRules['冲锋衣'];
  if (!rule) {
    throw new Error(`No BOM rule available`);
  }

  const fabricUsage = getFabricUsage(rule, requirement.gender);
  const fabricCost = fabricUsage * selectedFabric.pricePerMeter;

  const liningCost = rule.liningUsageMeters > 0
    ? rule.liningUsageMeters * rule.defaultLiningPrice
    : 0;

  const accessoriesCost = calculateAccessoriesCost(rule);

  const processType = determineProcessType(selectedStyle.process);
  const processCost = rule.processCost[processType] || 0;

  const quantityRule = costRules.quantityRules.find(
    (r) => requirement.orderQuantity <= r.maxQuantity
  ) || costRules.quantityRules[costRules.quantityRules.length - 1];

  const laborMultiplier = quantityRule.laborMultiplier;
  const laborCost = rule.laborCost * laborMultiplier;

  const baseCost = fabricCost + liningCost + accessoriesCost + processCost + laborCost;
  const lossRate = rule.lossRate;
  const lossCost = baseCost * lossRate;

  const samplePatternAmortization = (rule.sampleFee + rule.patternFee) / requirement.orderQuantity;

  const estimatedUnitCost = baseCost + lossCost + samplePatternAmortization;
  const costRangeLow = Math.round(estimatedUnitCost * 0.95 * 100) / 100;
  const costRangeHigh = Math.round(estimatedUnitCost * 1.15 * 100) / 100;

  const costRate = estimatedUnitCost / requirement.targetPrice;
  const costWarnings: string[] = [];

  if (!bomRules[requirement.category]) {
    costWarnings.push(`系统暂未收录「${requirement.category}」的专属BOM规则，当前使用冲锋衣默认规则估算，实际成本请以具体工艺为准`);
  }

  if (costRate > 0.45) {
    costWarnings.push('当前成本率偏高，若用于抖音电商销售，可能压缩投流和利润空间');
  }
  if (costRate > 0.55) {
    costWarnings.push('成本率已超过55%，建议上调零售价或降低面料/工艺成本');
  }

  const priceBandRule = costRules.priceBandRules.find(
    (r) =>
      requirement.targetPrice <= r.maxRetailPrice &&
      (!r.categories || r.categories.includes(requirement.category))
  );
  if (priceBandRule) {
    costWarnings.push(priceBandRule.note);
  }

  const bomItems: BomItem[] = [
    {
      name: '主面料',
      usage: `${fabricUsage}米`,
      unitPrice: selectedFabric.pricePerMeter,
      subtotal: Math.round(fabricCost * 100) / 100,
      note: `${selectedFabric.name}`,
    },
  ];

  if (liningCost > 0) {
    bomItems.push({
      name: '里料',
      usage: `${rule.liningUsageMeters}米`,
      unitPrice: rule.defaultLiningPrice,
      subtotal: Math.round(liningCost * 100) / 100,
      note: '内里衬料',
    });
  }

  for (const acc of rule.accessories) {
    bomItems.push({
      name: acc.name,
      usage: `${acc.quantity}${acc.name.includes('拉链') ? '条' : acc.name.includes('扣') ? '套' : acc.name.includes('贴') ? '套' : '套'}`,
      unitPrice: acc.unitPrice,
      subtotal: Math.round(acc.quantity * acc.unitPrice * 100) / 100,
      note: '',
    });
  }

  bomItems.push({
    name: processType === 'fullSeamTaping' ? '全压胶工艺' : processType === 'partialSeamTaping' ? '局部压胶工艺' : '车缝工艺',
    usage: '1件',
    unitPrice: processCost,
    subtotal: processCost,
    note: processCost === 0 ? '标准车缝' : '压胶处理',
  });

  bomItems.push({
    name: '车缝加工',
    usage: '1件',
    unitPrice: Math.round(laborCost * 100) / 100,
    subtotal: Math.round(laborCost * 100) / 100,
    note: `${quantityRule.note}（工费系数${laborMultiplier}）`,
  });

  bomItems.push({
    name: '包装吊牌',
    usage: '1套',
    unitPrice: 3,
    subtotal: 3,
    note: '基础包装',
  });

  bomItems.push({
    name: '损耗',
    usage: `${(lossRate * 100).toFixed(0)}%`,
    unitPrice: 0,
    subtotal: Math.round(lossCost * 100) / 100,
    note: '主辅料损耗',
  });

  bomItems.push({
    name: '打样制版摊销',
    usage: `${requirement.orderQuantity}件`,
    unitPrice: 0,
    subtotal: Math.round(samplePatternAmortization * 100) / 100,
    note: `打样${rule.sampleFee}元+制版${rule.patternFee}元 ÷ ${requirement.orderQuantity}件`,
  });

  return {
    bomItems,
    baseCost: Math.round(baseCost * 100) / 100,
    lossCost: Math.round(lossCost * 100) / 100,
    samplePatternAmortization: Math.round(samplePatternAmortization * 100) / 100,
    estimatedUnitCost: Math.round(estimatedUnitCost * 100) / 100,
    costRangeLow,
    costRangeHigh,
    retailPrice: requirement.targetPrice,
    costRate: Math.round(costRate * 10000) / 100,
    costWarnings,
    laborMultiplier,
    laborMultiplierNote: quantityRule.note,
  };
}

function getFabricUsage(rule: BomRule, gender: string): number {
  switch (gender) {
    case '女款': return rule.fabricUsageMeters.female;
    case '男款': return rule.fabricUsageMeters.male;
    default: return rule.fabricUsageMeters.unisex;
  }
}

function calculateAccessoriesCost(rule: BomRule): number {
  return rule.accessories.reduce((sum, acc) => {
    return sum + acc.quantity * acc.unitPrice;
  }, 0);
}

function determineProcessType(process: string): ProcessType {
  if (process.includes('全压胶') || process.includes('全缝位')) return 'fullSeamTaping';
  if (process.includes('局部压胶') || process.includes('关键缝位')) return 'partialSeamTaping';
  return 'normalSewing';
}
