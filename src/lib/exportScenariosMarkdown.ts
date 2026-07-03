import type { GenerationResult } from '@/types';

interface Scenario {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  targetPrice: number;
  result: GenerationResult;
}

function renderResultMarkdown(result: GenerationResult): string {
  const { parsedRequirement, fabricRecommendations, selectedStyle, costResult, marketingCopy, riskWarnings } = result;

  let md = `### 📋 需求解析

| 字段 | 内容 |
|------|------|
| 产品品类 | ${parsedRequirement.category} |
| 目标人群 | ${parsedRequirement.ageRange}${parsedRequirement.gender} |
| 使用场景 | ${parsedRequirement.scenes.join('、')} |
| 季节 | ${parsedRequirement.season} |
| 价格带 | ${parsedRequirement.targetPrice}元以内 |
| 订单量 | ${parsedRequirement.orderQuantity}件 |
| 功能优先级 | ${parsedRequirement.functionPriorities.join(' > ')} |
| 风格定位 | ${parsedRequirement.stylePositioning} |
| 小单快反 | ${parsedRequirement.quickResponseRequired ? '优先现货面料，避免复杂工艺' : '常规订单'} |

### 🧵 推荐面料

| 字段 | ${fabricRecommendations.map((_, i) => `方案${String.fromCharCode(65 + i)}`).join(' | ')} |
|------|${fabricRecommendations.map(() => '------|').join('')}
| 名称 | ${fabricRecommendations.map((rec) => rec.fabric.name).join(' | ')} |
| 成分 | ${fabricRecommendations.map((rec) => rec.fabric.composition).join(' | ')} |
| 克重 | ${fabricRecommendations.map((rec) => `${rec.fabric.weightGsm}g/㎡`).join(' | ')} |
| 米价 | ${fabricRecommendations.map((rec) => `${rec.fabric.pricePerMeter}元/米`).join(' | ')} |
| 现货状态 | ${fabricRecommendations.map((rec) => rec.fabric.stockStatus).join(' | ')} |
| 推荐理由 | ${fabricRecommendations.map((rec) => rec.recommendationReason).join(' | ')} |

### 👕 款式设计

| 字段 | 内容 |
|------|------|
| 款式名称 | ${selectedStyle.name} |
| 版型 | ${selectedStyle.silhouette} |
| 长度 | ${selectedStyle.length} |
| 帽子结构 | ${selectedStyle.hood} |
| 门襟结构 | ${selectedStyle.closure} |
| 口袋结构 | ${selectedStyle.pockets} |
| 袖口结构 | ${selectedStyle.cuff} |
| 下摆结构 | ${selectedStyle.hem} |
| 透气结构 | ${selectedStyle.ventilation} |
| 工艺建议 | ${selectedStyle.process} |
| 生产难度 | ${selectedStyle.productionDifficulty} |
| 颜色建议 | ${selectedStyle.colorSuggestions.join('、')} |

### 💰 BOM 成本

| 项目 | 用量 | 单价 | 小计 | 说明 |
|------|------|------|------|------|
`;

  costResult.bomItems.forEach((item) => {
    md += `| ${item.name} | ${item.usage} | ${item.unitPrice > 0 ? item.unitPrice + '元' : '-'} | ${item.subtotal}元 | ${item.note} |\n`;
  });

  md += `| **基础成本** | | | **${costResult.baseCost}元** | |
| **损耗成本** | | | **${costResult.lossCost}元** | |
| **打样制版摊销** | | | **${costResult.samplePatternAmortization}元** | |
| **预计单件成本** | | | **${costResult.estimatedUnitCost}元** | |
| **成本区间** | | | **${costResult.costRangeLow} - ${costResult.costRangeHigh}元** | ±15%浮动 |
| **零售价** | | | **${costResult.retailPrice}元** | |
| **成本率** | | | **${costResult.costRate}%** | |

### 📢 营销文案

**商品标题**：${marketingCopy.title}

**核心卖点**：
${marketingCopy.sellingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

**抖音口播稿**：
${marketingCopy.tiktokScript}

### ⚠️ 风险提醒

${riskWarnings.length > 0 ? riskWarnings.map((w, i) => `${i + 1}. **[${w.category}]** [${w.severity}] ${w.message}`).join('\n') : '暂无风险提醒。'}

---
`;

  return md;
}

export function exportScenariosMarkdown(scenarios: Scenario[]): string {
  const category = scenarios[0]?.result.parsedRequirement.category || '服装';
  const dateStr = new Date().toLocaleString('zh-CN');

  let md = `# 📊 ${category} 多套方案对比

> 生成时间：${dateStr}

## 关键指标对比

| 方案 | 零售价 | 预计单件成本 | 成本区间 | 成本率 | 预计毛利 | 高风险 | 推荐面料 | 款式 |
|------|--------|--------------|----------|--------|----------|--------|----------|------|
`;

  for (const s of scenarios) {
    const cost = s.result.costResult;
    const profit = s.targetPrice - cost.estimatedUnitCost;
    const marginRate = s.targetPrice > 0 ? ((profit / s.targetPrice) * 100).toFixed(1) : '0.0';
    const highRisks = s.result.riskWarnings.filter((w) => w.severity === '高').length;
    md += `| ${s.tierName} | ${s.targetPrice}元 | ${cost.estimatedUnitCost}元 | ${cost.costRangeLow}-${cost.costRangeHigh}元 | ${cost.costRate}% | ${profit.toFixed(1)}元（${marginRate}%） | ${highRisks}项 | ${s.result.fabricRecommendations[0]?.fabric.name || '-'} | ${s.result.selectedStyle.name} |\n`;
  }

  md += `
## 方案详情

`;

  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    md += `## ${i + 1}. ${s.tierName}（零售价 ${s.targetPrice}元）\n\n`;
    md += `> ${s.result.summary}\n\n`;
    md += renderResultMarkdown(s.result);
    md += '\n';
  }

  md += `\n> 🔧 本方案由 AI 户外服饰智能设计 Agent 生成，仅供参考`;

  return md;
}

export function exportBatchMarkdown(results: GenerationResult[]): string {
  const dateStr = new Date().toLocaleString('zh-CN');

  let md = `# 📦 批量导出研发方案

> 导出时间：${dateStr}
> 共 ${results.length} 个方案

`;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    md += `## ${i + 1}. ${result.parsedRequirement.category} - ${result.marketingCopy.title}\n\n`;
    md += `> ${result.summary}\n\n`;
    md += renderResultMarkdown(result);
    md += '\n';
  }

  md += `\n> 🔧 本方案由 AI 户外服饰智能设计 Agent 生成，仅供参考`;

  return md;
}
