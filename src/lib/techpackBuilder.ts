import type { TechPack, TechPackSizeRow, TechPackBomItem, TechPackConstructionNote, TechPackColorway, TechPackPackaging } from '@/types/techpack';

export function buildTechPack(input: Partial<TechPack>): TechPack {
  return {
    productName: input.productName || '未命名产品',
    category: input.category || '服装',
    gender: input.gender || '中性',
    season: input.season || '春秋',
    scenes: input.scenes || [],
    targetPrice: input.targetPrice || 0,
    stylePositioning: input.stylePositioning || '',
    sizeChart: normalizeSizeChart(input.sizeChart),
    bom: normalizeBom(input.bom),
    construction: normalizeConstruction(input.construction),
    colorways: normalizeColorways(input.colorways),
    packaging: normalizePackaging(input.packaging),
    risks: Array.isArray(input.risks) ? input.risks : [],
  };
}

function normalizeSizeChart(rows?: Partial<TechPackSizeRow>[]): TechPackSizeRow[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [{ size: '均码', measurements: {} }];
  }
  return rows.map((row) => ({
    size: row.size || '',
    measurements: row.measurements || {},
  }));
}

function normalizeBom(items?: Partial<TechPackBomItem>[]): TechPackBomItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((item) => ({
    id: item.id || '',
    name: item.name || '',
    category: (item.category as TechPackBomItem['category']) || '辅料',
    spec: item.spec || '',
    supplier: item.supplier || '',
    unit: item.unit || '',
    unitPrice: item.unitPrice || 0,
    consumptionPerPiece: item.consumptionPerPiece || 0,
    moq: item.moq || 0,
    leadDays: item.leadDays || 0,
    position: item.position || '',
    notes: item.notes || '',
  }));
}

function normalizeConstruction(notes?: Partial<TechPackConstructionNote>[]): TechPackConstructionNote[] {
  if (!Array.isArray(notes) || notes.length === 0) return [];
  const validPriorities: TechPackConstructionNote['priority'][] = ['required', 'recommended', 'optional'];
  return notes.map((note) => ({
    title: note.title || '',
    description: note.description || '',
    priority: validPriorities.includes(note.priority as TechPackConstructionNote['priority'])
      ? (note.priority as TechPackConstructionNote['priority'])
      : 'recommended',
  }));
}

function normalizeColorways(colorways?: Partial<TechPackColorway>[]): TechPackColorway[] {
  if (!Array.isArray(colorways) || colorways.length === 0) {
    return [{ name: '默认色', hex: '#94a3b8', usage: '大身', fabricPart: '面料' }];
  }
  return colorways.map((c) => ({
    name: c.name || '',
    hex: c.hex || '#94a3b8',
    usage: c.usage || '',
    fabricPart: c.fabricPart || '',
  }));
}

function normalizePackaging(packaging?: Partial<TechPackPackaging>): TechPackPackaging {
  return {
    hangtag: packaging?.hangtag || '',
    washingLabel: packaging?.washingLabel || '',
    polybag: packaging?.polybag || '',
    carton: packaging?.carton || '',
    specialNotes: packaging?.specialNotes || '',
  };
}
