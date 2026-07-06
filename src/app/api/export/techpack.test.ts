import { describe, it, expect } from 'vitest';
import { POST } from './route';
import { buildTechPack } from '@/lib/techpackBuilder';
import type { GenerationResult } from '@/types';
import type { NextRequest } from 'next/server';

function createMockRequest(body: unknown, format = 'techpack'): NextRequest {
  const url = new URL(`http://localhost/api/export?format=${format}`);
  return {
    json: async () => body,
    nextUrl: url,
    url: url.toString(),
  } as unknown as NextRequest;
}

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
    const request = createMockRequest(mockResult, 'techpack');
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('spreadsheetml.sheet');
  });

  it('缺少 techPack 返回 400', async () => {
    const badResult = { ...mockResult, techPack: undefined };
    const request = createMockRequest(badResult, 'techpack');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
