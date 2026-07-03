import type { ParsedRequirement, FabricScore, StyleTemplate, CostResult, RiskWarning } from '@/types';
import riskRulesData from '@/data/riskRules.json';

interface RiskRule {
  id: string;
  category: string;
  condition: string;
  message: string;
  severity: '高' | '中' | '低';
}

export function generateRiskWarnings(
  requirement: ParsedRequirement,
  fabricScore: FabricScore,
  style: StyleTemplate,
  cost: CostResult
): RiskWarning[] {
  const rules = riskRulesData.rules as RiskRule[];
  const warnings: RiskWarning[] = [];
  const fabric = fabricScore.fabric;

  for (const rule of rules) {
    if (evaluateCondition(rule.condition, requirement, fabric, style, cost)) {
      warnings.push({
        category: rule.category,
        severity: rule.severity,
        message: rule.message,
      });
    }
  }

  // Add category-specific risk checks
  if (requirement.category === '冲锋衣' && fabric.hydrostaticHead < 10000) {
    const exists = warnings.some(w => w.message.includes('静水压'));
    if (!exists) {
      warnings.push({
        category: '面料风险',
        severity: '中',
        message: `当前面料静水压${fabric.hydrostaticHead}mm，适合城市轻户外场景，不建议宣传为专业防水冲锋衣`,
      });
    }
  }

  if (requirement.category === '软壳外套' && fabric.waterRepellent === '无') {
    warnings.push({
      category: '面料风险',
      severity: '中',
      message: '软壳外套建议选择具备防泼水功能的面料，提升实用价值',
    });
  }

  if (requirement.category === '防晒衣' && fabric.upf && fabric.upf < 50) {
    warnings.push({
      category: '面料风险',
      severity: '高',
      message: `当前面料UPF值${fabric.upf}，市场普遍要求UPF50+，建议换用更高防紫外线面料`,
    });
  }

  if (requirement.orderQuantity <= 100) {
    const hasWarning = warnings.some(w => w.category === '小单快反风险');
    if (!hasWarning) {
      warnings.push({
        category: '小单快反风险',
        severity: '中',
        message: '100件小单建议在电商渠道测试市场反应后再追加订单',
      });
    }
  }

  if (cost.costRate > 0.4) {
    const exists = warnings.some(w => w.message.includes('成本率'));
    if (!exists) {
      warnings.push({
        category: '成本风险',
        severity: '中',
        message: `成本率${cost.costRate}%，若通过达人直播，还需预留20-30%佣金`,
      });
    }
  }

  warnings.sort((a, b) => {
    const severityOrder = { '高': 0, '中': 1, '低': 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return warnings;
}

function evaluateCondition(
  condition: string,
  requirement: ParsedRequirement,
  fabric: FabricScore['fabric'],
  style: StyleTemplate,
  cost: CostResult
): boolean {
  try {
    const ctx = {
      targetPrice: requirement.targetPrice,
      orderQuantity: requirement.orderQuantity,
      category: requirement.category,
      functions: requirement.functionPriorities,
      fabricStructure: fabric.structure,
      stockStatus: fabric.stockStatus,
      hydrostaticHead: fabric.hydrostaticHead,
      breathability: fabric.breathability,
      windproof: fabric.windproof,
      moqMeters: fabric.moqMeters,
      upf: fabric.upf || 0,
      costRate: cost.costRate,
      processType: style.process.includes('全压胶') ? 'fullSeamTaping'
        : style.process.includes('局部压胶') ? 'partialSeamTaping'
        : style.process.includes('标准车缝') ? 'normalSewing' : 'normalSewing',
      productionDifficulty: style.productionDifficulty,
      pockets: style.pockets,
      ventilation: style.ventilation,
      name: fabric.name,
      composition: fabric.composition,
      hood: style.hood,
      closure: style.closure,
      elasticity: fabric.elasticity,
      process: style.process,
    };

    if (condition === 'true') return true;
    if (condition === 'false') return false;

    const safeCondition = condition
      .replace(/targetPrice/g, String(ctx.targetPrice))
      .replace(/orderQuantity/g, String(ctx.orderQuantity))
      .replace(/category/g, `'${ctx.category}'`)
      .replace(/fabricStructure/g, `'${ctx.fabricStructure}'`)
      .replace(/stockStatus/g, `'${ctx.stockStatus}'`)
      .replace(/hydrostaticHead/g, String(ctx.hydrostaticHead))
      .replace(/breathability/g, String(ctx.breathability))
      .replace(/windproof/g, String(ctx.windproof))
      .replace(/moqMeters/g, String(ctx.moqMeters))
      .replace(/upf/g, String(ctx.upf))
      .replace(/costRate/g, String(ctx.costRate))
      .replace(/name/g, `'${ctx.name}'`)
      .replace(/composition/g, `'${ctx.composition}'`)
      .replace(/hood/g, `'${ctx.hood}'`)
      .replace(/closure/g, `'${ctx.closure}'`)
      .replace(/elasticity/g, `'${ctx.elasticity}'`)
      .replace(/process/g, `'${ctx.process}'`);

    const fn = new Function(`return ${safeCondition}`);
    return Boolean(fn());
  } catch {
    return false;
  }
}
