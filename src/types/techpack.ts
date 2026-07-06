export interface TechPackSizeRow {
  size: string;
  measurements: Record<string, number>;
}

export interface TechPackBomItem {
  id: string;
  name: string;
  category: '面料' | '辅料' | '配件';
  spec: string;
  supplier: string;
  unit: string;
  unitPrice: number;
  consumptionPerPiece: number;
  moq: number;
  leadDays: number;
  position: string;
  notes: string;
}

export interface TechPackConstructionNote {
  title: string;
  description: string;
  priority: 'required' | 'recommended' | 'optional';
}

export interface TechPackColorway {
  name: string;
  hex: string;
  usage: string;
  fabricPart: string;
}

export interface TechPackPackaging {
  hangtag: string;
  washingLabel: string;
  polybag: string;
  carton: string;
  specialNotes: string;
}

export interface TechPack {
  productName: string;
  category: string;
  gender: string;
  season: string;
  scenes: string[];
  targetPrice: number;
  stylePositioning: string;
  sizeChart: TechPackSizeRow[];
  bom: TechPackBomItem[];
  construction: TechPackConstructionNote[];
  colorways: TechPackColorway[];
  packaging: TechPackPackaging;
  risks: string[];
}
