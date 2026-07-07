# 图片上传与服装分析功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户可以上传一张衣服图片，系统自动分析图片中的服装属性并生成对应研发方案。

**Architecture:** 前端提供图片选择/预览/上传组件；后端 `/api/analyze-image` 接收图片，调用 DashScope 视觉模型识别服装属性，返回结构化需求；前端把分析结果合并到现有表单中，用户确认后调用 `/api/generate` 生成方案。图片不落盘，只在请求内存中处理。

**Tech Stack:** Next.js Route Handler, React file input, FormData, DashScope/Qwen-VL, base64, TypeScript.

---

### Task 1: 更新 AI 客户端支持图片/多模态调用

**Files:**
- Modify: `src/lib/aiClient.ts`
- Test: `src/lib/aiClient.test.ts`（若不存在则创建）

- [ ] **Step 1: 在 `chatCompletion` 旁新增 `visionCompletion` 函数**

```typescript
export async function visionCompletion(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string
): Promise<string> {
  const config = getAiConfig();
  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    },
  ];

  // 保持与 chatCompletion 一致的 provider 分发逻辑
  if (config.provider === 'qwen') {
    return callQwen(config, messages);
  }

  // mock 或未配置时返回空字符串
  return '';
}
```

- [ ] **Step 2: 重构 `callQwen` 使其接受 messages 数组**

```typescript
async function callQwen(config: AiConfig, messages: unknown[]): Promise<string> {
  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'qwen-vl-max-latest',
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DashScope error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content || '';
}
```

- [ ] **Step 3: 修改 `chatCompletion` 复用 `callQwen`**

把原来的 `chatCompletion` 内部调用改为：

```typescript
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userPrompt },
];
return callQwen(config, messages);
```

- [ ] **Step 4: 运行测试**

Run: `npm test -- src/lib/aiClient.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/aiClient.ts src/lib/aiClient.test.ts
git commit -m "feat(ai): add vision completion support for image analysis"
```

---

### Task 2: 创建图片分析服务

**Files:**
- Create: `src/lib/analyzeImage.ts`
- Create: `src/lib/analyzeImage.test.ts`

- [ ] **Step 1: 实现 `analyzeImage` 函数**

```typescript
import type { ParsedRequirement, FunctionTag, Scene } from '@/types';
import { visionCompletion, isMockMode } from './aiClient';

export interface ImageAnalysisResult {
  parsedRequirement: ParsedRequirement;
  description: string;
}

export async function analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
  if (isMockMode()) {
    return mockAnalyzeImage();
  }

  const base64 = imageBuffer.toString('base64');
  const systemPrompt = `你是一位服装产品分析专家。请根据上传的服装图片，识别服装的关键属性，只返回 JSON，不要解释。
输出字段：
{
  "category": "string（品类，如冲锋衣、连衣裙、羽绒服）",
  "gender": "女款" | "男款" | "中性",
  "ageRange": "string（如 25-40岁）",
  "scenes": ["通勤" | "露营" | "徒步" | "骑行"],
  "season": "春秋" | "夏季" | "冬季",
  "targetPrice": number（预估零售价，无法判断则填 399）,
  "functionPriorities": ["防水" | "防泼水" | "防风" | "透湿" | "轻量" | "防晒" | "保暖" | "弹力"],
  "stylePositioning": "string（如 城市轻户外、显瘦通勤）",
  "styleKeywords": ["string（款式关键词，如 直筒、连帽、收腰）"],
  "description": "string（对图片的简短描述）"
}
如果图片无法判断某字段，用合理默认值，并在 constraints 中标注"图片未明确，系统默认"。`;

  const userPrompt = '请分析这张服装图片，返回 JSON。';
  const response = await visionCompletion(systemPrompt, userPrompt, base64);
  return parseAnalysisResponse(response);
}

function parseAnalysisResponse(response: string): ImageAnalysisResult {
  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return mockAnalyzeImage();

    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<ParsedRequirement> & { description?: string };
    return normalizeAnalysisResult(parsed);
  } catch (error) {
    console.warn('Image analysis parse failed:', error);
    return mockAnalyzeImage();
  }
}

function normalizeAnalysisResult(parsed: Partial<ParsedRequirement> & { description?: string }): ImageAnalysisResult {
  const validFunctions: FunctionTag[] = ['防水', '防泼水', '防风', '透湿', '轻量', '防晒', '保暖', '弹力'];
  const validScenes: Scene[] = ['通勤', '露营', '徒步', '骑行'];
  const validSeasons: ParsedRequirement['season'][] = ['春秋', '夏季', '冬季'];
  const validGenders: ParsedRequirement['gender'][] = ['女款', '男款', '中性'];

  const constraints: string[] = [];
  if (!parsed.category) {
    parsed.category = '服装';
    constraints.push('图片未明确品类，系统默认为通用服装');
  }
  if (!parsed.gender || !validGenders.includes(parsed.gender)) {
    parsed.gender = '中性';
    constraints.push('图片未明确性别，系统默认为中性');
  }
  if (!parsed.season || !validSeasons.includes(parsed.season)) {
    parsed.season = '春秋';
    constraints.push('图片未明确季节，系统默认为春秋');
  }
  if (!parsed.ageRange) {
    parsed.ageRange = '25-40岁';
    constraints.push('图片未明确年龄段，系统默认为25-40岁');
  }
  if (!parsed.targetPrice || parsed.targetPrice <= 0) {
    parsed.targetPrice = 399;
    constraints.push('图片未明确目标价格，系统默认为399元');
  }
  if (!parsed.orderQuantity || parsed.orderQuantity <= 0) {
    parsed.orderQuantity = 100;
    constraints.push('图片未明确订单量，系统默认为100件');
  }

  parsed.scenes = (parsed.scenes || ['通勤']).filter((s): s is Scene => validScenes.includes(s as Scene));
  if (parsed.scenes.length === 0) parsed.scenes = ['通勤'];

  parsed.functionPriorities = (parsed.functionPriorities || []).filter((f): f is FunctionTag =>
    validFunctions.includes(f as FunctionTag)
  );
  if (parsed.functionPriorities.length === 0) parsed.functionPriorities = ['防风'];

  if (!parsed.stylePositioning) parsed.stylePositioning = '城市轻户外';
  if (!Array.isArray(parsed.styleKeywords)) parsed.styleKeywords = [];

  return {
    parsedRequirement: {
      ...parsed,
      quickResponseRequired: parsed.orderQuantity <= 100,
      constraints,
    } as ParsedRequirement,
    description: parsed.description || '',
  };
}

function mockAnalyzeImage(): ImageAnalysisResult {
  return {
    parsedRequirement: {
      category: '冲锋衣',
      gender: '女款',
      ageRange: '25-40岁',
      scenes: ['通勤', '露营'],
      season: '春秋',
      targetPrice: 399,
      orderQuantity: 100,
      functionPriorities: ['防风', '防泼水', '透湿'],
      stylePositioning: '城市轻户外',
      styleKeywords: ['连帽', '直筒'],
      quickResponseRequired: true,
      constraints: ['当前为图片分析演示模式，未调用真实 AI'],
    },
    description: '一件女款春秋城市轻户外冲锋衣',
  };
}
```

- [ ] **Step 2: 创建测试**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { analyzeImage } from './analyzeImage';

vi.mock('./aiClient', () => ({
  isMockMode: () => true,
  visionCompletion: vi.fn(),
}));

describe('analyzeImage', () => {
  it('mock 模式返回完整分析结果', async () => {
    const result = await analyzeImage(Buffer.from('fake'));
    expect(result.parsedRequirement.category).toBe('冲锋衣');
    expect(result.description).toContain('冲锋衣');
  });
});
```

- [ ] **Step 3: 运行测试**

Run: `npm test -- src/lib/analyzeImage.test.ts`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/lib/analyzeImage.ts src/lib/analyzeImage.test.ts
git commit -m "feat(analysis): add image analysis service for apparel attributes"
```

---

### Task 3: 创建 `/api/analyze-image` 路由

**Files:**
- Create: `src/app/api/analyze-image/route.ts`
- Create: `src/app/api/analyze-image/route.test.ts`

- [ ] **Step 1: 实现路由**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/analyzeImage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: '请上传图片' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '请上传图片文件' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '图片大小不能超过 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const result = await analyzeImage(buffer);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Image analysis error:', error);
    const message = error instanceof Error ? error.message : '图片分析失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: 创建测试**

```typescript
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
```

- [ ] **Step 3: 运行测试**

Run: `npm test -- src/app/api/analyze-image/route.test.ts`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/app/api/analyze-image/route.ts src/app/api/analyze-image/route.test.ts
git commit -m "feat(api): add image analysis endpoint"
```

---

### Task 4: 创建前端图片上传组件

**Files:**
- Create: `src/components/ImageUploader.tsx`

- [ ] **Step 1: 实现组件**

```tsx
'use client';

import { useRef, useState } from 'react';

interface ImageUploaderProps {
  onAnalyzed: (data: { parsedRequirement: Record<string, unknown>; description: string }) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ImageUploader({ onAnalyzed, onError, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError('仅支持 jpg、jpeg、png、webp 格式');
      return;
    }

    if (file.size > MAX_SIZE) {
      onError('图片大小不能超过 5MB');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || '图片分析失败');
      }

      const data = await response.json();
      onAnalyzed(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : '图片分析失败';
      onError(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || analyzing}
        className="hidden"
      />

      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled || analyzing}
          className="w-full py-4 px-6 rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/50 text-slate-300 hover:border-cyan-500 hover:text-cyan-400 transition-all disabled:opacity-50"
        >
          {analyzing ? '分析中...' : '📷 上传衣服图片'}
        </button>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-slate-600">
          <img src={preview} alt="预览" className="w-full max-h-64 object-contain bg-slate-900" />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-900/80 text-xs text-white hover:bg-slate-800"
          >
            重新上传
          </button>
          {analyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
              <div className="flex items-center gap-2 text-white">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                正在分析图片...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/ImageUploader.tsx
git commit -m "feat(ui): add image uploader component"
```

---

### Task 5: 在 RequirementForm 中集成图片分析

**Files:**
- Modify: `src/components/RequirementForm.tsx`

- [ ] **Step 1: 导入 ImageUploader 和 ParsedRequirement 类型**

```typescript
import ImageUploader from './ImageUploader';
import type { RawRequirement, Gender, Season, FunctionTag, Scene, ParsedRequirement } from '@/types';
```

- [ ] **Step 2: 添加分析结果状态**

```typescript
export default function RequirementForm({ onSubmit, onCompareSubmit, isLoading }: RequirementFormProps) {
  // ... existing states
  const [analysisDescription, setAnalysisDescription] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
```

- [ ] **Step 3: 实现分析结果合并到表单的函数**

```typescript
  const applyAnalysisToForm = (parsed: ParsedRequirement) => {
    setFormData((prev) => ({
      ...prev,
      category: parsed.category || prev.category,
      gender: parsed.gender || prev.gender,
      ageRange: parsed.ageRange || prev.ageRange,
      scenes: parsed.scenes?.length ? parsed.scenes : prev.scenes,
      season: parsed.season || prev.season,
      targetPrice: parsed.targetPrice || prev.targetPrice,
      orderQuantity: parsed.orderQuantity || prev.orderQuantity,
      functions: parsed.functionPriorities?.length ? parsed.functionPriorities : prev.functions,
      stylePreference: parsed.stylePositioning || prev.stylePreference,
    }));

    const keywordText = parsed.styleKeywords?.length ? `，款式关键词：${parsed.styleKeywords.join('、')}` : '';
    const text = `根据图片分析：${parsed.category}，${parsed.gender}，${parsed.season}，适用场景${parsed.scenes?.join('、')}，风格定位${parsed.stylePositioning}${keywordText}。`;
    setText(text);
  };
```

- [ ] **Step 4: 在 natural 模式下渲染图片上传组件**

在 `mode === 'natural'` 区域，示例需求按钮下方、textarea 上方插入：

```tsx
          <ImageUploader
            onAnalyzed={(data) => {
              setAnalysisError(null);
              setAnalysisDescription(data.description);
              applyAnalysisToForm(data.parsedRequirement as ParsedRequirement);
            }}
            onError={(message) => {
              setAnalysisError(message);
              setAnalysisDescription(null);
            }}
            disabled={isLoading}
          />

          {analysisDescription && (
            <div className="text-sm text-cyan-300 bg-cyan-900/20 border border-cyan-500/30 rounded-lg px-3 py-2">
              ✨ 图片识别：{analysisDescription}
            </div>
          )}

          {analysisError && (
            <div className="text-sm text-red-300 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
              ⚠️ {analysisError}
            </div>
          )}
```

- [ ] **Step 5: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add src/components/RequirementForm.tsx
git commit -m "feat(ui): integrate image analysis into requirement form"
```

---

### Task 6: 端到端验证、构建与提交

- [ ] **Step 1: 运行全部测试**

Run: `npm test`
Expected: 全部通过

- [ ] **Step 2: 运行构建**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 3: 启动本地开发服务器**

Run: `npm run dev`
Server: http://localhost:3000/generator

- [ ] **Step 4: 手动验证**

在浏览器中打开生成器，上传一张服装图片，验证：
1. 能显示预览
2. 分析完成后表单字段被自动填充
3. 点击生成按钮可以生成方案
4. 生成的方案中包含 Tech Pack

- [ ] **Step 5: 提交并推送**

```bash
git push origin main
```

- [ ] **Step 6: 检查 Vercel 部署**

通过 Vercel Dashboard 或 `npx vercel ls` 确认最新部署成功。
