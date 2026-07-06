import type { ParsedRequirement, FabricScore, StyleTemplate, CostResult } from '@/types';
import type { TechPack, TechPackSizeRow, TechPackBomItem, TechPackConstructionNote } from '@/types/techpack';
import { chatCompletion, isMockMode } from './aiClient';
import { buildTechPack } from './techpackBuilder';

export async function generateTechPack(
  requirement: ParsedRequirement,
  selectedFabric: FabricScore,
  selectedStyle: StyleTemplate,
  costResult: CostResult
): Promise<TechPack> {
  const base = generateRuleBasedTechPack(requirement, selectedFabric, selectedStyle, costResult);

  if (!isMockMode()) {
    try {
      const aiPack = await aiGenerateTechPack(requirement, selectedFabric, selectedStyle, costResult);
      if (aiPack && aiPack.sizeChart && aiPack.sizeChart.length > 0) {
        return mergeWithFallback(aiPack, base);
      }
    } catch (error) {
      console.warn('AI Tech Pack generation failed, using rule-based result:', error);
    }
  }

  return base;
}

interface AiTechPack {
  sizeChart?: TechPackSizeRow[];
  construction?: TechPackConstructionNote[];
  colorways?: TechPack['colorways'];
  packaging?: Partial<TechPack['packaging']>;
  risks?: string[];
}

async function aiGenerateTechPack(
  requirement: ParsedRequirement,
  selectedFabric: FabricScore,
  selectedStyle: StyleTemplate,
  _costResult: CostResult
): Promise<AiTechPack> {
  const systemPrompt = `你是一位资深服装工艺师。请根据产品信息生成技术工艺单（Tech Pack）补充内容。
只返回 JSON，不要解释。格式：
{
  "sizeChart": [{"size": "S", "measurements": {"胸围": 108, "衣长": 70, "袖长": 62, "肩宽": 45}}],
  "construction": [{"title": "seams", "description": "...", "priority": "required"}],
  "colorways": [{"name": "主色", "hex": "#1e293b", "usage": "大身", "fabricPart": "面料"}],
  "packaging": {"hangtag": "...", "washingLabel": "...", "polybag": "...", "carton": "...", "specialNotes": "..."},
  "risks": ["风险1", "风险2"]
}
尺码至少 S/M/L/XL 四码，关键尺寸不少于 4 项。priority 只能是 required/recommended/optional。`;

  const userPrompt = `产品：${requirement.stylePositioning}${requirement.category}，${requirement.gender}，${requirement.season}，${requirement.scenes.join('、')}。
面料：${selectedFabric.fabric.name}，${selectedFabric.fabric.composition}。
款式：${selectedStyle.name}，${selectedStyle.silhouette}，${selectedStyle.process}。`;

  const response = await chatCompletion(systemPrompt, userPrompt);
  return parseAiTechPack(response);
}

function parseAiTechPack(response: string): AiTechPack {
  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return {};
    return JSON.parse(cleaned.slice(start, end + 1)) as AiTechPack;
  } catch {
    return {};
  }
}

function mergeWithFallback(ai: AiTechPack, fallback: TechPack): TechPack {
  return buildTechPack({
    ...fallback,
    sizeChart: ai.sizeChart?.length ? ai.sizeChart : fallback.sizeChart,
    construction: ai.construction?.length ? ai.construction : fallback.construction,
    colorways: ai.colorways?.length ? ai.colorways : fallback.colorways,
    packaging: ai.packaging ? { ...fallback.packaging, ...ai.packaging } : fallback.packaging,
    risks: ai.risks?.length ? ai.risks : fallback.risks,
  });
}

function generateRuleBasedTechPack(
  requirement: ParsedRequirement,
  selectedFabric: FabricScore,
  selectedStyle: StyleTemplate,
  costResult: CostResult
): TechPack {
  const fabric = selectedFabric.fabric;
  const category = requirement.category;

  return buildTechPack({
    productName: `${requirement.stylePositioning}${category}`,
    category,
    gender: requirement.gender,
    season: requirement.season,
    scenes: requirement.scenes,
    targetPrice: requirement.targetPrice,
    stylePositioning: requirement.stylePositioning,
    sizeChart: getDefaultSizeChart(category),
    bom: buildBomFromCost(fabric, selectedStyle, costResult),
    construction: getDefaultConstructionNotes(selectedStyle),
    colorways: selectedStyle.colorSuggestions.map((name, i) => ({
      name: i === 0 ? '主色' : `辅色${i}`,
      hex: '#334155',
      usage: i === 0 ? '大身/主体' : '拼接/细节',
      fabricPart: '面料',
    })),
    packaging: {
      hangtag: '品牌吊牌 + 品类标识 + 零售价标签',
      washingLabel: '含成分、洗涤方式、执行标准、安全类别',
      polybag: '独立透明自粘袋，印有尺码贴',
      carton: '五层瓦楞纸箱，外箱标注明细',
      specialNotes: requirement.category.includes('羽绒') ? '需加入干燥剂和防霉片' : '无特殊要求',
    },
    risks: [
      `面料${fabric.stockStatus === '现货' ? '现货充足' : '需定织，交期较长'}，注意排产`,
      `${selectedStyle.process}工艺对工厂有一定要求，需确认工厂产能`,
      `目标成本${costResult.estimatedUnitCost}元，建议零售价${costResult.retailPrice}元，毛利率需复核`,
    ],
  });
}

function getDefaultSizeChart(category: string): TechPackSizeRow[] {
  const isTop = ['T恤', '衬衫', '卫衣', '针织衫', '冲锋衣', '软壳外套', '防晒衣', '羽绒服', '棉服', '风衣', '大衣', '夹克', '西装', '背心', '马甲', '运动内衣', 'POLO衫', '骑行服', '登山服', '速干衣', '滑雪服'].some(c => category.includes(c));
  const sizes = ['S', 'M', 'L', 'XL'];
  const baseTop = { 胸围: 104, 衣长: 68, 袖长: 60, 肩宽: 44 };
  const baseBottom = { 腰围: 76, 臀围: 100, 裤长: 100, 脚口: 34 };
  const base = isTop ? baseTop : baseBottom;

  return sizes.map((size, i) => ({
    size,
    measurements: Object.fromEntries(
      Object.entries(base).map(([k, v]) => [k, v + i * 4])
    ),
  }));
}

function buildBomFromCost(fabric: FabricScore['fabric'], style: StyleTemplate, cost: CostResult): TechPackBomItem[] {
  const fabricItem: TechPackBomItem = {
    id: 'fab-1',
    name: fabric.name,
    category: '面料',
    spec: `${fabric.composition} ${fabric.weightGsm}g/㎡`,
    supplier: fabric.supplier,
    unit: '米',
    unitPrice: fabric.pricePerMeter,
    consumptionPerPiece: 2.2,
    moq: fabric.moqMeters,
    leadDays: fabric.stockStatus === '现货' ? 3 : 21,
    position: '大身/主体',
    notes: `${fabric.stockStatus}，${fabric.riskNotes}`,
  };

  const mainZipper: TechPackBomItem = {
    id: 'acc-1',
    name: '主拉链',
    category: '配件',
    spec: 'YKK 5# 尼龙拉链',
    supplier: 'YKK 或同级',
    unit: '条',
    unitPrice: 3.5,
    consumptionPerPiece: 1,
    moq: 500,
    leadDays: 7,
    position: style.closure !== '无' ? style.closure : '前中',
    notes: '需配色',
  };

  const thread: TechPackBomItem = {
    id: 'aux-1',
    name: '缝纫线',
    category: '辅料',
    spec: '402 涤纶高强线',
    supplier: '标准供应商',
    unit: '卷',
    unitPrice: 12,
    consumptionPerPiece: 0.05,
    moq: 50,
    leadDays: 3,
    position: '全件',
    notes: '按大身颜色配色',
  };

  const label: TechPackBomItem = {
    id: 'aux-2',
    name: '洗水标/尺码标',
    category: '辅料',
    spec: '缎面印标',
    supplier: '标准供应商',
    unit: '套',
    unitPrice: 0.6,
    consumptionPerPiece: 1,
    moq: 1000,
    leadDays: 5,
    position: '后领内侧',
    notes: '含成分和洗涤说明',
  };

  return [fabricItem, mainZipper, thread, label];
}

function getDefaultConstructionNotes(style: StyleTemplate): TechPackConstructionNote[] {
  return [
    {
      title: '缝制工艺',
      description: style.process,
      priority: 'required',
    },
    {
      title: '口袋工艺',
      description: style.pockets !== '无' ? style.pockets : '无特殊口袋要求',
      priority: 'required',
    },
    {
      title: '门襟/闭合',
      description: style.closure !== '无' ? style.closure : '按款式默认处理',
      priority: 'required',
    },
    {
      title: '袖口与下摆',
      description: `${style.cuff}，${style.hem}`,
      priority: 'recommended',
    },
    {
      title: '通风设计',
      description: style.ventilation !== '无' ? style.ventilation : '无特殊通风口',
      priority: 'optional',
    },
  ];
}
