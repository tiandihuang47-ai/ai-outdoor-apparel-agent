# Tech Pack + BOM Excel 导出实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为每个生成的户外服饰方案生成结构化 Tech Pack（技术工艺单），并支持导出为多 Sheet Excel。

**Architecture:** 在现有 `GenerationResult` 上扩展 `techPack` 字段；新增 `generateTechPack.ts` 负责规则+AI 生成 Tech Pack 数据；新增 `excelExport.ts` 用 `xlsx` 生成 Excel；前端新增 `TechPackPanel` 展示与导出入口；导出 API 新增 `format=techpack` 分支。

**Tech Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS + `xlsx` + Vitest

---

## 文件结构映射

| 文件 | 职责 |
|------|------|
| `src/types/index.ts` | 扩展 `GenerationResult`，新增 `TechPack` 相关类型 |
| `src/lib/techpackTypes.ts` | Tech Pack 类型定义（避免循环依赖） |
| `src/lib/techpackBuilder.ts` | 把 AI/规则生成的原始数据整理成标准 `TechPack` |
| `src/lib/generateTechPack.ts` | 规则生成 + AI 增强 Tech Pack |
| `src/lib/excelExport.ts` | 把 `TechPack` 生成 `.xlsx` Buffer |
| `src/app/api/export/route.ts` | 新增 `format=techpack` 导出分支 |
| `src/components/TechPackPanel.tsx` | Tech Pack 总展示面板 |
| `src/components/SizeChart.tsx` | 尺码表 |
| `src/components/BomTable.tsx` | 物料清单 |
| `src/components/ConstructionList.tsx` | 工艺要求 |
| `src/components/ColorwaySwatches.tsx` | 配色方案 |
| `src/components/PackagingNotes.tsx` | 包装要求 |
| `src/components/ResultPanel.tsx` | 增加「查看 Tech Pack」按钮 |
| `src/app/generator/page.tsx` | 增加 Tech Pack 展示状态 |
| `src/lib/generatePlan.ts` | 调用 `generateTechPack` 并写入结果 |

---

## Task 1: 扩展类型定义

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/techpackTypes.ts`
- Test: `src/lib/techpackBuilder.test.ts`（后续 Task 2 创建）

- [ ] **Step 1: 新增 Tech Pack 类型文件**

Create `src/lib/techpackTypes.ts`:

```typescript
export interface TechPackSizeRow {
  size: string;
  measurements: Record<string, number>;
}

export interface TechPackBomItem {
  id: string;
  name: string;
  category: '面料' | '辅料' | '配件';
  spec: string;
  supplier: string;
  unit: string;
  unitPrice: number;
  consumptionPerPiece: number;
  moq: number;
  leadDays: number;
  position: string;
  notes: string;
}

export interface TechPackConstructionNote {
  title: string;
  description: string;
  priority: 'required' | 'recommended' | 'optional';
}

export interface TechPackColorway {
  name: string;
  hex: string;
  usage: string;
  fabricPart: string;
}

export interface TechPackPackaging {
  hangtag: string;
  washingLabel: string;
  polybag: string;
  carton: string;
  specialNotes: string;
}

export interface TechPack {
  productName: string;
  category: string;
  gender: string;
  season: string;
  scenes: string[];
  targetPrice: number;
  stylePositioning: string;
  sizeChart: TechPackSizeRow[];
  bom: TechPackBomItem[];
  construction: TechPackConstructionNote[];
  colorways: TechPackColorway[];
  packaging: TechPackPackaging;
  risks: string[];
}
```

- [ ] **Step 2: 扩展 GenerationResult**

Modify `src/types/index.ts` at the end of `GenerationResult` interface (before `GenerateRequest`):

```typescript
import type { TechPack } from './techpackTypes';

export interface GenerationResult {
  parsedRequirement: ParsedRequirement;
  fabricRecommendations: FabricScore[];
  selectedStyle: StyleTemplate;
  costResult: CostResult;
  marketingCopy: MarketingCopy;
  riskWarnings: RiskWarning[];
  summary: string;
  techPack: TechPack;
}
```

Wait — importing `TechPack` into `types/index.ts` from `lib/techpackTypes.ts` creates cross-layer import. Better: keep `TechPack` types in `src/types/techpack.ts` and import from there.

Revise Step 1: create `src/types/techpack.ts` instead of `src/lib/techpackTypes.ts`.

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS (no usage yet)

- [ ] **Step 4: Commit**

```bash
git add src/types/techpack.ts src/types/index.ts
git commit -m "feat(types): add TechPack data model"
```

---

## Task 2: 实现 Tech Pack 生成器

**Files:**
- Create: `src/lib/techpackBuilder.ts`
- Create: `src/lib/generateTechPack.ts`
- Create: `src/lib/techpackBuilder.test.ts`
- Modify: `src/types/index.ts` (already done in Task 1)

- [ ] **Step 1: 创建规则生成器 `generateTechPack.ts`**

Create `src/lib/generateTechPack.ts`:

```typescript
import type { ParsedRequirement, FabricScore, StyleTemplate, CostResult } from '@/types';
import type { TechPack, TechPackSizeRow, TechPackBomItem, TechPackConstructionNote } from '@/types/techpack';
import { chatCompletion, isMockMode } from './aiClient';

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
  selectedStyle: StyleTemplate
): Promise<AiTechPack> {
  const systemPrompt = `你是一位资深服装工艺师。请根据产品信息生成技术工艺单（Tech Pack）补充内容。
只返回 JSON，不要解释。格式：
{
  "sizeChart": [{"size": "S", "measurements": {"胸围": 108, "衣长": 70, "袖长": 62, "肩宽": 45}}],
  "construction": [{"title": " seams", "description": "...", "priority": "required"}],
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
  return {
    ...fallback,
    sizeChart: ai.sizeChart?.length ? ai.sizeChart : fallback.sizeChart,
    construction: ai.construction?.length ? ai.construction : fallback.construction,
    colorways: ai.colorways?.length ? ai.colorways : fallback.colorways,
    packaging: ai.packaging ? { ...fallback.packaging, ...ai.packaging } : fallback.packaging,
    risks: ai.risks?.length ? ai.risks : fallback.risks,
  };
}

function generateRuleBasedTechPack(
  requirement: ParsedRequirement,
  selectedFabric: FabricScore,
  selectedStyle: StyleTemplate,
  costResult: CostResult
): TechPack {
  const fabric = selectedFabric.fabric;
  const category = requirement.category;

  return {
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
  };
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
```

- [ ] **Step 2: 创建 `techpackBuilder.ts` 标准化数据**

Create `src/lib/techpackBuilder.ts`:

```typescript
import type { TechPack, TechPackSizeRow, TechPackBomItem, TechPackConstructionNote, TechPackColorway, TechPackPackaging } from '@/types/techpack';

export function buildTechPack(input: Partial<TechPack>): TechPack {
  return {
    productName: input.productName || '未命名产品',
    category: input.category || '服装',
    gender: input.gender || '中性',
    season: input.season || '春秋',
    scenes: input.scenes || [],
    targetPrice: input.targetPrice || 0,
    stylePositioning: input.stylePositioning || '',
    sizeChart: normalizeSizeChart(input.sizeChart),
    bom: normalizeBom(input.bom),
    construction: normalizeConstruction(input.construction),
    colorways: normalizeColorways(input.colorways),
    packaging: normalizePackaging(input.packaging),
    risks: Array.isArray(input.risks) ? input.risks : [],
  };
}

function normalizeSizeChart(rows?: Partial<TechPackSizeRow>[]): TechPackSizeRow[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [{ size: '均码', measurements: {} }];
  }
  return rows.map((row) => ({
    size: row.size || '',
    measurements: row.measurements || {},
  }));
}

function normalizeBom(items?: Partial<TechPackBomItem>[]): TechPackBomItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((item) => ({
    id: item.id || '',
    name: item.name || '',
    category: (item.category as TechPackBomItem['category']) || '辅料',
    spec: item.spec || '',
    supplier: item.supplier || '',
    unit: item.unit || '',
    unitPrice: item.unitPrice || 0,
    consumptionPerPiece: item.consumptionPerPiece || 0,
    moq: item.moq || 0,
    leadDays: item.leadDays || 0,
    position: item.position || '',
    notes: item.notes || '',
  }));
}

function normalizeConstruction(notes?: Partial<TechPackConstructionNote>[]): TechPackConstructionNote[] {
  if (!Array.isArray(notes) || notes.length === 0) return [];
  const validPriorities: TechPackConstructionNote['priority'][] = ['required', 'recommended', 'optional'];
  return notes.map((note) => ({
    title: note.title || '',
    description: note.description || '',
    priority: validPriorities.includes(note.priority as TechPackConstructionNote['priority'])
      ? (note.priority as TechPackConstructionNote['priority'])
      : 'recommended',
  }));
}

function normalizeColorways(colorways?: Partial<TechPackColorway>[]): TechPackColorway[] {
  if (!Array.isArray(colorways) || colorways.length === 0) {
    return [{ name: '默认色', hex: '#94a3b8', usage: '大身', fabricPart: '面料' }];
  }
  return colorways.map((c) => ({
    name: c.name || '',
    hex: c.hex || '#94a3b8',
    usage: c.usage || '',
    fabricPart: c.fabricPart || '',
  }));
}

function normalizePackaging(packaging?: Partial<TechPackPackaging>): TechPackPackaging {
  return {
    hangtag: packaging?.hangtag || '',
    washingLabel: packaging?.washingLabel || '',
    polybag: packaging?.polybag || '',
    carton: packaging?.carton || '',
    specialNotes: packaging?.specialNotes || '',
  };
}
```

- [ ] **Step 3: 更新 `generateTechPack.ts` 使用 builder**

Modify the return in `generateRuleBasedTechPack` to wrap with `buildTechPack`:

```typescript
import { buildTechPack } from './techpackBuilder';

function generateRuleBasedTechPack(...): TechPack {
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
```

Also update `mergeWithFallback` to use `buildTechPack`:

```typescript
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
```

- [ ] **Step 4: 写单元测试**

Create `src/lib/techpackBuilder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildTechPack } from './techpackBuilder';
import type { TechPack } from '@/types/techpack';

describe('buildTechPack', () => {
  it('空输入返回带默认值的 TechPack', () => {
    const pack = buildTechPack({});
    expect(pack.category).toBe('服装');
    expect(pack.sizeChart).toHaveLength(1);
    expect(pack.risks).toEqual([]);
  });

  it('保留有效字段', () => {
    const input: Partial<TechPack> = {
      productName: '测试冲锋衣',
      category: '冲锋衣',
      sizeChart: [
        { size: 'M', measurements: { 胸围: 110, 衣长: 72 } },
      ],
    };
    const pack = buildTechPack(input);
    expect(pack.productName).toBe('测试冲锋衣');
    expect(pack.sizeChart[0].measurements['胸围']).toBe(110);
  });

  it('过滤非法 priority', () => {
    const pack = buildTechPack({
      construction: [{ title: 'a', description: 'b', priority: 'invalid' as any }],
    });
    expect(pack.construction[0].priority).toBe('recommended');
  });
});
```

Create `src/lib/generateTechPack.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateTechPack } from './generateTechPack';
import type { ParsedRequirement, FabricScore, StyleTemplate, CostResult } from '@/types';

const mockRequirement: ParsedRequirement = {
  category: '冲锋衣',
  gender: '女款',
  ageRange: '25-40岁',
  scenes: ['通勤', '露营'],
  season: '春秋',
  targetPrice: 399,
  orderQuantity: 100,
  functionPriorities: ['防风', '防泼水', '透湿'],
  stylePositioning: '城市轻户外',
  styleKeywords: [],
  quickResponseRequired: true,
  constraints: [],
};

const mockFabricScore: FabricScore = {
  fabric: {
    id: 'f1',
    name: '测试面料',
    category: '梭织',
    composition: '100% 涤纶',
    structure: '2L',
    weightGsm: 120,
    widthCm: 145,
    pricePerMeter: 35,
    hydrostaticHead: 5000,
    breathability: 5000,
    windproof: true,
    waterRepellent: 'DWR',
    elasticity: '无弹',
    abrasionResistance: '中等',
    suitableScenes: ['通勤', '露营'],
    suitableProducts: ['冲锋衣'],
    suitableSeasons: ['春秋'],
    moqMeters: 500,
    stockStatus: '现货',
    supplier: '测试供应商',
    riskNotes: '无',
  },
  totalScore: 90,
  sceneScore: 90,
  functionScore: 90,
  priceScore: 80,
  quickResponseScore: 95,
  seasonScore: 85,
  recommendationReason: '测试',
};

const mockStyle: StyleTemplate = {
  id: 's1',
  name: '女款城市冲锋衣',
  category: '冲锋衣',
  gender: '女款',
  scenes: ['通勤', '露营'],
  season: '春秋',
  silhouette: '修身',
  length: '常规',
  hood: '连帽',
  closure: '拉链',
  pockets: '插手袋+胸袋',
  cuff: '魔术贴袖口',
  hem: '可调节下摆',
  ventilation: '腋下透气拉链',
  process: '全压胶',
  costLevel: '中端',
  productionDifficulty: '中等',
  riskNotes: '无',
  designReason: '测试',
  colorSuggestions: ['藏青', '雾灰'],
  suitablePriceRange: { min: 299, max: 499 },
};

const mockCost: CostResult = {
  bomItems: [],
  baseCost: 120,
  lossCost: 5,
  samplePatternAmortization: 2,
  estimatedUnitCost: 127,
  costRangeLow: 120,
  costRangeHigh: 135,
  retailPrice: 399,
  costRate: 0.32,
  costWarnings: [],
  laborMultiplier: 1,
  laborMultiplierNote: '',
};

describe('generateTechPack', () => {
  it('规则生成返回完整 TechPack', async () => {
    const pack = await generateTechPack(mockRequirement, mockFabricScore, mockStyle, mockCost);
    expect(pack.category).toBe('冲锋衣');
    expect(pack.sizeChart.length).toBeGreaterThanOrEqual(4);
    expect(pack.bom.length).toBeGreaterThanOrEqual(3);
    expect(pack.construction.length).toBeGreaterThanOrEqual(3);
    expect(pack.colorways.length).toBe(2);
    expect(pack.risks.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: 新测试 PASS，旧测试保持 PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/generateTechPack.ts src/lib/techpackBuilder.ts src/lib/generateTechPack.test.ts src/lib/techpackBuilder.test.ts
git commit -m "feat(techpack): add Tech Pack generation with rule-based fallback"
```

---

## Task 3: 集成 Tech Pack 到生成流程

**Files:**
- Modify: `src/lib/generatePlan.ts`
- Modify: `src/lib/generatePlan.test.ts`（如果不存在则创建）

- [ ] **Step 1: 导入并调用 generateTechPack**

Modify `src/lib/generatePlan.ts`:

```typescript
import { generateTechPack } from './generateTechPack';

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
  const techPack = await generateTechPack(parsedRequirement, selectedFabric, selectedStyle, costResult);

  return {
    parsedRequirement,
    fabricRecommendations,
    selectedStyle,
    costResult,
    marketingCopy,
    riskWarnings,
    summary,
    techPack,
  };
}
```

- [ ] **Step 2: Run TypeScript check and tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/generatePlan.ts
git commit -m "feat(generate): integrate Tech Pack into generation result"
```

---

## Task 4: 安装 xlsx 并实现 Excel 导出

**Files:**
- Install: `xlsx` package
- Create: `src/lib/excelExport.ts`
- Create: `src/lib/excelExport.test.ts`

- [ ] **Step 1: 安装依赖**

Run: `npm install xlsx`
Expected: package.json 新增 `xlsx` 依赖

- [ ] **Step 2: 实现 Excel 导出函数**

Create `src/lib/excelExport.ts`:

```typescript
import * as XLSX from 'xlsx';
import type { TechPack } from '@/types/techpack';

export function exportTechPackToExcel(techPack: TechPack): Buffer {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: 产品信息
  const infoData = [
    ['产品名称', techPack.productName],
    ['品类', techPack.category],
    ['性别', techPack.gender],
    ['季节', techPack.season],
    ['场景', techPack.scenes.join('、')],
    ['目标零售价', techPack.targetPrice],
    ['风格定位', techPack.stylePositioning],
  ];
  const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
  XLSX.utils.book_append_sheet(workbook, infoSheet, '产品信息');

  // Sheet 2: 尺码表
  if (techPack.sizeChart.length > 0) {
    const sizeHeaders = ['尺码', ...Object.keys(techPack.sizeChart[0].measurements)];
    const sizeRows = techPack.sizeChart.map((row) => [
      row.size,
      ...Object.values(row.measurements),
    ]);
    const sizeSheet = XLSX.utils.aoa_to_sheet([sizeHeaders, ...sizeRows]);
    XLSX.utils.book_append_sheet(workbook, sizeSheet, '尺码表');
  }

  // Sheet 3: 物料清单
  const bomHeaders = ['序号', '类别', '名称', '规格', '供应商', '单位', '单价', '单件用量', 'MOQ', '交期(天)', '使用部位', '备注'];
  const bomRows = techPack.bom.map((item, index) => [
    index + 1,
    item.category,
    item.name,
    item.spec,
    item.supplier,
    item.unit,
    item.unitPrice,
    item.consumptionPerPiece,
    item.moq,
    item.leadDays,
    item.position,
    item.notes,
  ]);
  const bomSheet = XLSX.utils.aoa_to_sheet([bomHeaders, ...bomRows]);
  XLSX.utils.book_append_sheet(workbook, bomSheet, '物料清单');

  // Sheet 4: 工艺要求
  const constructionHeaders = ['优先级', '项目', '要求'];
  const constructionRows = techPack.construction.map((note) => [
    priorityText(note.priority),
    note.title,
    note.description,
  ]);
  const constructionSheet = XLSX.utils.aoa_to_sheet([constructionHeaders, ...constructionRows]);
  XLSX.utils.book_append_sheet(workbook, constructionSheet, '工艺要求');

  // Sheet 5: 配色方案
  const colorwayHeaders = ['名称', '色值', '用途', '面料部位'];
  const colorwayRows = techPack.colorways.map((c) => [c.name, c.hex, c.usage, c.fabricPart]);
  const colorwaySheet = XLSX.utils.aoa_to_sheet([colorwayHeaders, ...colorwayRows]);
  XLSX.utils.book_append_sheet(workbook, colorwaySheet, '配色方案');

  // Sheet 6: 包装要求
  const packagingData = [
    ['吊牌', techPack.packaging.hangtag],
    ['洗水标', techPack.packaging.washingLabel],
    ['包装袋', techPack.packaging.polybag],
    ['外箱', techPack.packaging.carton],
    ['特殊说明', techPack.packaging.specialNotes],
  ];
  const packagingSheet = XLSX.utils.aoa_to_sheet(packagingData);
  XLSX.utils.book_append_sheet(workbook, packagingSheet, '包装要求');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function priorityText(priority: TechPack['construction'][0]['priority']): string {
  const map = { required: '必须', recommended: '建议', optional: '可选' };
  return map[priority];
}
```

- [ ] **Step 3: 写测试**

Create `src/lib/excelExport.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { exportTechPackToExcel } from './excelExport';
import { buildTechPack } from './techpackBuilder';

describe('exportTechPackToExcel', () => {
  it('生成非空 Buffer', () => {
    const pack = buildTechPack({
      productName: '测试产品',
      category: '冲锋衣',
      sizeChart: [{ size: 'M', measurements: { 胸围: 110 } }],
      bom: [{
        id: '1',
        name: '面料',
        category: '面料',
        spec: '涤纶',
        supplier: 'A',
        unit: '米',
        unitPrice: 30,
        consumptionPerPiece: 2,
        moq: 100,
        leadDays: 7,
        position: '大身',
        notes: '',
      }],
    });
    const buffer = exportTechPackToExcel(pack);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/excelExport.ts src/lib/excelExport.test.ts
git commit -m "feat(export): add Tech Pack Excel export with xlsx"
```

---

## Task 5: 添加 Tech Pack 导出 API

**Files:**
- Modify: `src/app/api/export/route.ts`

- [ ] **Step 1: 导入并添加 techpack 分支**

Modify `src/app/api/export/route.ts`:

```typescript
import { exportTechPackToExcel } from '@/lib/excelExport';

// inside POST, after format parsing add:
if (format === 'techpack') {
  const result: GenerationResult = body;
  if (!result.techPack) {
    return NextResponse.json({ error: '该方案没有 Tech Pack 数据' }, { status: 400 });
  }

  const buffer = exportTechPackToExcel(result.techPack);
  const baseName = `TechPack_${result.parsedRequirement.category}_${dateStr}`;
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(baseName)}.xlsx"`,
    },
  });
}
```

- [ ] **Step 2: 写 API 路由测试**

Create `src/app/api/export/techpack.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { POST } from './route';
import { buildTechPack } from '@/lib/techpackBuilder';
import type { GenerationResult } from '@/types';

const mockResult: GenerationResult = {
  parsedRequirement: {
    category: '冲锋衣',
    gender: '女款',
    ageRange: '25-40岁',
    scenes: ['通勤'],
    season: '春秋',
    targetPrice: 399,
    orderQuantity: 100,
    functionPriorities: ['防风'],
    stylePositioning: '城市轻户外',
    styleKeywords: [],
    quickResponseRequired: true,
    constraints: [],
  },
  fabricRecommendations: [],
  selectedStyle: {} as any,
  costResult: {} as any,
  marketingCopy: {} as any,
  riskWarnings: [],
  summary: '测试',
  techPack: buildTechPack({
    productName: '测试',
    category: '冲锋衣',
    sizeChart: [{ size: 'M', measurements: { 胸围: 110 } }],
    bom: [{
      id: '1', name: '面料', category: '面料', spec: '涤纶', supplier: 'A', unit: '米',
      unitPrice: 30, consumptionPerPiece: 2, moq: 100, leadDays: 7, position: '大身', notes: '',
    }],
  }),
} as unknown as GenerationResult;

describe('/api/export techpack', () => {
  it('导出 Excel 成功', async () => {
    const request = new Request('http://localhost/api/export?format=techpack', {
      method: 'POST',
      body: JSON.stringify(mockResult),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('spreadsheetml.sheet');
  });

  it('缺少 techPack 返回 400', async () => {
    const badResult = { ...mockResult, techPack: undefined };
    const request = new Request('http://localhost/api/export?format=techpack', {
      method: 'POST',
      body: JSON.stringify(badResult),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/export/route.ts src/app/api/export/techpack.test.ts
git commit -m "feat(api): add Tech Pack Excel export endpoint"
```

---

## Task 6: 创建前端 Tech Pack 展示组件

**Files:**
- Create: `src/components/SizeChart.tsx`
- Create: `src/components/BomTable.tsx`
- Create: `src/components/ConstructionList.tsx`
- Create: `src/components/ColorwaySwatches.tsx`
- Create: `src/components/PackagingNotes.tsx`
- Create: `src/components/TechPackPanel.tsx`

- [ ] **Step 1: 创建 SizeChart**

Create `src/components/SizeChart.tsx`:

```typescript
'use client';

import type { TechPackSizeRow } from '@/types/techpack';

interface SizeChartProps {
  rows: TechPackSizeRow[];
}

export default function SizeChart({ rows }: SizeChartProps) {
  if (!rows || rows.length === 0) return <p className="text-sm text-slate-400">暂无尺码数据</p>;

  const measurementKeys = Object.keys(rows[0].measurements);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">尺码</th>
            {measurementKeys.map((key) => (
              <th key={key} className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.size} className="even:bg-slate-50">
              <td className="border border-slate-300 px-3 py-2 font-medium text-slate-800">{row.size}</td>
              {measurementKeys.map((key) => (
                <td key={key} className="border border-slate-300 px-3 py-2 text-slate-700">{row.measurements[key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: 创建 BomTable**

Create `src/components/BomTable.tsx`:

```typescript
'use client';

import type { TechPackBomItem } from '@/types/techpack';

interface BomTableProps {
  items: TechPackBomItem[];
}

export default function BomTable({ items }: BomTableProps) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">暂无物料数据</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">类别</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">名称</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">规格</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">供应商</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">单价</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">用量</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">MOQ</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">部位</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="even:bg-slate-50">
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.category}</td>
              <td className="border border-slate-300 px-2 py-2 font-medium text-slate-800">{item.name}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.spec}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.supplier}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.unitPrice}元/{item.unit}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.consumptionPerPiece}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.moq}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.position}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: 创建 ConstructionList**

Create `src/components/ConstructionList.tsx`:

```typescript
'use client';

import type { TechPackConstructionNote } from '@/types/techpack';

interface ConstructionListProps {
  notes: TechPackConstructionNote[];
}

const priorityLabels = {
  required: { text: '必须', class: 'bg-red-100 text-red-700' },
  recommended: { text: '建议', class: 'bg-yellow-100 text-yellow-700' },
  optional: { text: '可选', class: 'bg-blue-100 text-blue-700' },
};

export default function ConstructionList({ notes }: ConstructionListProps) {
  if (!notes || notes.length === 0) return <p className="text-sm text-slate-400">暂无工艺要求</p>;

  return (
    <ul className="space-y-2">
      {notes.map((note, index) => (
        <li key={index} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
          <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${priorityLabels[note.priority].class}`}>
            {priorityLabels[note.priority].text}
          </span>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{note.title}</div>
            <div className="text-sm text-slate-600 mt-0.5">{note.description}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: 创建 ColorwaySwatches**

Create `src/components/ColorwaySwatches.tsx`:

```typescript
'use client';

import type { TechPackColorway } from '@/types/techpack';

interface ColorwaySwatchesProps {
  colorways: TechPackColorway[];
}

export default function ColorwaySwatches({ colorways }: ColorwaySwatchesProps) {
  if (!colorways || colorways.length === 0) return <p className="text-sm text-slate-400">暂无配色数据</p>;

  return (
    <div className="flex flex-wrap gap-4">
      {colorways.map((color, index) => (
        <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white">
          <div
            className="w-10 h-10 rounded-full border border-slate-300"
            style={{ backgroundColor: color.hex }}
            title={color.hex}
          />
          <div>
            <div className="font-medium text-slate-800 text-sm">{color.name}</div>
            <div className="text-xs text-slate-500">{color.usage} · {color.fabricPart}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: 创建 PackagingNotes**

Create `src/components/PackagingNotes.tsx`:

```typescript
'use client';

import type { TechPackPackaging } from '@/types/techpack';

interface PackagingNotesProps {
  packaging: TechPackPackaging;
}

export default function PackagingNotes({ packaging }: PackagingNotesProps) {
  const items = [
    { label: '吊牌', value: packaging.hangtag },
    { label: '洗水标', value: packaging.washingLabel },
    { label: '包装袋', value: packaging.polybag },
    { label: '外箱', value: packaging.carton },
    { label: '特殊说明', value: packaging.specialNotes },
  ];

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[80px_1fr] gap-2 text-sm">
          <span className="text-slate-500">{item.label}</span>
          <span className="text-slate-800">{item.value || '-'}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: 创建 TechPackPanel**

Create `src/components/TechPackPanel.tsx`:

```typescript
'use client';

import type { TechPack } from '@/types/techpack';
import SizeChart from './SizeChart';
import BomTable from './BomTable';
import ConstructionList from './ConstructionList';
import ColorwaySwatches from './ColorwaySwatches';
import PackagingNotes from './PackagingNotes';

interface TechPackPanelProps {
  techPack: TechPack;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-base font-bold text-slate-800 mb-3 pb-1 border-b border-slate-200">{title}</h3>
      {children}
    </section>
  );
}

export default function TechPackPanel({ techPack }: TechPackPanelProps) {
  return (
    <div className="bg-white text-slate-800 rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{techPack.productName}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {techPack.category} · {techPack.gender} · {techPack.season} · {techPack.scenes.join('、')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">目标零售价</div>
          <div className="text-lg font-bold text-slate-900">¥{techPack.targetPrice}</div>
        </div>
      </div>

      <Section title="📏 尺码表">
        <SizeChart rows={techPack.sizeChart} />
      </Section>

      <Section title="🧵 物料清单（BOM）">
        <BomTable items={techPack.bom} />
      </Section>

      <Section title="🔧 工艺要求">
        <ConstructionList notes={techPack.construction} />
      </Section>

      <Section title="🎨 配色方案">
        <ColorwaySwatches colorways={techPack.colorways} />
      </Section>

      <Section title="📦 包装要求">
        <PackagingNotes packaging={techPack.packaging} />
      </Section>

      {techPack.risks.length > 0 && (
        <Section title="⚠️ 风险提示">
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
            {techPack.risks.map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/components/SizeChart.tsx src/components/BomTable.tsx src/components/ConstructionList.tsx src/components/ColorwaySwatches.tsx src/components/PackagingNotes.tsx src/components/TechPackPanel.tsx
git commit -m "feat(ui): add Tech Pack display components"
```

---

## Task 7: 集成 Tech Pack 到结果页与生成器

**Files:**
- Modify: `src/components/ResultPanel.tsx`
- Modify: `src/components/ExportButton.tsx`
- Modify: `src/app/generator/page.tsx`

- [ ] **Step 1: ResultPanel 增加查看按钮**

Modify `src/components/ResultPanel.tsx`:

```typescript
interface ResultPanelProps {
  result: GenerationResult | null;
  onViewTechPack?: () => void;
}

export default function ResultPanel({ result, onViewTechPack }: ResultPanelProps) {
  // ... existing code ...

  return (
    <div className="space-y-6">
      {/* existing cards */}

      <div className="flex gap-3">
        <ExportButton result={result} />
        <button
          onClick={onViewTechPack}
          className="flex-1 py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 transition-all text-sm"
        >
          📋 查看 Tech Pack
        </button>
      </div>
    </div>
  );
}
```

Note: Move ExportButton inside the flex container. Actually the current ExportButton renders its own grid. We need to restructure slightly. Put ExportButton first, then the Tech Pack button side by side or stacked.

Better: replace the ExportButton standalone line with:

```tsx
<div className="flex flex-col sm:flex-row gap-3">
  <div className="flex-1"><ExportButton result={result} /></div>
  <button
    onClick={onViewTechPack}
    className="flex-1 py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 transition-all text-sm"
  >
    📋 查看 Tech Pack
  </button>
</div>
```

But ExportButton renders a div with grid. The flex wrapper will contain that div and the button. This should work visually but might be slightly off. Alternatively, modify ExportButton to accept a `className` or render just the buttons. For minimal change, keep ExportButton as is and add the Tech Pack button below it.

Revised simpler approach: keep ExportButton where it is, add Tech Pack button just above or below it.

```tsx
<div className="flex gap-3">
  <button onClick={onViewTechPack} className="...">📋 查看 Tech Pack</button>
</div>
<ExportButton result={result} />
```

- [ ] **Step 2: ExportButton 增加 Tech Pack Excel 导出**

Modify `src/components/ExportButton.tsx`:

Add `'techpack'` to format union and handler:

```typescript
type FeedbackState =
  | { type: 'idle' }
  | { type: 'loading'; format: 'markdown' | 'doc' | 'techpack' }
  | { type: 'success'; format: 'markdown' | 'doc' | 'techpack' }
  | { type: 'error'; message: string };
```

Add handler:

```typescript
const handleExportTechPack = async () => {
  if (!result.techPack) {
    setFeedback({ type: 'error', message: '暂无 Tech Pack 数据' });
    setTimeout(() => setFeedback({ type: 'idle' }), 3000);
    return;
  }

  setFeedback({ type: 'loading', format: 'techpack' });

  try {
    const response = await fetch('/api/export?format=techpack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error((errData as { error?: string }).error || '导出失败');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `TechPack_${result.parsedRequirement.category}_${dateStr}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFeedback({ type: 'success', format: 'techpack' });
    setTimeout(() => setFeedback({ type: 'idle' }), 2500);
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出失败，请重试';
    setFeedback({ type: 'error', message });
    setTimeout(() => setFeedback({ type: 'idle' }), 4000);
  }
};
```

Add button:

```tsx
<button
  onClick={handleExportTechPack}
  disabled={isLoading}
  className="py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
>
  {loadingFormat === 'techpack' ? (
    <>
      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      导出中...
    </>
  ) : (
    <>📊 Tech Pack Excel</>
  )}
</button>
```

Update success/error message text to include techpack.

- [ ] **Step 3: generator/page.tsx 增加 Tech Pack 展示状态**

Modify `src/app/generator/page.tsx`:

Add state:

```typescript
const [showTechPack, setShowTechPack] = useState(false);
```

Pass callback to ResultPanel:

```tsx
<ResultPanel result={result} onViewTechPack={() => setShowTechPack(true)} />
```

In the result display area, conditionally show TechPackPanel:

Find the result rendering section and add:

```tsx
{showTechPack && result && (
  <GlassCard className="mb-6" hover={false}>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-white">📋 Tech Pack（技术工艺单）</h2>
      <button
        onClick={() => setShowTechPack(false)}
        className="text-sm text-slate-400 hover:text-white"
      >
        收起
      </button>
    </div>
    <TechPackPanel techPack={result.techPack} />
  </GlassCard>
)}
```

Also import `TechPackPanel` at top.

- [ ] **Step 4: Run tests and TypeScript check**

Run: `npx tsc --noEmit && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ResultPanel.tsx src/components/ExportButton.tsx src/app/generator/page.tsx
git commit -m "feat(ui): integrate Tech Pack view and export into generator"
```

---

## Task 8: 历史记录支持打开 Tech Pack

**Files:**
- Modify: `src/components/HistoryPanel.tsx`
- Modify: `src/lib/historyStorage.ts`

- [ ] **Step 1: 确保历史记录保存 techPack**

Verify `src/lib/historyStorage.ts` saves the entire `GenerationResult` including `techPack`. Since it saves the result object as-is, this should already work. No change needed unless `saveSingleResult` strips fields.

- [ ] **Step 2: HistoryPanel 增加打开 Tech Pack 回调**

Modify `src/components/HistoryPanel.tsx`:

Add prop:

```typescript
interface HistoryPanelProps {
  onSelect: (item: HistoryItem) => void;
  onCompare?: (scenarios: Scenario[]) => void;
  userEmail?: string | null;
  onSyncLocal?: () => void;
  onViewTechPack?: (item: HistoryItem) => void;
}
```

In the history item render area, add a small button or menu. Since the existing item click triggers `onSelect`, add a dedicated button inside the item card.

Locate the item rendering JSX (around line 400+ in the current file) and add inside the item card:

```tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    onViewTechPack?.(item);
  }}
  className="text-xs text-indigo-400 hover:text-indigo-300"
>
  Tech Pack
</button>
```

- [ ] **Step 3: generator/page.tsx 处理历史记录 Tech Pack 打开**

Pass handler to HistoryPanel:

```tsx
<HistoryPanel
  onSelect={handleHistorySelect}
  onCompare={handleHistoryCompare}
  userEmail={userEmail}
  onSyncLocal={syncLocalToCloud}
  onViewTechPack={(item) => {
    if (item.type === 'single') {
      setResult(item.data as GenerationResult);
      setShowTechPack(true);
    }
  }}
/>
```

- [ ] **Step 4: Run tests and TypeScript check**

Run: `npx tsc --noEmit && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/HistoryPanel.tsx src/app/generator/page.tsx
git commit -m "feat(history): support opening Tech Pack from history"
```

---

## Task 9: 端到端验证与构建

**Files:**
- All modified files

- [ ] **Step 1: 运行完整测试**

Run: `npm test`
Expected: all tests PASS

- [ ] **Step 2: 运行 TypeScript 检查**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: 本地构建**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: 本地启动并验证**

Run: `npm run dev`
Open http://localhost:3000/generator

验证：
1. 生成一个方案
2. 结果页出现「查看 Tech Pack」按钮
3. 点击后展示尺码表、BOM、工艺、配色、包装、风险
4. 点击「Tech Pack Excel」导出并下载 .xlsx
5. Excel 可用 WPS/Excel 打开，包含 6 个 sheet
6. 历史记录中可打开 Tech Pack

- [ ] **Step 5: 提交并推送**

```bash
git push origin main
```

- [ ] **Step 6: 检查 Vercel 部署**

Run: `npx vercel ls`
Expected: latest deployment Ready

---

## Spec Coverage Self-Review

| 设计文档要求 | 对应任务 |
|-------------|---------|
| Tech Pack 数据模型 | Task 1 |
| AI 生成增强 | Task 2 |
| Tech Pack 展示面板 | Task 6 |
| 尺码表组件 | Task 6 |
| 物料清单组件 | Task 6 |
| Excel 导出 | Task 4, Task 5 |
| 历史记录集成 | Task 8 |

No placeholders found. Type names consistent (`TechPack`, `TechPackSizeRow`, etc.).
