import type { GenerationResult } from '@/types';

interface Scenario {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  targetPrice: number;
  result: GenerationResult;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  html += '</tbody></table>';
  return html;
}

function renderRiskItem(w: GenerationResult['riskWarnings'][0], index: number): string {
  const severityClass = w.severity === '高' ? 'risk-high' : w.severity === '中' ? 'risk-medium' : 'risk-low';
  return `<p class="${severityClass}">${index + 1}. [${w.category}] [${w.severity}] ${escapeHtml(w.message)}</p>`;
}

function countRisks(warnings: GenerationResult['riskWarnings'], severity: string) {
  return warnings.filter((w) => w.severity === severity).length;
}

function renderResultSection(result: GenerationResult, index: number): string {
  const fabric = result.fabricRecommendations[0];
  const style = result.selectedStyle;
  const cost = result.costResult;
  const profit = cost.retailPrice - cost.estimatedUnitCost;
  const marginRate = cost.retailPrice > 0 ? ((profit / cost.retailPrice) * 100).toFixed(1) : '0.0';

  const overviewRows: [string, string | number | undefined][] = [
    ['产品品类', result.parsedRequirement.category],
    ['目标人群', `${result.parsedRequirement.ageRange}${result.parsedRequirement.gender}`],
    ['建议零售价', `${cost.retailPrice}元`],
    ['预计单件成本', `${cost.estimatedUnitCost}元`],
    ['成本区间', `${cost.costRangeLow} - ${cost.costRangeHigh}元`],
    ['成本率', `${cost.costRate}%`],
    ['预计毛利', `${profit.toFixed(1)}元（${marginRate}%）`],
    ['高风险', `${countRisks(result.riskWarnings, '高')}项`],
    ['中风险', `${countRisks(result.riskWarnings, '中')}项`],
    ['低风险', `${countRisks(result.riskWarnings, '低')}项`],
  ];

  const requirementRows: [string, string | number | undefined][] = [
    ['产品品类', result.parsedRequirement.category],
    ['目标人群', `${result.parsedRequirement.ageRange}${result.parsedRequirement.gender}`],
    ['使用场景', result.parsedRequirement.scenes.join('、')],
    ['季节', result.parsedRequirement.season],
    ['价格带', `${result.parsedRequirement.targetPrice}元以内`],
    ['订单量', `${result.parsedRequirement.orderQuantity}件`],
    ['功能优先级', result.parsedRequirement.functionPriorities.join(' > ')],
    ['风格定位', result.parsedRequirement.stylePositioning],
    ['小单快反', result.parsedRequirement.quickResponseRequired ? '优先现货面料，避免复杂工艺' : '常规订单'],
  ];

  const styleRows: [string, string | number | undefined][] = [
    ['款式名称', style.name],
    ['版型', style.silhouette],
    ['长度', style.length],
    ['帽子结构', style.hood],
    ['门襟/闭合', style.closure],
    ['口袋结构', style.pockets],
    ['袖口结构', style.cuff],
    ['下摆结构', style.hem],
    ['透气结构', style.ventilation],
    ['工艺建议', style.process],
    ['生产难度', style.productionDifficulty],
    ['颜色建议', style.colorSuggestions.join('、')],
  ];

  const fabricRows: [string, string | number | undefined][] = [
    ['面料名称', fabric?.fabric.name],
    ['面料结构', fabric?.fabric.structure],
    ['成分', fabric?.fabric.composition],
    ['克重', `${fabric?.fabric.weightGsm}g/㎡`],
    ['门幅', `${fabric?.fabric.widthCm}cm`],
    ['米价', `${fabric?.fabric.pricePerMeter}元/米`],
    ['防风', fabric?.fabric.windproof ? '是' : '否'],
    ['弹力', fabric?.fabric.elasticity],
    ['现货状态', fabric?.fabric.stockStatus],
    ['供应商', fabric?.fabric.supplier],
  ];

  const sellingPointsHtml = result.marketingCopy.sellingPoints.map((p, i) => `<p>${i + 1}. ${escapeHtml(p)}</p>`).join('');
  const risksHtml = result.riskWarnings.length > 0
    ? result.riskWarnings.map((w, i) => renderRiskItem(w, i)).join('')
    : '<p>暂无风险提醒。</p>';

  return `
    <h2>方案 ${index + 1}：${escapeHtml(result.marketingCopy.title)}</h2>
    <div class="section">
      <div class="summary-box">
        <strong>方案摘要：</strong>${escapeHtml(result.summary)}
      </div>
      ${renderTable(overviewRows)}

      <h3>需求解析</h3>
      ${renderTable(requirementRows)}

      <h3>款式设计</h3>
      ${renderTable(styleRows)}

      <h3>推荐面料</h3>
      ${renderTable(fabricRows)}

      <h3>BOM 成本明细</h3>
      ${renderBomTable(cost)}

      <h3>核心卖点</h3>
      ${sellingPointsHtml}

      <h3>风险提醒</h3>
      ${risksHtml}
    </div>
  `;
}

function renderScenarioSection(scenario: Scenario, index: number): string {
  const { result, tierName, targetPrice } = scenario;
  const fabric = result.fabricRecommendations[0];
  const style = result.selectedStyle;
  const cost = result.costResult;
  const profit = targetPrice - cost.estimatedUnitCost;
  const marginRate = targetPrice > 0 ? ((profit / targetPrice) * 100).toFixed(1) : '0.0';

  const overviewRows: [string, string | number | undefined][] = [
    ['方案等级', tierName],
    ['建议零售价', `${targetPrice}元`],
    ['预计单件成本', `${cost.estimatedUnitCost}元`],
    ['成本区间', `${cost.costRangeLow} - ${cost.costRangeHigh}元`],
    ['成本率', `${cost.costRate}%`],
    ['预计毛利', `${profit.toFixed(1)}元（${marginRate}%）`],
    ['高风险', `${countRisks(result.riskWarnings, '高')}项`],
    ['中风险', `${countRisks(result.riskWarnings, '中')}项`],
    ['低风险', `${countRisks(result.riskWarnings, '低')}项`],
  ];

  const styleRows: [string, string | number | undefined][] = [
    ['款式名称', style.name],
    ['版型', style.silhouette],
    ['长度', style.length],
    ['帽子结构', style.hood],
    ['门襟/闭合', style.closure],
    ['口袋结构', style.pockets],
    ['袖口结构', style.cuff],
    ['下摆结构', style.hem],
    ['透气结构', style.ventilation],
    ['工艺建议', style.process],
    ['生产难度', style.productionDifficulty],
    ['颜色建议', style.colorSuggestions.join('、')],
  ];

  const fabricRows: [string, string | number | undefined][] = [
    ['面料名称', fabric?.fabric.name],
    ['面料结构', fabric?.fabric.structure],
    ['成分', fabric?.fabric.composition],
    ['克重', `${fabric?.fabric.weightGsm}g/㎡`],
    ['门幅', `${fabric?.fabric.widthCm}cm`],
    ['米价', `${fabric?.fabric.pricePerMeter}元/米`],
    ['防风', fabric?.fabric.windproof ? '是' : '否'],
    ['弹力', fabric?.fabric.elasticity],
    ['现货状态', fabric?.fabric.stockStatus],
    ['供应商', fabric?.fabric.supplier],
  ];

  const sellingPointsHtml = result.marketingCopy.sellingPoints.map((p, i) => `<p>${i + 1}. ${escapeHtml(p)}</p>`).join('');
  const risksHtml = result.riskWarnings.length > 0
    ? result.riskWarnings.map((w, i) => renderRiskItem(w, i)).join('')
    : '<p>暂无风险提醒。</p>';

  return `
    <h2>方案 ${index + 1}：${tierName}</h2>
    <div class="section">
      <div class="summary-box">
        <strong>方案摘要：</strong>${escapeHtml(result.summary)}
      </div>
      ${renderTable(overviewRows)}

      <h3>款式设计</h3>
      ${renderTable(styleRows)}

      <h3>推荐面料</h3>
      ${renderTable(fabricRows)}

      <h3>BOM 成本明细</h3>
      ${renderBomTable(cost)}

      <h3>核心卖点</h3>
      ${sellingPointsHtml}

      <h3>风险提醒</h3>
      ${risksHtml}
    </div>
  `;
}

export function exportScenariosWord(scenarios: Scenario[]): string {
  const category = scenarios[0]?.result.parsedRequirement.category || '服装';
  const dateStr = new Date().toLocaleString('zh-CN');

  let compareRows = '';
  for (const s of scenarios) {
    const cost = s.result.costResult;
    const profit = s.targetPrice - cost.estimatedUnitCost;
    const marginRate = s.targetPrice > 0 ? ((profit / s.targetPrice) * 100).toFixed(1) : '0.0';
    compareRows += `<tr>
      <td>${escapeHtml(s.tierName)}</td>
      <td>${s.targetPrice}元</td>
      <td>${cost.estimatedUnitCost}元</td>
      <td>${cost.costRate}%</td>
      <td>${profit.toFixed(1)}元（${marginRate}%）</td>
      <td>${countRisks(s.result.riskWarnings, '高')}</td>
      <td>${escapeHtml(s.result.selectedStyle.name)}</td>
      <td>${escapeHtml(s.result.fabricRecommendations[0]?.fabric.name || '-')}</td>
    </tr>`;
  }

  const compareTable = `
    <table>
      <thead>
        <tr>
          <th>方案</th>
          <th>零售价</th>
          <th>单件成本</th>
          <th>成本率</th>
          <th>预计毛利</th>
          <th>高风险数</th>
          <th>款式</th>
          <th>面料</th>
        </tr>
      </thead>
      <tbody>
        ${compareRows}
      </tbody>
    </table>
  `;

  const scenarioSections = scenarios.map((s, i) => renderScenarioSection(s, i)).join('');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(category)} 三套方案对比</title>
  <style>
    body { font-family: 'Microsoft YaHei', SimSun, sans-serif; font-size: 11pt; line-height: 1.7; color: #1a202c; margin: 40px; }
    h1 { font-size: 20pt; color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; margin-bottom: 24px; }
    h2 { font-size: 14pt; color: #2c5282; margin-top: 28px; margin-bottom: 12px; border-left: 4px solid #3182ce; padding-left: 10px; }
    h3 { font-size: 12pt; color: #2d3748; margin-top: 18px; margin-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #cbd5e0; padding: 8px; font-size: 10.5pt; vertical-align: top; }
    th { background: #edf2f7; color: #2d3748; text-align: left; font-weight: 600; }
    .summary-box { background: #ebf8ff; border: 1px solid #90cdf4; padding: 16px; border-radius: 6px; margin-bottom: 16px; }
    .risk-high { color: #c53030; font-weight: bold; }
    .risk-medium { color: #dd6b20; font-weight: bold; }
    .risk-low { color: #38a169; }
    .section { margin-bottom: 32px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 9pt; }
  </style>
</head>
<body>
  <h1>${escapeHtml(category)} 三套方案对比</h1>

  <h2>📊 关键指标对比</h2>
  <div class="section">
    ${compareTable}
  </div>

  ${scenarioSections}

  <div class="footer">
    <p>生成时间：${dateStr}</p>
    <p>本方案由 AI 户外服饰智能设计 Agent 生成，仅供参考。</p>
  </div>
</body>
</html>`;
}

export function exportBatchWord(results: GenerationResult[]): string {
  const dateStr = new Date().toLocaleString('zh-CN');
  const resultSections = results.map((result, i) => renderResultSection(result, i)).join('');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>批量导出研发方案</title>
  <style>
    body { font-family: 'Microsoft YaHei', SimSun, sans-serif; font-size: 11pt; line-height: 1.7; color: #1a202c; margin: 40px; }
    h1 { font-size: 20pt; color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; margin-bottom: 24px; }
    h2 { font-size: 14pt; color: #2c5282; margin-top: 28px; margin-bottom: 12px; border-left: 4px solid #3182ce; padding-left: 10px; }
    h3 { font-size: 12pt; color: #2d3748; margin-top: 18px; margin-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #cbd5e0; padding: 8px; font-size: 10.5pt; vertical-align: top; }
    th { background: #edf2f7; color: #2d3748; text-align: left; font-weight: 600; }
    .summary-box { background: #ebf8ff; border: 1px solid #90cdf4; padding: 16px; border-radius: 6px; margin-bottom: 16px; }
    .risk-high { color: #c53030; font-weight: bold; }
    .risk-medium { color: #dd6b20; font-weight: bold; }
    .risk-low { color: #38a169; }
    .section { margin-bottom: 32px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 9pt; }
  </style>
</head>
<body>
  <h1>📦 批量导出研发方案</h1>
  <p>导出时间：${dateStr}，共 ${results.length} 个方案</p>

  ${resultSections}

  <div class="footer">
    <p>本方案由 AI 户外服饰智能设计 Agent 生成，仅供参考。</p>
  </div>
</body>
</html>`;
}
