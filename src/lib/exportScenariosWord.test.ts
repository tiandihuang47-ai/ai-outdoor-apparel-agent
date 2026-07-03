import { describe, it, expect } from 'vitest';
import { exportScenariosWord, exportBatchWord } from './exportScenariosWord';
import { mockGenerationResult } from './__fixtures__/generationResult';

describe('exportScenariosWord', () => {
  it('生成对比方案 Word HTML', () => {
    const scenarios = [
      {
        tier: 'basic' as const,
        tierName: '基础版',
        targetPrice: 599,
        result: mockGenerationResult(),
      },
      {
        tier: 'premium' as const,
        tierName: '高端版',
        targetPrice: 1299,
        result: mockGenerationResult(),
      },
    ];

    const html = exportScenariosWord(scenarios);

    expect(html).toContain('<html');
    expect(html).toContain('冲锋衣 三套方案对比');
    expect(html).toContain('基础版');
    expect(html).toContain('高端版');
    expect(html).toContain('<table');
    expect(html).toContain('预计单件成本');
  });

  it('包含 BOM 成本明细和风险提醒', () => {
    const scenarios = [
      {
        tier: 'basic' as const,
        tierName: '基础版',
        targetPrice: 599,
        result: mockGenerationResult(),
      },
    ];

    const html = exportScenariosWord(scenarios);

    expect(html).toContain('BOM 成本明细');
    expect(html).toContain('风险提醒');
    expect(html).toContain('建议复核面料成本');
  });
});

describe('exportBatchWord', () => {
  it('生成批量导出 Word HTML', () => {
    const results = [
      mockGenerationResult({
        marketingCopy: { ...mockGenerationResult().marketingCopy, title: '方案A' },
      }),
      mockGenerationResult({
        marketingCopy: { ...mockGenerationResult().marketingCopy, title: '方案B' },
      }),
    ];

    const html = exportBatchWord(results);

    expect(html).toContain('<html');
    expect(html).toContain('批量导出研发方案');
    expect(html).toContain('方案 1：方案A');
    expect(html).toContain('方案 2：方案B');
    expect(html).toContain('需求解析');
    expect(html).toContain('BOM 成本明细');
  });

  it('空数组生成基础结构', () => {
    const html = exportBatchWord([]);

    expect(html).toContain('<html');
    expect(html).toContain('批量导出研发方案');
    expect(html).toContain('共 0 个方案');
  });
});
