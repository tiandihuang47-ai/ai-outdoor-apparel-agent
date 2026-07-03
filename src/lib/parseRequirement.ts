import type { RawRequirement, ParsedRequirement, FunctionTag, Scene } from '@/types';
import { isMockMode, chatCompletion } from './aiClient';

const STYLE_FEATURE_KEYWORDS = [
  '直筒', '修身', '宽松', '落肩', '高腰', '紧身', '微宽松', 'A字',
  '收腰', '短款', '长款', '中长款', '九分', '长裤', '长袖', '短袖',
  '无袖', '圆领', 'V领', '连帽', '无帽', '立领', '翻领', '工装',
  '飞行员', '束脚', '阔腿', '喇叭', '锥形', '小脚'
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '冲锋衣': ['冲锋衣', '硬壳', '防水外套'],
  '软壳外套': ['软壳', '软壳外套', '软壳衣'],
  '防晒衣': ['防晒衣', '防晒服', '皮肤衣'],
  '羽绒服': ['羽绒服', '羽绒外套', '羽绒衣'],
  '棉服': ['棉服', '棉衣', '棉袄', '面包服'],
  '风衣': ['风衣', '防风外套'],
  '大衣': ['大衣', '毛呢大衣', '呢大衣'],
  '夹克': ['夹克', '夹克外套', '棒球服', '牛仔外套', '机车夹克', '飞行员夹克'],
  '西装': ['西装', '西服', '小西装'],
  'T恤': ['T恤', 't恤', '短袖', '长袖T恤'],
  '衬衫': ['衬衫', '衬衣'],
  '卫衣': ['卫衣', '帽衫'],
  '针织衫': ['针织衫', '毛衣', '开衫'],
  '背心': ['背心', '无袖上衣'],
  '马甲': ['马甲', '坎肩'],
  '连衣裙': ['连衣裙', '半身裙', 'A字裙', '百褶裙'],
  '童装': ['童装', '儿童服装', '小孩衣服', '童款', '儿童'],
  '运动内衣': ['运动内衣', '运动文胸', '运动背心'],
  '工装裤': ['工装裤', '工装长裤', '多口袋裤'],
  'POLO衫': ['POLO衫', 'Polo衫', 'polo衫', '翻领T恤', '高尔夫衫'],
  '牛仔裤': ['牛仔裤', '牛仔长裤'],
  '休闲裤': ['休闲裤', '西裤', '运动裤', '卫裤'],
  '短裤': ['短裤', '五分裤'],
  '瑜伽裤': ['瑜伽裤', '鲨鱼裤', '打底裤'],
  '滑雪服': ['滑雪服', '滑雪衣'],
  '骑行服': ['骑行服', '骑行衣'],
  '登山服': ['登山服', '登山衣'],
  '速干衣': ['速干衣', '速干T恤', '速干衬衫'],
  '泳衣': ['泳衣', '泳裤', '比基尼'],
  '睡衣': ['睡衣', '家居服'],
  '保暖内衣': ['保暖内衣', '秋衣秋裤', '打底衫'],
  '袜子': ['袜子', '运动袜', '徒步袜', '中筒袜', '短袜'],
  '帽子': ['帽子', '棒球帽', '渔夫帽', '遮阳帽', '针织帽', '毛线帽'],
  '手套': ['手套', '保暖手套', '触屏手套', '骑行手套'],
  '围巾': ['围巾', '围脖', '披肩'],
};

export async function parseRequirement(input: RawRequirement): Promise<ParsedRequirement> {
  if (input.text && !input.category) {
    return parseFromNaturalLanguage(input);
  }

  return parseFromFormData(input);
}

function parseFromFormData(input: RawRequirement): ParsedRequirement {
  const category = (input.category || '服装').trim();
  const gender = (input.gender || '中性') as ParsedRequirement['gender'];
  const ageRange = input.ageRange || '25-40岁';
  const scenes = (input.scenes && input.scenes.length > 0 ? input.scenes : ['通勤']) as Scene[];
  const season = (input.season || '春秋') as ParsedRequirement['season'];
  const targetPrice = input.targetPrice || 399;
  const orderQuantity = input.orderQuantity || 100;
  const functionPriorities = (input.functions && input.functions.length > 0
    ? input.functions
    : getDefaultFunctions(category)) as FunctionTag[];
  const stylePositioning = input.stylePreference || getDefaultPositioning(scenes, category);
  const styleKeywords = input.text ? detectStyleKeywords(input.text) : [];
  const quickResponseRequired = orderQuantity <= 100;
  const constraints: string[] = [];

  if (!input.category || input.category.trim() === '') constraints.push('用户未明确产品品类，系统默认为通用服装');
  if (!input.gender) constraints.push('用户未明确性别，系统默认为中性');
  if (!input.season) constraints.push('用户未明确季节，系统默认为春秋');

  return {
    category,
    gender,
    ageRange,
    scenes,
    season,
    targetPrice,
    orderQuantity,
    functionPriorities,
    stylePositioning,
    styleKeywords,
    quickResponseRequired,
    constraints,
  };
}

async function parseFromNaturalLanguage(input: RawRequirement): Promise<ParsedRequirement> {
  if (isMockMode()) {
    return mockParseNaturalLanguage(input.text || '');
  }

  const systemPrompt = `你是一个服装研发需求分析助手。
你的任务是把用户输入的自然语言需求，解析成结构化研发参数。

要求：
1. 只输出JSON。
2. 不要输出解释。
3. 如果用户没有明确说明，用合理默认值，但要在 constraints 中标注"用户未明确，系统默认"。
4. 品类由用户自由描述，例如：冲锋衣、软壳外套、防晒衣、羽绒服、棉服、风衣、大衣、夹克、西装、T恤、衬衫、卫衣、针织衫、连衣裙、牛仔裤、休闲裤、瑜伽裤、滑雪服、骑行服、泳衣、睡衣等。请从用户描述中准确提取品类名称。
5. 功能优先级根据用户描述排序。

输出JSON格式：
{
  "category": "string（用户想做的服装类型）",
  "gender": "女款" | "男款" | "中性",
  "ageRange": "string",
  "scenes": ["通勤" | "露营" | "徒步" | "骑行"],
  "season": "春秋" | "夏季" | "冬季",
  "targetPrice": number,
  "orderQuantity": number,
  "functionPriorities": ["防水" | "防泼水" | "防风" | "透湿" | "轻量" | "防晒" | "保暖" | "弹力"],
  "stylePositioning": "string",
  "styleKeywords": ["string（从用户描述中提取的款式关键词，如直筒、V领、高腰、宽松等）"],
  "quickResponseRequired": boolean,
  "constraints": ["string"]
}`;

  const userPrompt = input.text || '';

  try {
    const response = await chatCompletion(systemPrompt, userPrompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ParsedRequirement;
      // Normalize category to supported categories
      const normalizedCategory = detectCategory(parsed.category + ' ' + userPrompt);
      parsed.category = normalizedCategory === '服装' ? parsed.category : normalizedCategory;

      // Filter function priorities to valid tags
      const validFunctions: FunctionTag[] = ['防水', '防泼水', '防风', '透湿', '轻量', '防晒', '保暖', '弹力'];
      parsed.functionPriorities = parsed.functionPriorities.filter((f) => validFunctions.includes(f as FunctionTag)) as FunctionTag[];
      if (parsed.functionPriorities.length === 0) {
        parsed.functionPriorities = getDefaultFunctions(parsed.category);
      }

      return parsed;
    }
  } catch {
    // fallback to mock
  }

  return mockParseNaturalLanguage(input.text || '');
}

function mockParseNaturalLanguage(text: string): ParsedRequirement {
  const detectedCategory = detectCategory(text);
  const result: ParsedRequirement = {
    category: detectedCategory,
    gender: '中性',
    ageRange: '25-40岁',
    scenes: ['通勤'],
    season: '春秋',
    targetPrice: 399,
    orderQuantity: 100,
    functionPriorities: getDefaultFunctions(detectedCategory),
    stylePositioning: getDefaultPositioning([], detectedCategory),
    styleKeywords: detectStyleKeywords(text),
    quickResponseRequired: true,
    constraints: [],
  };

  if (text.includes('女')) result.gender = '女款';
  if (text.includes('男')) result.gender = '男款';

  if (text.includes('童') || text.includes('儿童') || text.includes('小孩')) {
    result.ageRange = '3-12岁';
    result.constraints.push('检测到童装需求，系统默认年龄段为3-12岁');
  }

  if (text.includes('露营') || text.includes('徒步')) {
    if (!result.scenes.includes('露营')) result.scenes.push('露营' as Scene);
    if (!result.scenes.includes('徒步')) result.scenes.push('徒步' as Scene);
  }
  if (text.includes('骑行')) result.scenes.push('骑行' as Scene);

  if (text.includes('夏')) result.season = '夏季';
  if (text.includes('冬')) result.season = '冬季';

  const priceMatch = text.match(/(\d+)元/);
  if (priceMatch) result.targetPrice = parseInt(priceMatch[1]);

  const qtyMatch = text.match(/(\d+)件/);
  if (qtyMatch) result.orderQuantity = parseInt(qtyMatch[1]);

  result.quickResponseRequired = result.orderQuantity <= 100;

  if (text.includes('防水')) {
    if (!result.functionPriorities.includes('防水')) result.functionPriorities = ['防水', ...result.functionPriorities];
  }
  if (text.includes('轻')) {
    if (!result.functionPriorities.includes('轻量')) result.functionPriorities.push('轻量');
  }

  if (text.includes('城市') || text.includes('通勤')) {
    result.stylePositioning = '城市轻户外';
  }

  return result;
}

function detectCategory(text: string): string {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category;
      }
    }
  }
  return '服装';
}

function detectStyleKeywords(text: string): string[] {
  return STYLE_FEATURE_KEYWORDS.filter((keyword) => text.includes(keyword));
}

function getDefaultFunctions(category: string): FunctionTag[] {
  if (category.includes('冲锋衣')) return ['防风', '防泼水', '透湿'];
  if (category.includes('软壳')) return ['防风', '弹力', '保暖'];
  if (category.includes('防晒')) return ['防晒', '轻量', '透湿'];
  if (category.includes('羽绒') || category.includes('棉服')) return ['保暖', '防风', '轻量'];
  if (category.includes('风衣') || category.includes('大衣')) return ['防风', '保暖'];
  if (category.includes('T恤') || category.includes('短袖')) return ['轻量', '透湿'];
  if (category.includes('衬衫')) return ['轻量', '透湿'];
  if (category.includes('卫衣')) return ['保暖', '轻量'];
  if (category.includes('针织') || category.includes('毛衣')) return ['保暖', '轻量'];
  if (category.includes('连衣裙')) return ['轻量', '透湿'];
  if (category.includes('牛仔裤')) return ['保暖', '弹力'];
  if (category.includes('休闲裤')) return ['轻量', '弹力'];
  if (category.includes('瑜伽') || category.includes('鲨鱼')) return ['弹力', '轻量', '透湿'];
  if (category.includes('短裤')) return ['轻量', '透湿'];
  if (category.includes('衬衫')) return ['轻量', '透湿'];
  if (category.includes('针织衫') || category.includes('毛衣')) return ['保暖', '轻量'];
  if (category.includes('夹克')) return ['防风', '保暖'];
  if (category.includes('西装')) return ['防风', '保暖'];
  if (category.includes('大衣')) return ['防风', '保暖'];
  if (category.includes('风衣')) return ['防风', '保暖'];
  if (category.includes('棉服')) return ['保暖', '防风', '轻量'];
  if (category.includes('羽绒')) return ['保暖', '防风', '轻量'];
  if (category.includes('睡衣') || category.includes('家居')) return ['轻量', '透湿'];
  if (category.includes('泳衣')) return ['轻量', '透湿'];
  if (category.includes('保暖内衣') || category.includes('秋衣秋裤') || category.includes('打底衫')) return ['保暖', '轻量'];
  if (category.includes('滑雪服') || category.includes('滑雪衣')) return ['保暖', '防风', '防水'];
  if (category.includes('骑行服') || category.includes('骑行衣')) return ['防风', '透湿', '弹力'];
  if (category.includes('童装')) return ['轻量', '透湿', '弹力'];
  if (category.includes('运动内衣')) return ['弹力', '透湿', '轻量'];
  if (category.includes('工装裤')) return ['防风', '弹力', '透湿'];
  if (category.includes('POLO衫')) return ['轻量', '透湿', '弹力'];
  if (category.includes('背心')) return ['轻量', '透湿'];
  if (category.includes('马甲')) return ['保暖', '轻量', '防风'];
  if (category.includes('袜子')) return ['保暖', '透湿', '弹力'];
  if (category.includes('帽子')) return ['防晒', '轻量', '保暖'];
  if (category.includes('手套')) return ['保暖', '防风', '弹力'];
  if (category.includes('围巾')) return ['保暖', '轻量', '防风'];
  return ['防风', '防泼水'];
}

function getDefaultPositioning(scenes: Scene[], category: string): string {
  if (category === '滑雪服') return '专业户外';
  if (category === '骑行服') return '运动户外';
  if (['冲锋衣', '软壳外套', '防晒衣', '登山服'].includes(category)) {
    if (scenes.includes('通勤') && scenes.includes('露营')) return '城市轻户外';
    if (scenes.includes('通勤')) return '城市通勤户外';
    if (scenes.includes('骑行')) return '运动户外';
    if (scenes.includes('徒步')) return '专业户外';
    return '轻户外';
  }
  if (category === '羽绒服' || category === '棉服' || category === '风衣' || category === '大衣' || category === '夹克' || category === '西装') {
    return '城市通勤';
  }
  if (category === '连衣裙' || category === '牛仔裤' || category === '休闲裤' || category === '瑜伽裤' || category === '衬衫' || category === '保暖内衣') {
    return '日常通勤';
  }
  if (category === 'T恤' || category === '卫衣' || category === '针织衫' || category === '短裤' || category === '泳衣') {
    return '日常休闲';
  }
  if (category === '睡衣') {
    return '家居休闲';
  }
  if (category === '童装') return '儿童休闲';
  if (category === '运动内衣') return '运动专业';
  if (category === '工装裤') return '城市工装';
  if (category === 'POLO衫') return '商务休闲';
  if (category === '背心') return '日常休闲';
  if (category === '马甲') return '城市通勤';
  if (category === '袜子') return '日常通勤';
  if (category === '帽子') return '日常休闲';
  if (category === '手套') return '城市通勤';
  if (category === '围巾') return '城市通勤';
  if (scenes.includes('通勤')) return '城市通勤';
  return '日常休闲';
}
