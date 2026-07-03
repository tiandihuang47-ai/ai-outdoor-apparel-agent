import { describe, it, expect } from 'vitest';
import { exportScenariosMarkdown, exportBatchMarkdown } from './exportScenariosMarkdown';
import { mockGenerationResult } from './__fixtures__/generationResult';

describe('exportScenariosMarkdown', () => {
  it('生成对比方案标题和关键指标表格', () => {
    const scenarios = [
      {
        tier: 'basic' as const,
        tierName: '基础版',
        targetPrice: 599,
        result: mockGenerationResult({
          costResult: { ...mockGenerationResult().costResult, estimatedUnitCost: 180 },
        }),
      },
      {
        tier: 'premium' as const,
        tierName: '高端版',
        targetPrice: 1299,
        result: mockGenerationResult({
          costResult: { ...mockGenerationResult().costResult, estimatedUnitCost: 320 },
        }),
      },
    ];

    const md = exportScenariosMarkdown(scenarios);

    expect(md).toContain('# 📊 冲锋衣 多套方案对比');
    expect(md).toContain('## 关键指标对比');
    expect(md).toContain('| 方案 | 零售价 |');
    expect(md).toContain('| 基础版 | 599元 |');
    expect(md).toContain('| 高端版 | 1299元 |');
  });

  it('生成每个方案的详情', () => {
    const scenarios = [
      {
        tier: 'basic' as const,
        tierName: '基础版',
        targetPrice: 599,
        result: mockGenerationResult(),
      },
    ];

    const md = exportScenariosMarkdown(scenarios);

    expect(md).toContain('## 1. 基础版（零售价 599元）');
    expect(md).toContain('### 📋 需求解析');
    expect(md).toContain('### 💰 BOM 成本');
  });

  it('计算预计毛利', () => {
    const scenarios = [
      {
        tier: 'basic' as const,
        tierName: '基础版',
        targetPrice: 500,
        result: mockGenerationResult({
          costResult: { ...mockGenerationResult().costResult, estimatedUnitCost: 300 },
        }),
      },
    ];

    const md = exportScenariosMarkdown(scenarios);

    expect(md).toContain('200.0元（40.0%）');
  });
});

describe('exportBatchMarkdown', () => {
  it('生成批量导出标题和方案列表', () => {
    const results = [
      mockGenerationResult({
        parsedRequirement: { ...mockGenerationResult().parsedRequirement, category: '冲锋衣' },
        marketingCopy: { ...mockGenerationResult().marketingCopy, title: '方案A' },
      }),
      mockGenerationResult({
        parsedRequirement: { ...mockGenerationResult().parsedRequirement, category: '软壳外套' },
        marketingCopy: { ...mockGenerationResult().marketingCopy, title: '方案B' },
      }),
    ];

    const md = exportBatchMarkdown(results);

    expect(md).toContain('# 📦 批量导出研发方案');
    expect(md).toContain('共 2 个方案');
    expect(md).toContain('## 1. 冲锋衣 - 方案A');
    expect(md).toContain('## 2. 软壳外套 - 方案B');
  });

  it('空数组生成无方案内容', () => {
    const md = exportBatchMarkdown([]);

    expect(md).toContain('# 📦 批量导出研发方案');
    expect(md).toContain('共 0 个方案');
  });
});
