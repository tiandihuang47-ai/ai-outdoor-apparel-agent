import * as XLSX from 'xlsx';
import type { TechPack } from '@/types/techpack';

export function exportTechPackToExcel(techPack: TechPack): Buffer {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: 产品信息
  const infoData = [
    ['产品名称', techPack.productName],
    ['品类', techPack.category],
    ['性别', techPack.gender],
    ['季节', techPack.season],
    ['场景', techPack.scenes.join('、')],
    ['目标零售价', techPack.targetPrice],
    ['风格定位', techPack.stylePositioning],
  ];
  const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
  XLSX.utils.book_append_sheet(workbook, infoSheet, '产品信息');

  // Sheet 2: 尺码表
  if (techPack.sizeChart.length > 0) {
    const sizeHeaders = ['尺码', ...Object.keys(techPack.sizeChart[0].measurements)];
    const sizeRows = techPack.sizeChart.map((row) => [
      row.size,
      ...Object.values(row.measurements),
    ]);
    const sizeSheet = XLSX.utils.aoa_to_sheet([sizeHeaders, ...sizeRows]);
    XLSX.utils.book_append_sheet(workbook, sizeSheet, '尺码表');
  }

  // Sheet 3: 物料清单
  const bomHeaders = ['序号', '类别', '名称', '规格', '供应商', '单位', '单价', '单件用量', 'MOQ', '交期(天)', '使用部位', '备注'];
  const bomRows = techPack.bom.map((item, index) => [
    index + 1,
    item.category,
    item.name,
    item.spec,
    item.supplier,
    item.unit,
    item.unitPrice,
    item.consumptionPerPiece,
    item.moq,
    item.leadDays,
    item.position,
    item.notes,
  ]);
  const bomSheet = XLSX.utils.aoa_to_sheet([bomHeaders, ...bomRows]);
  XLSX.utils.book_append_sheet(workbook, bomSheet, '物料清单');

  // Sheet 4: 工艺要求
  const constructionHeaders = ['优先级', '项目', '要求'];
  const constructionRows = techPack.construction.map((note) => [
    priorityText(note.priority),
    note.title,
    note.description,
  ]);
  const constructionSheet = XLSX.utils.aoa_to_sheet([constructionHeaders, ...constructionRows]);
  XLSX.utils.book_append_sheet(workbook, constructionSheet, '工艺要求');

  // Sheet 5: 配色方案
  const colorwayHeaders = ['名称', '色值', '用途', '面料部位'];
  const colorwayRows = techPack.colorways.map((c) => [c.name, c.hex, c.usage, c.fabricPart]);
  const colorwaySheet = XLSX.utils.aoa_to_sheet([colorwayHeaders, ...colorwayRows]);
  XLSX.utils.book_append_sheet(workbook, colorwaySheet, '配色方案');

  // Sheet 6: 包装要求
  const packagingData = [
    ['吊牌', techPack.packaging.hangtag],
    ['洗水标', techPack.packaging.washingLabel],
    ['包装袋', techPack.packaging.polybag],
    ['外箱', techPack.packaging.carton],
    ['特殊说明', techPack.packaging.specialNotes],
  ];
  const packagingSheet = XLSX.utils.aoa_to_sheet(packagingData);
  XLSX.utils.book_append_sheet(workbook, packagingSheet, '包装要求');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function priorityText(priority: TechPack['construction'][0]['priority']): string {
  const map = { required: '必须', recommended: '建议', optional: '可选' };
  return map[priority];
}
