import type { ParsedRequirement, FabricScore, StyleTemplate, MarketingCopy } from '@/types';
import marketingRules from '@/data/marketingRules.json';
import { chatCompletion, isMockMode } from './aiClient';

export async function generateMarketingCopy(
  requirement: ParsedRequirement,
  selectedFabric: FabricScore,
  selectedStyle: StyleTemplate
): Promise<MarketingCopy> {
  // Use rule-based fallback as base
  const baseCopy = generateRuleBasedCopy(requirement, selectedFabric, selectedStyle);

  // If real AI is available, try to enhance it
  if (!isMockMode()) {
    try {
      const aiCopy = await aiGenerateMarketingCopy(requirement, selectedFabric, selectedStyle);
      if (aiCopy && aiCopy.title) {
        return mergeWithFallback(aiCopy, baseCopy);
      }
    } catch (error) {
      console.warn('AI marketing copy generation failed, using rule-based result:', error);
    }
  }

  return baseCopy;
}

interface AiMarketingCopy {
  title?: string;
  sellingPoints?: string[];
  tiktokScript?: string;
  detailPageCopy?: string;
  liveScript?: string;
}

async function aiGenerateMarketingCopy(
  requirement: ParsedRequirement,
  selectedFabric: FabricScore,
  selectedStyle: StyleTemplate
): Promise<AiMarketingCopy> {
  const fabric = selectedFabric.fabric;
  const systemPrompt = `你是一位资深的户外服装电商文案策划。请根据产品信息，生成吸引人的电商营销文案。
请只返回 JSON 对象，不要返回其他内容。格式示例：
{
  "title": "商品标题",
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "tiktokScript": "抖音口播稿...",
  "detailPageCopy": "详情页文案...",
  "liveScript": "直播间话术..."
}
要求：
- title 控制在 20 字以内，突出品类、核心功能和价格优势
- sellingPoints 5 条，每条控制在 25 字以内
- tiktokScript 有画面感和互动感，适合 30-45 秒口播
- detailPageCopy 包含产品定位、适用场景、面料说明、款式特点
- liveScript 口语化，有促单紧迫感`;

  const userPrompt = `产品信息：
- 品类：${requirement.category}
- 目标人群：${requirement.ageRange}${requirement.gender}
- 使用场景：${requirement.scenes.join('、')}
- 季节：${requirement.season}
- 目标价格：${requirement.targetPrice}元以内
- 功能优先级：${requirement.functionPriorities.join('、')}
- 风格定位：${requirement.stylePositioning}
- 用户款式关键词：${requirement.styleKeywords?.join('、') || '无'}

面料信息：
- 名称：${fabric.name}
- 成分：${fabric.composition}
- 克重：${fabric.weightGsm}g/㎡
- 静水压：${fabric.hydrostaticHead || 0}mm
- 透湿率：${fabric.breathability || 0}g/㎡·24h
- UPF：${fabric.upf || 0}
- 防风：${fabric.windproof ? '是' : '否'}
- 弹力：${fabric.elasticity}
- 防水处理：${fabric.waterRepellent || '无'}
- 现货状态：${fabric.stockStatus}

款式信息：
- 名称：${selectedStyle.name}
- 版型：${selectedStyle.silhouette}
- 长度：${selectedStyle.length}
- 帽子：${selectedStyle.hood}
- 门襟：${selectedStyle.closure}
- 口袋：${selectedStyle.pockets}
- 袖口：${selectedStyle.cuff}
- 下摆：${selectedStyle.hem}
- 工艺：${selectedStyle.process}
- 颜色建议：${selectedStyle.colorSuggestions.join('、')}

请生成营销文案 JSON。`;

  const response = await chatCompletion(systemPrompt, userPrompt);
  return parseAiMarketingCopy(response);
}

function parseAiMarketingCopy(response: string): AiMarketingCopy {
  const cleaned = response.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return {};

  return JSON.parse(cleaned.slice(start, end + 1)) as AiMarketingCopy;
}

function mergeWithFallback(aiCopy: AiMarketingCopy, fallback: MarketingCopy): MarketingCopy {
  return {
    title: aiCopy.title || fallback.title,
    sellingPoints: aiCopy.sellingPoints?.length ? aiCopy.sellingPoints : fallback.sellingPoints,
    tiktokScript: aiCopy.tiktokScript || fallback.tiktokScript,
    detailPageCopy: aiCopy.detailPageCopy || fallback.detailPageCopy,
    liveScript: aiCopy.liveScript || fallback.liveScript,
  };
}

function generateRuleBasedCopy(
  requirement: ParsedRequirement,
  selectedFabric: FabricScore,
  selectedStyle: StyleTemplate
): MarketingCopy {
  const category = requirement.category;
  const templates = marketingRules.templates as {
    title: Record<string, string>;
    sellingPoints: Record<string, string[]>;
  };

  const genderText = requirement.gender === '女款' ? '女' : requirement.gender === '男款' ? '男' : '';
  const cleanStyleName = selectedStyle.name.replace(/(男款|女款|中性)/g, '').trim();
  const keywordTitle =
    requirement.styleKeywords && requirement.styleKeywords.length > 0
      ? `${requirement.styleKeywords.join('')}${requirement.category}`
      : cleanStyleName;
  const title = `${keywordTitle}${genderText ? ` ${genderText}` : ''}`;

  const sellingPointsTemplate = (templates.sellingPoints[category] || templates.sellingPoints['冲锋衣']).slice(0, 5);
  const sellingPoints = sellingPointsTemplate.map((point: string) => point);

  const fabric = selectedFabric.fabric;
  const sceneText = requirement.scenes.join('、');
  const functionText = requirement.functionPriorities.join('、');

  const audienceCall = requirement.gender === '女款' ? '姐妹们' : requirement.gender === '男款' ? '兄弟们' : '家人们';
  const audiencePronoun = requirement.gender === '女款' ? '姐妹' : requirement.gender === '男款' ? '兄弟' : '家人';

  const tiktokScript = `${audienceCall}看过来！这件${title}真的太适合${sceneText}了！

【画面：展示整体造型】

第一，它是${fabric.name}，${fabric.composition}材质，${getFabricHighlight(fabric, requirement)}。

第二，${selectedStyle.silhouette}版型，${selectedStyle.length}，上班通勤不违和，周末${requirement.scenes.includes('露营') ? '露营' : '出门'}也能穿。

第三，${getStyleHighlight(selectedStyle)}。

【画面：展示细节特写】

${requirement.targetPrice}元以内就能入手，喜欢的${audiencePronoun}点个关注，链接在下方！`;

  const detailPageCopy = `## 商品详情

### 产品定位
${requirement.stylePositioning}${category}，专为${requirement.ageRange}${requirement.gender}打造。

### 适用场景
${sceneText}

### 核心功能
${functionText}

### 面料说明
采用${fabric.name}，${fabric.composition}材质。
${fabric.hydrostaticHead > 0 ? `- 静水压：${fabric.hydrostaticHead}mm` : ''}
${fabric.breathability > 0 ? `- 透湿率：${fabric.breathability}g/㎡·24h` : ''}
${fabric.upf && fabric.upf > 0 ? `- UPF值：${fabric.upf}` : ''}
- ${fabric.waterRepellent}处理
- ${fabric.elasticity}面料

### 款式特点
- 版型：${selectedStyle.silhouette}
${selectedStyle.hood !== '无' ? `- 帽子：${selectedStyle.hood}` : ''}
${selectedStyle.closure !== '无' ? `- 门襟：${selectedStyle.closure}` : ''}
${selectedStyle.pockets !== '无' ? `- 口袋：${selectedStyle.pockets}` : ''}
${selectedStyle.cuff !== '无' ? `- 袖口：${selectedStyle.cuff}` : ''}
${selectedStyle.hem !== '无' ? `- 下摆：${selectedStyle.hem}` : ''}
${selectedStyle.ventilation !== '无' ? `- 透气：${selectedStyle.ventilation}` : ''}
- 工艺：${selectedStyle.process}

### 颜色选择
${selectedStyle.colorSuggestions.join(' / ')}

### 尺码建议
${selectedStyle.silhouette}版型，建议按正常尺码选择。`;

  const liveScript = `来，给大家看一下我们这款${title}！

【拿起衣服展示】

这件真的超级实用，${requirement.functionPriorities.slice(0, 3).join('、')}全都安排上了。

面料用的是${fabric.name}，大家看一下这个质感，上手摸一下就知道，绝对不是那种薄薄的廉价面料。

【展示${selectedStyle.hood !== '无' ? '帽子、' : ''}${selectedStyle.pockets !== '无' ? '口袋、' : ''}袖口等细节】

${getLiveDetail(selectedStyle)}关键是价格很友好，${requirement.targetPrice}元以内的预算就能拿下。${requirement.gender === '女款' ? '这个版型真的显瘦，' : ''}${requirement.gender}上身效果特别好。

喜欢的话直接拍，库存不多！`;

  return {
    title,
    sellingPoints,
    tiktokScript,
    detailPageCopy,
    liveScript,
  };
}

function getFabricHighlight(fabric: FabricScore['fabric'], requirement: ParsedRequirement): string {
  if (requirement.category === '羽绒服') return '保暖轻盈，冬天穿不臃肿';
  if (requirement.category === '棉服') return '厚实保暖，性价比很高';
  if (requirement.category === '风衣') return fabric.windproof ? '防风有型，春秋穿刚好' : '质感挺括，通勤显气质';
  if (requirement.category === 'T恤') return '亲肤透气，夏天穿不闷热';
  if (requirement.category === '卫衣') return '柔软舒适，单穿内搭都好看';
  if (requirement.category === '连衣裙') return '垂感好，上身显气质';
  if (requirement.functionPriorities.includes('防风')) return '防风效果杠杠的';
  if (requirement.functionPriorities.includes('防晒')) return '防晒又透气';
  return '日常穿着很舒适';
}

function getStyleHighlight(style: StyleTemplate): string {
  if (style.hood !== '无') return `${style.hood}设计，实用又好看`;
  if (style.pockets !== '无') return `${style.pockets}，收纳方便`;
  if (style.closure !== '无') return `${style.closure}，细节到位`;
  return `${style.silhouette}版型，上身效果好`;
}

function getLiveDetail(style: StyleTemplate): string {
  if (style.process.includes('防绒')) return '防绒工艺做得很好，不用担心钻绒。';
  if (style.process.includes('绗棉')) return '绗棉走线工整，填充均匀。';
  if (style.process.includes('标准车缝')) return '做工非常工整，走线细腻。';
  return `${style.process}，品质感拉满。`;
}
