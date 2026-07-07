import type { TechPack } from './techpack';

export type ProductCategory = string;
export type Gender = '女款' | '男款' | '中性';
export type Season = '春秋' | '夏季' | '冬季';
export type FunctionTag = '防水' | '防泼水' | '防风' | '透湿' | '轻量' | '防晒' | '保暖' | '弹力';
export type Scene = '通勤' | '露营' | '徒步' | '骑行';
export type StockStatus = '现货' | '需定织';
export type FabricStructure = '2L' | '2.5L' | '3L' | '涂层' | '复合';
export type ProcessType = 'normalSewing' | 'partialSeamTaping' | 'fullSeamTaping';

export interface RawRequirement {
  text?: string;
  category?: ProductCategory;
  gender?: Gender;
  ageRange?: string;
  scenes?: Scene[];
  season?: Season;
  targetPrice?: number;
  orderQuantity?: number;
  functions?: FunctionTag[];
  stylePreference?: string;
  notes?: string;
}

export interface ParsedRequirement {
  category: ProductCategory;
  gender: Gender;
  ageRange: string;
  scenes: Scene[];
  season: Season;
  targetPrice: number;
  orderQuantity: number;
  functionPriorities: FunctionTag[];
  stylePositioning: string;
  styleKeywords?: string[];
  quickResponseRequired: boolean;
  constraints: string[];
}

export interface Fabric {
  id: string;
  name: string;
  category: string;
  composition: string;
  structure: FabricStructure;
  weightGsm: number;
  widthCm: number;
  pricePerMeter: number;
  hydrostaticHead: number;
  breathability: number;
  upf?: number;
  windproof: boolean;
  waterRepellent: string;
  elasticity: string;
  abrasionResistance: string;
  suitableScenes: Scene[];
  suitableProducts: string[];
  suitableSeasons: Season[];
  moqMeters: number;
  stockStatus: StockStatus;
  supplier: string;
  riskNotes: string;
  warmLevel?: string;
  uvProtection?: string;
}

export interface FabricScore {
  fabric: Fabric;
  totalScore: number;
  sceneScore: number;
  functionScore: number;
  priceScore: number;
  quickResponseScore: number;
  seasonScore: number;
  recommendationReason: string;
}

export interface StyleTemplate {
  id: string;
  name: string;
  category: ProductCategory;
  gender: Gender;
  scenes: Scene[];
  season: Season;
  silhouette: string;
  length: string;
  hood: string;
  closure: string;
  pockets: string;
  cuff: string;
  hem: string;
  ventilation: string;
  process: string;
  costLevel: string;
  productionDifficulty: string;
  riskNotes: string;
  designReason: string;
  colorSuggestions: string[];
  suitablePriceRange: {
    min: number;
    max: number;
  };
}

export interface AccessoryItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface BomRule {
  fabricUsageMeters: {
    female: number;
    male: number;
    unisex: number;
  };
  liningUsageMeters: number;
  defaultLiningPrice: number;
  accessories: AccessoryItem[];
  laborCost: number;
  processCost: Record<ProcessType, number>;
  sampleFee: number;
  patternFee: number;
  lossRate: number;
}

export interface QuantityRule {
  maxQuantity: number;
  laborMultiplier: number;
  note: string;
}

export interface PriceBandRule {
  maxRetailPrice: number;
  note: string;
  categories?: string[];
}

export interface CostRules {
  quantityRules: QuantityRule[];
  priceBandRules: PriceBandRule[];
}

export interface BomItem {
  name: string;
  usage: string;
  unitPrice: number;
  subtotal: number;
  note: string;
}

export interface CostResult {
  bomItems: BomItem[];
  baseCost: number;
  lossCost: number;
  samplePatternAmortization: number;
  estimatedUnitCost: number;
  costRangeLow: number;
  costRangeHigh: number;
  retailPrice: number;
  costRate: number;
  costWarnings: string[];
  laborMultiplier: number;
  laborMultiplierNote: string;
}

export interface MarketingCopy {
  title: string;
  sellingPoints: string[];
  tiktokScript: string;
  detailPageCopy: string;
  liveScript: string;
}

export interface RiskWarning {
  category: string;
  severity: '高' | '中' | '低';
  message: string;
}

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

export interface GenerateRequest {
  text?: string;
  formData?: RawRequirement;
}

export type AiProvider = 'mock' | 'openai' | 'deepseek' | 'qwen' | 'gemini';
