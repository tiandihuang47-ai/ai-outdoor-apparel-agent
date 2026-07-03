import { describe, it, expect } from 'vitest';
import { exportMarkdown } from './exportMarkdown';
import { mockGenerationResult } from './__fixtures__/generationResult';

describe('exportMarkdown', () => {
  it('生成标题和项目信息', () => {
    const result = mockGenerationResult();
    const md = exportMarkdown(result);

    expect(md).toContain('# 🏔️ 冲锋衣研发方案');
    expect(md).toContain('专业级三合一冲锋衣');
    expect(md).toContain('**产品品类**：冲锋衣');
    expect(md).toContain('**目标人群**：中性，25-35岁');
  });

  it('包含面料推荐表格', () => {
    const result = mockGenerationResult();
    const md = exportMarkdown(result);

    expect(md).toContain('## 🧵 面料推荐');
    expect(md).toContain('高性能尼龙三层复合面料');
    expect(md).toContain('成分 | 尼龙');
    expect(md).toContain('米价 | 68元/米');
  });

  it('包含款式设计表格', () => {
    const result = mockGenerationResult();
    const md = exportMarkdown(result);

    expect(md).toContain('## 👕 款式设计');
    expect(md).toContain('经典硬壳冲锋衣');
    expect(md).toContain('全压胶工艺');
  });

  it('包含 BOM 成本核算', () => {
    const result = mockGenerationResult();
    const md = exportMarkdown(result);

    expect(md).toContain('## 💰 BOM成本核算');
    expect(md).toContain('| 面料 | 1.8米 | 68元 | 122.4元 | 主面料 |');
    expect(md).toContain('| **预计单件成本** | | | **210元** | |');
  });

  it('包含营销文案', () => {
    const result = mockGenerationResult();
    const md = exportMarkdown(result);

    expect(md).toContain('## 📢 营销文案');
    expect(md).toContain('1. 防水透气');
    expect(md).toContain('这款冲锋衣防水透气，户外必备');
  });

  it('包含风险提醒', () => {
    const result = mockGenerationResult();
    const md = exportMarkdown(result);

    expect(md).toContain('## ⚠️ 风险提醒');
    expect(md).toContain('[中] 建议复核面料成本');
  });

  it('空约束不显示需求约束警告块', () => {
    const result = mockGenerationResult({
      parsedRequirement: { ...mockGenerationResult().parsedRequirement, constraints: [] },
      costResult: { ...mockGenerationResult().costResult, costWarnings: [] },
      riskWarnings: [],
    });
    const md = exportMarkdown(result);

    expect(md).not.toContain('> ⚠️');
  });
});
