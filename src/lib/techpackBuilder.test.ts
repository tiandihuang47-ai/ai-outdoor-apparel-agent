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
