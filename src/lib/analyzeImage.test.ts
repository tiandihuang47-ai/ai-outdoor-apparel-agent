import { describe, it, expect, vi } from 'vitest';
import { analyzeImage } from './analyzeImage';

vi.mock('./aiClient', () => ({
  isMockMode: () => true,
  visionCompletion: vi.fn(),
}));

describe('analyzeImage', () => {
  it('mock 模式返回完整分析结果', async () => {
    const result = await analyzeImage(Buffer.from('fake'));
    expect(result.parsedRequirement.category).toBe('冲锋衣');
    expect(result.description).toContain('冲锋衣');
    expect(result.parsedRequirement.constraints.length).toBeGreaterThan(0);
  });
});
