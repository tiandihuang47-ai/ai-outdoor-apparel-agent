import type { GenerationResult, FabricScore, RiskWarning } from '@/types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br/>');
}

function renderTable(rows: [string, string | number | undefined][]): string {
  let html = '<table><tbody>';
  for (const [label, value] of rows) {
    const displayValue = value === undefined || value === null || value === '' ? '-' : String(value);
    html += `<tr><th style="width: 28%;">${escapeHtml(label)}</th><td>${escapeHtml(displayValue)}</td></tr>`;
  }
  html += '</tbody></table>';
  return html;
}

function renderFabricRows(rec: FabricScore, index: number): string {
  const f = rec.fabric;
  const label = index === 0 ? 'A：成本优先' : index === 1 ? 'B：性能均衡' : 'C：高性能方案';
  const scoreText = `场景匹配 ${rec.sceneScore} | 功能匹配 ${rec.functionScore} | 价格匹配 ${rec.priceScore} | 快反匹配 ${rec.quickResponseScore} | 季节匹配 ${rec.seasonScore}`;

  const rows: [string, string | number | undefined][] = [
    ['方案', label],
    ['面料名称', f.name],
    ['面料结构', f.structure],
    ['成分', f.composition],
    ['克重', `${f.weightGsm}g/㎡`],
    ['门幅', `${f.widthCm}cm`],
    ['米价', `${f.pricePerMeter}元/米`],
    ['静水压', f.hydrostaticHead > 0 ? `${f.hydrostaticHead}mm` : '-'],
    ['透湿率', f.breathability > 0 ? `${f.breathability}g/㎡·24h` : '-'],
    ['UPF', f.upf && f.upf > 0 ? String(f.upf) : '-'],
    ['防风', f.windproof ? '是' : '否'],
    ['弹力', f.elasticity],
    ['适合场景', f.suitableScenes.join('、')],
    ['起订量', `${f.moqMeters}米`],
    ['现货状态', f.stockStatus],
    ['供应商', f.supplier],
    ['推荐理由', rec.recommendationReason],
    ['面料风险', f.riskNotes],
  ];

  return `<h3>方案${label}</h3>${renderTable(rows)}<p style="color:#4a5568;font-size:10pt;">${escapeHtml(scoreText)}</p>`;
}

function renderBomTable(costResult: GenerationResult['costResult']): string {
  let html = '<table><thead><tr><th>项目</th><th>用量</th><th>单价</th><th>小计</th><th>说明</th></tr></thead><tbody>';
  for (const item of costResult.bomItems) {
    html += `<tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.usage)}</td>
      <td>${item.unitPrice > 0 ? item.unitPrice + '元' : '-'}</td>
      <td>${item.subtotal}元</td>
      <td>${escapeHtml(item.note)}</td>
    </tr>`;
  }
  html += `<tr style="background:#edf2f7;font-weight:bold;"><td>基础成本</td><td></td><td></td><td>${costResult.baseCost}元</td><td></td></tr>`;
  html += `<tr style="background:#edf2f7;font-weight:bold;"><td>损耗成本</td><td></td><td></td><td>${costResult.lossCost}元</td><td></td></tr>`;
  html += `<tr style="background:#edf2f7;font-weight:bold;"><td>打样制版摊销</td><td></td><td></td><td>${costResult.samplePatternAmortization}元</td><td></td></tr>`;
  html += `<tr style="background:#fff5cd;font-weight:bold;"><td>预计单件成本</td><td></td><td></td><td>${costResult.estimatedUnitCost}元</td><td></td></tr>`;
  html += `<tr><td>成本区间</td><td></td><td></td><td>${costResult.costRangeLow} - ${costResult.costRangeHigh}元</td><td>±15%浮动</td></tr>`;
  html += `<tr><td>零售价</td><td></td><td></td><td>${costResult.retailPrice}元</td><td></td></tr>`;
  html += `<tr><td>成本率</td><td></td><td></td><td>${costResult.costRate}%</td><td></td></tr>`;
  html += `<tr><td>工费系数</td><td></td><td></td><td>${costResult.laborMultiplier}</td><td>${escapeHtml(costResult.laborMultiplierNote)}</td></tr>`;
  html += '</tbody></table>';
  return html;
}

function renderRiskItem(w: RiskWarning, index: number): string {
  const severityClass = w.severity === '高' ? 'risk-high' : w.severity === '中' ? 'risk-medium' : 'risk-low';
  return `<p class="${severityClass}">${index + 1}. [${w.category}] [${w.severity}] ${escapeHtml(w.message)}</p>`;
}

export function exportWord(result: GenerationResult): string {
  const { parsedRequirement, fabricRecommendations, selectedStyle, costResult, marketingCopy, riskWarnings } = result;

  const requirementRows: [string, string | number | undefined][] = [
    ['产品品类', parsedRequirement.category],
    ['目标人群', `${parsedRequirement.ageRange}${parsedRequirement.gender}`],
    ['使用场景', parsedRequirement.scenes.join('、')],
    ['季节', parsedRequirement.season],
    ['价格带', `${parsedRequirement.targetPrice}元以内`],
    ['订单量', `${parsedRequirement.orderQuantity}件`],
    ['功能优先级', parsedRequirement.functionPriorities.join(' > ')],
    ['风格定位', parsedRequirement.stylePositioning],
    ['小单快反要求', parsedRequirement.quickResponseRequired ? '优先现货面料，避免复杂工艺' : '常规订单'],
  ];

  const styleRows: [string, string | number | undefined][] = [
    ['款式名称', selectedStyle.name],
    ['版型', selectedStyle.silhouette],
    ['衣长/裤长', selectedStyle.length],
    ['帽子结构', selectedStyle.hood],
    ['门襟结构', selectedStyle.closure],
    ['口袋结构', selectedStyle.pockets],
    ['袖口结构', selectedStyle.cuff],
    ['下摆结构', selectedStyle.hem],
    ['透气结构', selectedStyle.ventilation],
    ['工艺建议', selectedStyle.process],
    ['成本等级', selectedStyle.costLevel],
    ['生产难度', selectedStyle.productionDifficulty],
    ['颜色建议', selectedStyle.colorSuggestions.join('、')],
    ['设计理由', selectedStyle.designReason],
  ];

  const title = escapeHtml(marketingCopy.title);
  const dateStr = new Date().toLocaleString('zh-CN');

  const fabricSections = fabricRecommendations.map((rec, i) => renderFabricRows(rec, i)).join('');
  const costWarningsHtml = costResult.costWarnings.length > 0
    ? costResult.costWarnings.map((w) => `<p>⚠️ ${escapeHtml(w)}</p>`).join('')
    : '<p>暂无特别成本风险。</p>';
  const sellingPointsHtml = marketingCopy.sellingPoints.map((p, i) => `<p>${i + 1}. ${escapeHtml(p)}</p>`).join('');
  const risksHtml = riskWarnings.length > 0
    ? riskWarnings.map((w, i) => renderRiskItem(w, i)).join('')
    : '<p>暂无风险提醒。</p>';

  const highRisks = riskWarnings.filter((w) => w.severity === '高').length;
  const mediumRisks = riskWarnings.filter((w) => w.severity === '中').length;
  const lowRisks = riskWarnings.filter((w) => w.severity === '低').length;

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Microsoft YaHei', SimSun, sans-serif; font-size: 11pt; line-height: 1.7; color: #1a202c; margin: 40px; }
    h1 { font-size: 20pt; color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; margin-bottom: 24px; }
    h2 { font-size: 14pt; color: #2c5282; margin-top: 28px; margin-bottom: 12px; border-left: 4px solid #3182ce; padding-left: 10px; }
    h3 { font-size: 12pt; color: #2d3748; margin-top: 18px; margin-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #cbd5e0; padding: 8px; font-size: 10.5pt; vertical-align: top; }
    th { background: #edf2f7; color: #2d3748; text-align: left; font-weight: 600; }
    .summary-box { background: #ebf8ff; border: 1px solid #90cdf4; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
    .risk-high { color: #c53030; font-weight: bold; }
    .risk-medium { color: #dd6b20; font-weight: bold; }
    .risk-low { color: #38a169; }
    .section { margin-bottom: 24px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 9pt; }
  </style>
</head>
<body>
  <h1>${parsedRequirement.category} 研发方案</h1>

  <div class="summary-box">
    <strong>方案摘要：</strong>${escapeHtml(result.summary)}
  </div>

  <h2>📋 项目信息</h2>
  <div class="section">
    <p><strong>商品标题：</strong>${title}</p>
    ${renderTable(requirementRows)}
    ${parsedRequirement.constraints.length > 0
      ? `<p style="color:#c53030;"><strong>系统备注：</strong>${escapeHtml(parsedRequirement.constraints.join('；'))}</p>`
      : ''}
  </div>

  <h2>🧵 面料推荐</h2>
  <div class="section">${fabricSections}</div>

  <h2>👕 款式设计</h2>
  <div class="section">${renderTable(styleRows)}</div>

  <h2>💰 BOM 成本核算</h2>
  <div class="section">${renderBomTable(costResult)}</div>
  <h3>成本风险提醒</h3>
  <div class="section">${costWarningsHtml}</div>

  <h2>📢 营销文案</h2>
  <div class="section">
    <h3>商品标题</h3>
    <p>${title}</p>

    <h3>核心卖点</h3>
    ${sellingPointsHtml}

    <h3>抖音短视频口播稿</h3>
    <p>${nl2br(marketingCopy.tiktokScript)}</p>

    <h3>商品详情页文案</h3>
    <p>${nl2br(marketingCopy.detailPageCopy)}</p>

    <h3>直播间话术</h3>
    <p>${nl2br(marketingCopy.liveScript)}</p>
  </div>

  <h2>⚠️ 风险提醒</h2>
  <div class="section">${risksHtml}</div>

  <h2>📊 总结建议</h2>
  <div class="section">
    <p><strong>关键风险：</strong>${highRisks}项高风险，${mediumRisks}项中风险，${lowRisks}项低风险。</p>
    <p><strong>面料建议：</strong>首选「${escapeHtml(fabricRecommendations[0]?.fabric.name || '')}」，${fabricRecommendations[0]?.fabric.stockStatus === '现货' ? '现货面料，交期有保障。' : '需要注意交期。'}</p>
    <p><strong>款式建议：</strong>「${escapeHtml(selectedStyle.name)}」，${selectedStyle.silhouette}版型，${selectedStyle.process}，${selectedStyle.productionDifficulty === '低' ? '适合小单快反。' : '小单快反需注意排期。'}</p>
    <p><strong>成本区间：</strong>预计单件成本 <strong>${costResult.costRangeLow} - ${costResult.costRangeHigh}元</strong>，在${parsedRequirement.targetPrice}元零售价内${costResult.costRate <= 45 ? '有较好的利润空间。' : '需要注意控制成本。'}</p>
  </div>

  <div class="footer">
    <p>生成时间：${dateStr}</p>
    <p>本方案由 AI 户外服饰智能设计 Agent 生成，仅供参考。</p>
  </div>
</body>
</html>`;
}
