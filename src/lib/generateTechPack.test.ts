import { describe, it, expect, vi } from 'vitest';
import { generateTechPack } from './generateTechPack';
import type { ParsedRequirement, FabricScore, StyleTemplate, CostResult } from '@/types';

vi.mock('./aiClient', () => ({
  isMockMode: () => true,
  chatCompletion: vi.fn(),
}));

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
