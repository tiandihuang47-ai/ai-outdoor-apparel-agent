# Tech Pack + BOM Excel 导出设计文档

## 1. 目标

在现有 AI 户外服饰智能设计工具基础上，为每个生成的方案输出一份**结构化、可导出的技术工艺单（Tech Pack）**，并支持导出为 Excel。让工具从"创意生成"升级为可交付给供应商/工厂的"研发辅助工具"。

## 2. 范围

### 2.1 本次做

1. **Tech Pack 数据模型**：定义标准 Tech Pack 结构，扩展 `GenerationResult`
2. **AI 生成增强**：修改 `/api/generate` 的 prompt，让 LLM 同时输出 Tech Pack 所需字段
3. **Tech Pack 展示面板**：新增 `TechPackPanel` 组件，专业排版展示工艺单
4. **尺码表组件**：新增 `SizeChart` 组件
5. **物料清单组件**：新增 `BomTable` 组件
6. **Excel 导出**：新增 `/api/export/techpack` 接口，导出 `.xlsx`
7. **历史记录集成**：历史记录中的单方案支持打开对应 Tech Pack

### 2.2 本次不做

- 多角度效果图生成（放到第二轮）
- PDF 版 Tech Pack 导出
- 在线协作编辑 Tech Pack
- 自定义 Tech Pack 模板
- 供应商数据库管理

## 3. Tech Pack 数据结构

```typescript
interface TechPack {
  productName: string;
  category: string;
  gender: string;
  season: string;
  scenes: string[];
  targetPrice: number;
  stylePositioning: string;

  sizeChart: SizeRow[];
  bom: BomItem[];
  construction: ConstructionNote[];
  colorways: Colorway[];
  packaging: PackagingRequirement;
  risks: string[];
}

interface SizeRow {
  size: string;
  measurements: Record<string, number>; // e.g. { 胸围: 108, 衣长: 72, ... }
}

interface BomItem {
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

interface ConstructionNote {
  title: string;
  description: string;
  priority: 'required' | 'recommended' | 'optional';
}

interface Colorway {
  name: string;
  hex: string;
  usage: string;
  fabricPart: string;
}

interface PackagingRequirement {
  hangtag: string;
  washingLabel: string;
  polybag: string;
  carton: string;
  specialNotes: string;
}
```

## 4. 前端设计

### 4.1 新增组件

- `TechPackPanel`：Tech Pack 总容器，按模块分区展示
- `SizeChart`：尺码表，支持横向滚动
- `BomTable`：物料清单表格，按类别分组
- `ConstructionList`：工艺要求列表
- `ColorwaySwatches`：配色方案色块展示
- `PackagingNotes`：包装要求展示

### 4.2 页面改动

- `ResultPanel.tsx`：在操作区增加 **「查看 Tech Pack」** 按钮
- `generator/page.tsx`：增加 `showTechPack` 状态，点击按钮后在结果区切换显示 Tech Pack
- `HistoryPanel.tsx`：历史记录的单方案右键/更多操作增加 **「打开 Tech Pack」**
- `ExportButton.tsx` / 批量导出：增加 **「导出 Tech Pack Excel」** 选项

### 4.3 视觉规范

- 延续现有深色科技风 + 玻璃拟态卡片
- Tech Pack 面板使用白色背景的打印预览样式（便于导出/打印）
- 表格使用清晰的边框和斑马纹

## 5. 后端设计

### 5.1 数据转换

- 新增 `src/lib/techpackBuilder.ts`
  - 输入：`GenerationResult`
  - 输出：`TechPack`
  - 职责：把 AI 生成的原始字段整理成标准 Tech Pack，补全默认值

### 5.2 AI Prompt 修改

在 `/api/generate` 的 system prompt 中增加 Tech Pack 输出要求：

```
请同时输出一份技术工艺单（Tech Pack），包含：
1. 尺码表：至少 S/M/L/XL 四码，列出胸围、衣长、袖长、肩宽等关键尺寸（cm）
2. 物料清单（BOM）：面料、辅料、配件的名称、规格、用量、参考单价、供应商类型
3. 工艺要求：缝制、压胶、口袋、拉链、通风口等关键工艺
4. 配色方案：主色、辅色、撞色的名称和建议色值
5. 包装要求：吊牌、洗水标、包装袋、外箱
6. 风险提示：生产难点或品质注意点
```

### 5.3 API 设计

- `POST /api/export/techpack`
  - Body: `{ result: GenerationResult }`
  - Response: `Blob`（`.xlsx` 文件）
  - 错误时返回 JSON `{ error: string }`

### 5.4 Excel 生成

- 新增 `src/lib/excelExport.ts`
- 使用 `xlsx` 库生成多 sheet Excel：
  - Sheet 1：产品信息
  - Sheet 2：尺码表
  - Sheet 3：物料清单
  - Sheet 4：工艺要求
  - Sheet 5：配色方案
  - Sheet 6：包装要求

## 6. 数据流

```
用户输入需求
  ↓
/api/generate（LLM 返回方案 + Tech Pack 原始数据）
  ↓
techpackBuilder.ts 整理为标准 Tech Pack
  ↓
GenerationResult.techPack 字段保存到历史记录
  ↓
结果页显示「查看 Tech Pack」按钮
  ↓
用户点击 → TechPackPanel 展示
  ↓
用户导出 → /api/export/techpack → 下载 .xlsx
```

## 7. 测试计划

- `techpackBuilder.test.ts`：验证能从 `GenerationResult` 构建出完整 `TechPack`
- `excelExport.test.ts`：验证 Excel 生成函数输出非空 Buffer
- `/api/export/techpack` 路由测试：验证正确返回 xlsx 及错误处理
- `TechPackPanel.test.tsx`：基础渲染测试
- 每次提交前运行 `npm test`（已有 pre-commit hook）

## 8. 风险与回退

- **AI 输出不稳定**：Tech Pack 字段可能缺失，通过 `techpackBuilder.ts` 补全默认值
- **Excel 库体积大**：仅在服务端使用 `xlsx`，不影响前端包体积
- **现有 prompt 过长**：将 Tech Pack 要求作为独立 prompt 片段，便于维护

## 9. 验收标准

- [ ] 生成方案时 `GenerationResult` 包含完整 `techPack` 字段
- [ ] 结果页有「查看 Tech Pack」按钮，点击后正确展示
- [ ] 尺码表、物料清单、工艺要求、配色方案、包装要求 5 个模块都能显示
- [ ] Excel 导出文件可用 Excel/WPS 正常打开
- [ ] 历史记录中的单方案支持打开 Tech Pack
- [ ] 新增测试全部通过
- [ ] 部署后线上功能正常
