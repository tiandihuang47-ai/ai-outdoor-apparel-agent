import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/analyzeImage', () => ({
  analyzeImage: vi.fn(() => Promise.resolve({
    parsedRequirement: { category: '冲锋衣' },
    description: '测试',
  })),
}));

function createFormRequest(file: File): Request {
  const formData = new FormData();
  formData.append('image', file);
  return new Request('http://localhost/api/analyze-image', {
    method: 'POST',
    body: formData,
  });
}

describe('/api/analyze-image', () => {
  it('上传图片返回分析结果', async () => {
    const file = new File(['fake'], 'test.jpg', { type: 'image/jpeg' });
    const response = await POST(createFormRequest(file) as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.parsedRequirement.category).toBe('冲锋衣');
  });

  it('非图片文件返回 400', async () => {
    const file = new File(['fake'], 'test.txt', { type: 'text/plain' });
    const response = await POST(createFormRequest(file) as any);
    expect(response.status).toBe(400);
  });
});
