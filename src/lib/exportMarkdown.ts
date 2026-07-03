import type { GenerationResult } from '@/types';

export function exportMarkdown(result: GenerationResult): string {
  const { parsedRequirement, fabricRecommendations, selectedStyle, costResult, marketingCopy, riskWarnings } = result;

  const categoryEmoji = parsedRequirement.category === '冲锋衣' ? '🏔️' : parsedRequirement.category === '软壳外套' ? '🧥' : '☀️';

  let md = `# ${categoryEmoji} ${parsedRequirement.category}研发方案

---

## 📋 项目名称

${marketingCopy.title}

---

## 📝 用户原始需求

- **产品品类**：${parsedRequirement.category}
- **目标人群**：${parsedRequirement.gender}，${parsedRequirement.ageRange}
- **使用场景**：${parsedRequirement.scenes.join('、')}
- **季节**：${parsedRequirement.season}
- **价格带**：${parsedRequirement.targetPrice}元以内
- **订单量**：${parsedRequirement.orderQuantity}件
- **功能优先级**：${parsedRequirement.functionPriorities.join(' > ')}
- **风格定位**：${parsedRequirement.stylePositioning}

---

## 🔍 需求解析

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
| 小单快反要求 | ${parsedRequirement.quickResponseRequired ? '优先现货面料，避免复杂工艺' : '常规订单'} |

${parsedRequirement.constraints.length > 0 ? `> ⚠️ ${parsedRequirement.constraints.join('\n> ⚠️ ')}` : ''}

---

## 🧵 面料推荐

`;

  fabricRecommendations.forEach((rec, i) => {
    const label = i === 0 ? 'A：成本优先' : i === 1 ? 'B：性能均衡' : 'C：高性能方案';
    const f = rec.fabric;
    md += `### 方案${label}

| 字段 | 内容 |
|------|------|
| 面料名称 | ${f.name} |
| 面料结构 | ${f.structure} |
| 成分 | ${f.composition} |
| 克重 | ${f.weightGsm}g/㎡ |
| 米价 | ${f.pricePerMeter}元/米 |
| 静水压 | ${f.hydrostaticHead}mm |
| 透湿率 | ${f.breathability}g/㎡·24h |
| ${f.upf ? `UPF | ${f.upf}` : ''}
| 防风 | ${f.windproof ? '✅' : '❌'} |
| 弹力 | ${f.elasticity} |
| 适合场景 | ${f.suitableScenes.join('、')} |
| 起订量 | ${f.moqMeters}米 |
| 现货状态 | ${f.stockStatus} |
| 推荐理由 | ${rec.recommendationReason} |
| 风险提醒 | ${f.riskNotes} |

**评分详情**：场景匹配 ${rec.sceneScore} | 功能匹配 ${rec.functionScore} | 价格匹配 ${rec.priceScore} | 快反匹配 ${rec.quickResponseScore} | 季节匹配 ${rec.seasonScore}

---
`;

    md += '\n';
  });

  md += `## 👕 款式设计

| 字段 | 内容 |
|------|------|
| 款式名称 | ${selectedStyle.name} |
| 版型 | ${selectedStyle.silhouette} |
| 衣长 | ${selectedStyle.length} |
| 帽子结构 | ${selectedStyle.hood} |
| 门襟结构 | ${selectedStyle.closure} |
| 口袋结构 | ${selectedStyle.pockets} |
| 袖口结构 | ${selectedStyle.cuff} |
| 下摆结构 | ${selectedStyle.hem} |
| 透气结构 | ${selectedStyle.ventilation} |
| 拼接设计 | 根据款式模板 |
| 工艺建议 | ${selectedStyle.process} |
| 成本等级 | ${selectedStyle.costLevel} |
| 生产难度 | ${selectedStyle.productionDifficulty} |
| 颜色建议 | ${selectedStyle.colorSuggestions.join('、')} |
| 设计理由 | ${selectedStyle.designReason} |

---

## 💰 BOM成本核算

| 项目 | 用量 | 单价 | 小计 | 说明 |
|------|------|------|------|------|
`;

  costResult.bomItems.forEach((item) => {
    md += `| ${item.name} | ${item.usage} | ${item.unitPrice > 0 ? item.unitPrice + '元' : '-'} | ${item.subtotal}元 | ${item.note} |\n`;
  });

  md += `
| **基础成本** | | | **${costResult.baseCost}元** | |
| **损耗成本** | | | **${costResult.lossCost}元** | ${((costResult.lossCost / costResult.baseCost) * 100).toFixed(0)}%损耗率 |
| **打样制版摊销** | | | **${costResult.samplePatternAmortization}元** | 按${parsedRequirement.orderQuantity}件均摊 |
| **预计单件成本** | | | **${costResult.estimatedUnitCost}元** | |
| **成本区间** | | | **${costResult.costRangeLow} - ${costResult.costRangeHigh}元** | ±15%浮动 |
| **零售价** | | | **${costResult.retailPrice}元** | |
| **成本率** | | | **${costResult.costRate}%** | |
| **工费系数** | | | **${costResult.laborMultiplier}** | ${costResult.laborMultiplierNote} |

### 成本风险提醒

`;

  if (costResult.costWarnings.length > 0) {
    costResult.costWarnings.forEach((w) => {
      md += `- ⚠️ ${w}\n`;
    });
  } else {
    md += '暂无特别成本风险。\n';
  }

  md += `
---

## 📢 营销文案

### 商品标题

${marketingCopy.title}

### 核心卖点

`;

  marketingCopy.sellingPoints.forEach((point, i) => {
    md += `${i + 1}. ${point}\n`;
  });

  md += `
### 抖音短视频口播稿

${marketingCopy.tiktokScript}

### 商品详情页文案

${marketingCopy.detailPageCopy}

### 直播间话术

${marketingCopy.liveScript}

---

## ⚠️ 风险提醒

`;

  riskWarnings.forEach((w, i) => {
    md += `${i + 1}. **[${w.category}]** [${w.severity}] ${w.message}\n`;
  });

  md += `
---

## 📊 总结建议

### 产品定位
${parsedRequirement.stylePositioning}${parsedRequirement.category}，面向${parsedRequirement.ageRange}${parsedRequirement.gender}，零售价${parsedRequirement.targetPrice}元以内，首单${parsedRequirement.orderQuantity}件。

### 推荐面料
首选「${fabricRecommendations[0]?.fabric.name}」，适合场景${parsedRequirement.scenes.join('、')}，${fabricRecommendations[0]?.fabric.stockStatus === '现货' ? '现货面料，交期有保障。' : '需要注意交期。'}

### 推荐款式
「${selectedStyle.name}」，${selectedStyle.silhouette}版型，${selectedStyle.process}，${selectedStyle.productionDifficulty === '低' ? '适合小单快反。' : '小单快反需注意排期。'}

### 成本区间
预计单件成本 **${costResult.costRangeLow} - ${costResult.costRangeHigh}元**，在${parsedRequirement.targetPrice}元零售价内${costResult.costRate <= 45 ? '有较好的利润空间。' : '需要注意控制成本。'}

### 关键风险
${riskWarnings.filter(w => w.severity === '高').length}项高风险，${riskWarnings.filter(w => w.severity === '中').length}项中风险，${riskWarnings.filter(w => w.severity === '低').length}项低风险。

---

> 📅 生成时间：${new Date().toLocaleString('zh-CN')}
> 🔧 本方案由AI户外服饰智能设计Agent生成，仅供参考
`;

  return md;
}
