import type { ParsedRequirement, FunctionTag, Scene } from '@/types';
import { visionCompletion, isMockMode } from './aiClient';

export interface ImageAnalysisResult {
  parsedRequirement: ParsedRequirement;
  description: string;
}

export async function analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
  if (isMockMode()) {
    return mockAnalyzeImage();
  }

  const base64 = imageBuffer.toString('base64');
  const systemPrompt = `你是一位服装产品分析专家。请根据上传的服装图片，识别服装的关键属性，只返回 JSON，不要解释。
输出字段：
{
  "category": "string（品类，如冲锋衣、连衣裙、羽绒服）",
  "gender": "女款" | "男款" | "中性",
  "ageRange": "string（如 25-40岁）",
  "scenes": ["通勤" | "露营" | "徒步" | "骑行"],
  "season": "春秋" | "夏季" | "冬季",
  "targetPrice": number（预估零售价，无法判断则填 399）,
  "functionPriorities": ["防水" | "防泼水" | "防风" | "透湿" | "轻量" | "防晒" | "保暖" | "弹力"],
  "stylePositioning": "string（如 城市轻户外、显瘦通勤）",
  "styleKeywords": ["string（款式关键词，如 直筒、连帽、收腰）"],
  "description": "string（对图片的简短描述）"
}
如果图片无法判断某字段，用合理默认值，并在 constraints 中标注"图片未明确，系统默认"。`;

  const userPrompt = '请分析这张服装图片，返回 JSON。';
  const response = await visionCompletion(systemPrompt, userPrompt, base64);
  return parseAnalysisResponse(response);
}

function parseAnalysisResponse(response: string): ImageAnalysisResult {
  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return mockAnalyzeImage();

    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<ParsedRequirement> & { description?: string };
    return normalizeAnalysisResult(parsed);
  } catch (error) {
    console.warn('Image analysis parse failed:', error);
    return mockAnalyzeImage();
  }
}

function normalizeAnalysisResult(parsed: Partial<ParsedRequirement> & { description?: string }): ImageAnalysisResult {
  const validFunctions: FunctionTag[] = ['防水', '防泼水', '防风', '透湿', '轻量', '防晒', '保暖', '弹力'];
  const validScenes: Scene[] = ['通勤', '露营', '徒步', '骑行'];
  const validSeasons: ParsedRequirement['season'][] = ['春秋', '夏季', '冬季'];
  const validGenders: ParsedRequirement['gender'][] = ['女款', '男款', '中性'];

  const constraints: string[] = [];
  if (!parsed.category) {
    parsed.category = '服装';
    constraints.push('图片未明确品类，系统默认为通用服装');
  }
  if (!parsed.gender || !validGenders.includes(parsed.gender)) {
    parsed.gender = '中性';
    constraints.push('图片未明确性别，系统默认为中性');
  }
  if (!parsed.season || !validSeasons.includes(parsed.season)) {
    parsed.season = '春秋';
    constraints.push('图片未明确季节，系统默认为春秋');
  }
  if (!parsed.ageRange) {
    parsed.ageRange = '25-40岁';
    constraints.push('图片未明确年龄段，系统默认为25-40岁');
  }
  if (!parsed.targetPrice || parsed.targetPrice <= 0) {
    parsed.targetPrice = 399;
    constraints.push('图片未明确目标价格，系统默认为399元');
  }
  if (!parsed.orderQuantity || parsed.orderQuantity <= 0) {
    parsed.orderQuantity = 100;
    constraints.push('图片未明确订单量，系统默认为100件');
  }

  parsed.scenes = (parsed.scenes || ['通勤']).filter((s): s is Scene => validScenes.includes(s as Scene));
  if (parsed.scenes.length === 0) parsed.scenes = ['通勤'];

  parsed.functionPriorities = (parsed.functionPriorities || []).filter((f): f is FunctionTag =>
    validFunctions.includes(f as FunctionTag)
  );
  if (parsed.functionPriorities.length === 0) parsed.functionPriorities = ['防风'];

  if (!parsed.stylePositioning) parsed.stylePositioning = '城市轻户外';
  if (!Array.isArray(parsed.styleKeywords)) parsed.styleKeywords = [];

  return {
    parsedRequirement: {
      ...parsed,
      quickResponseRequired: parsed.orderQuantity <= 100,
      constraints,
    } as ParsedRequirement,
    description: parsed.description || '',
  };
}

function mockAnalyzeImage(): ImageAnalysisResult {
  return {
    parsedRequirement: {
      category: '冲锋衣',
      gender: '女款',
      ageRange: '25-40岁',
      scenes: ['通勤', '露营'],
      season: '春秋',
      targetPrice: 399,
      orderQuantity: 100,
      functionPriorities: ['防风', '防泼水', '透湿'],
      stylePositioning: '城市轻户外',
      styleKeywords: ['连帽', '直筒'],
      quickResponseRequired: true,
      constraints: ['当前为图片分析演示模式，未调用真实 AI'],
    },
    description: '一件女款春秋城市轻户外冲锋衣',
  };
}
