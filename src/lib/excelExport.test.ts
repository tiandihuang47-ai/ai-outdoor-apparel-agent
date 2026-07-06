import { describe, it, expect } from 'vitest';
import { exportTechPackToExcel } from './excelExport';
import { buildTechPack } from './techpackBuilder';

describe('exportTechPackToExcel', () => {
  it('生成非空 Buffer', () => {
    const pack = buildTechPack({
      productName: '测试产品',
      category: '冲锋衣',
      sizeChart: [{ size: 'M', measurements: { 胸围: 110 } }],
      bom: [{
        id: '1',
        name: '面料',
        category: '面料',
        spec: '涤纶',
        supplier: 'A',
        unit: '米',
        unitPrice: 30,
        consumptionPerPiece: 2,
        moq: 100,
        leadDays: 7,
        position: '大身',
        notes: '',
      }],
    });
    const buffer = exportTechPackToExcel(pack);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
  });
});
