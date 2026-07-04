# Phase 1: UI/UX 全面升级实施计划

> **For agentic workers:** 按任务逐个执行，每完成一个任务提交一次。

**Goal:** 将现有深色科技风界面升级为玻璃拟态 + 可视化流程 + 统一设计系统，提升专业感与操作引导。

**Architecture:** 新增一套通用 UI 组件（GlassCard、StepWizard、AnimatedButton 等），逐步替换现有组件外层容器和交互反馈，不改动业务逻辑与数据流。

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS, TypeScript, Vitest

---

## 文件结构

### 新增文件

- `src/components/ui/GlassCard.tsx` — 玻璃拟态卡片容器
- `src/components/ui/StepWizard.tsx` — 步骤向导
- `src/components/ui/SkeletonLoader.tsx` — 骨架屏
- `src/components/ui/AnimatedButton.tsx` — 带加载/成功状态的按钮
- `src/components/ui/EmptyState.tsx` — 空状态提示
- `src/hooks/useToast.tsx` — 全局 Toast 状态管理与组件

### 修改文件

- `src/app/globals.css` — 新增设计 token 与动画
- `src/app/layout.tsx` — 全局导航与字体
- `src/app/page.tsx` — 首页 Hero + 入口改造
- `src/app/generator/page.tsx` — 生成器页三栏布局
- `src/components/RequirementForm.tsx` — 玻璃卡片包裹与步骤提示
- `src/components/ResultPanel.tsx` — 结果分区展示优化
- `src/components/HistoryPanel.tsx` — 卡片式历史列表
- `src/components/SettingsModal.tsx` — 视觉统一

---

## Task 1: 建立全局设计系统（CSS Token）

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: 在文件末尾追加设计 token 与工具类**

```css
@layer base {
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-card: rgba(30, 41, 59, 0.6);
    --border-glass: rgba(255, 255, 255, 0.08);
    --accent-from: #6366f1;
    --accent-to: #06b6d4;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --radius-card: 16px;
    --radius-button: 12px;
  }
}

@layer utilities {
  .glass {
    background: var(--bg-card);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--border-glass);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }

  .gradient-text {
    background: linear-gradient(135deg, var(--accent-from), var(--accent-to));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .gradient-border {
    position: relative;
  }

  .gradient-border::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, var(--accent-from), var(--accent-to));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .glow {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/globals.css
git commit -m "style: add glassmorphism design tokens and utilities"
```

---

## Task 2: 创建 GlassCard 通用组件

**Files:**
- Create: `src/components/ui/GlassCard.tsx`
- Test: `src/components/ui/GlassCard.test.tsx`

- [ ] **Step 1: 写测试**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlassCard from './GlassCard';

describe('GlassCard', () => {
  it('renders children', () => {
    render(<GlassCard>Hello</GlassCard>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<GlassCard className="custom-class">Content</GlassCard>);
    expect(screen.getByText('Content')).toHaveClass('custom-class');
  });

  it('supports hover lift effect by default', () => {
    render(<GlassCard>Card</GlassCard>);
    expect(screen.getByText('Card')).toHaveClass('hover:-translate-y-0.5');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/components/ui/GlassCard.test.tsx
```

Expected: FAIL（GlassCard 未定义）

- [ ] **Step 3: 实现组件**

```tsx
import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function GlassCard({
  children,
  className,
  hover = true,
  glow = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass rounded-2xl p-6 transition-all duration-300',
        hover && 'hover:-translate-y-0.5 hover:shadow-lg hover:border-white/20',
        glow && 'glow',
        className
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run src/components/ui/GlassCard.test.tsx
```

Expected: PASS

- [ ] **Step 5: 安装依赖并提交**

```bash
npm install clsx tailwind-merge
git add package.json package-lock.json src/components/ui/GlassCard.tsx src/components/ui/GlassCard.test.tsx
git commit -m "feat(ui): add GlassCard component with tests"
```

---

## Task 3: 创建 StepWizard 步骤向导

**Files:**
- Create: `src/components/ui/StepWizard.tsx`
- Test: `src/components/ui/StepWizard.test.tsx`

- [ ] **Step 1: 写测试**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StepWizard from './StepWizard';

const steps = ['输入需求', '生成方案', '查看结果', '导出分享'];

describe('StepWizard', () => {
  it('renders all steps', () => {
    render(<StepWizard steps={steps} currentStep={0} />);
    steps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it('highlights current step', () => {
    render(<StepWizard steps={steps} currentStep={1} />);
    const active = screen.getByText('生成方案').closest('li');
    expect(active).toHaveClass('text-cyan-400');
  });

  it('marks completed steps', () => {
    render(<StepWizard steps={steps} currentStep={2} />);
    const completed = screen.getByText('输入需求').closest('li');
    expect(completed).toHaveClass('text-emerald-400');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/components/ui/StepWizard.test.tsx
```

Expected: FAIL

- [ ] **Step 3: 实现组件**

```tsx
interface StepWizardProps {
  steps: string[];
  currentStep: number;
}

export default function StepWizard({ steps, currentStep }: StepWizardProps) {
  return (
    <div className="w-full py-6">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;

          return (
            <li
              key={step}
              className={`flex flex-col items-center flex-1 relative ${
                isCompleted
                  ? 'text-emerald-400'
                  : isActive
                  ? 'text-cyan-400'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 mb-2 transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-emerald-400'
                    : isActive
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-800 border-slate-600'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className="text-xs md:text-sm font-medium text-center">
                {step}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 -z-10 ${
                    isCompleted ? 'bg-emerald-400/50' : 'bg-slate-700'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run src/components/ui/StepWizard.test.tsx
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/components/ui/StepWizard.tsx src/components/ui/StepWizard.test.tsx
git commit -m "feat(ui): add StepWizard component with tests"
```

---

## Task 4: 创建 AnimatedButton 组件

**Files:**
- Create: `src/components/ui/AnimatedButton.tsx`
- Test: `src/components/ui/AnimatedButton.test.tsx`

- [ ] **Step 1: 写测试**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimatedButton from './AnimatedButton';

describe('AnimatedButton', () => {
  it('renders children', () => {
    render(<AnimatedButton>Click</AnimatedButton>);
    expect(screen.getByRole('button', { name: 'Click' })).toBeInTheDocument();
  });

  it('shows loading text when loading', () => {
    render(<AnimatedButton loading loadingText="Saving...">Save</AnimatedButton>);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows success state', () => {
    render(<AnimatedButton success>Save</AnimatedButton>);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/components/ui/AnimatedButton.test.tsx
```

Expected: FAIL

- [ ] **Step 3: 实现组件**

```tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  success?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function AnimatedButton({
  children,
  loading = false,
  loadingText,
  success = false,
  variant = 'primary',
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const baseStyles =
    'relative inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-400 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
    secondary:
      'bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700 hover:border-slate-500',
    ghost:
      'bg-transparent text-slate-300 hover:bg-white/5 hover:text-white',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {success ? '✓' : loading && loadingText ? loadingText : children}
    </button>
  );
}
```

注意：这里引入了 `cn` 工具函数。需要先创建 `src/lib/utils.ts`。

- [ ] **Step 4: 创建 utils.ts**

```tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npx vitest run src/components/ui/AnimatedButton.test.tsx
```

Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add src/lib/utils.ts src/components/ui/AnimatedButton.tsx src/components/ui/AnimatedButton.test.tsx
git commit -m "feat(ui): add AnimatedButton and cn utility"
```

---

## Task 5: 创建 SkeletonLoader 与 EmptyState

**Files:**
- Create: `src/components/ui/SkeletonLoader.tsx`
- Create: `src/components/ui/EmptyState.tsx`

- [ ] **Step 1: 实现 SkeletonLoader**

```tsx
interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

export default function SkeletonLoader({
  lines = 3,
  className,
}: SkeletonLoaderProps) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-700/50 rounded animate-pulse mb-3 last:mb-0"
          style={{ width: `${100 - (i % 3) * 15}%` }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 实现 EmptyState**

```tsx
interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = '暂无数据',
  description = '开始你的第一个操作吧',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mb-4 text-2xl">
        {icon || '📝'}
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/components/ui/SkeletonLoader.tsx src/components/ui/EmptyState.tsx
git commit -m "feat(ui): add SkeletonLoader and EmptyState components"
```

---

## Task 6: 创建全局 Toast Hook

**Files:**
- Create: `src/hooks/useToast.tsx`

- [ ] **Step 1: 实现 Hook 与 Provider**

```tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg glass text-sm font-medium animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'border-emerald-500/30 text-emerald-300'
                : toast.type === 'error'
                ? 'border-red-500/30 text-red-300'
                : 'border-blue-500/30 text-blue-300'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/hooks/useToast.tsx
git commit -m "feat(hooks): add global toast hook and provider"
```

---

## Task 7: 改造首页 page.tsx

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 用 GlassCard 包裹 Hero 区域，增加 StepWizard 入口**

保留原有跳转逻辑，主要改造视觉：

```tsx
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import StepWizard from '@/components/ui/StepWizard';
import AnimatedButton from '@/components/ui/AnimatedButton';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <GlassCard className="text-center mb-8 glow">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            AI 户外服饰智能设计
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            输入你的产品需求，AI 自动生成款式设计、面料推荐、成本分析、营销文案与风险提示。
          </p>
          <Link href="/generator">
            <AnimatedButton size="lg">开始设计</AnimatedButton>
          </Link>
        </GlassCard>

        <StepWizard
          steps={['输入需求', '生成方案', '查看结果', '导出分享']}
          currentStep={0}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <GlassCard>
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold mb-2">智能款式设计</h3>
            <p className="text-sm text-slate-400">
              基于品类与定位自动生成专业设计方案
            </p>
          </GlassCard>
          <GlassCard>
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">成本与面料分析</h3>
            <p className="text-sm text-slate-400">
              自动拆解 BOM、推荐面料、预估成本
            </p>
          </GlassCard>
          <GlassCard>
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold mb-2">营销与风控</h3>
            <p className="text-sm text-slate-400">
              生成营销文案并提示设计与供应链风险
            </p>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
```

注意：AnimatedButton 目前不支持 size prop，需要修改。或者直接在 page.tsx 里用 className 控制大小。

- [ ] **Step 2: 提交**

```bash
git add src/app/page.tsx
git commit -m "feat(home): redesign homepage with glass cards and step wizard"
```

---

## Task 8: 改造生成器页 generator/page.tsx

**Files:**
- Modify: `src/app/generator/page.tsx`

- [ ] **Step 1: 调整布局为三栏或上下分区，使用 GlassCard 包裹各区域**

原文件结构需要保留状态管理，仅调整布局容器。大致改为：

```tsx
<GlassCard className="mb-6">
  <StepWizard steps={...} currentStep={...} />
</GlassCard>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div className="lg:col-span-4">
    <GlassCard>
      <RequirementForm ... />
    </GlassCard>
  </div>
  <div className="lg:col-span-8">
    <GlassCard>
      <ResultPanel ... />
    </GlassCard>
  </div>
</div>
```

具体代码需根据当前 page.tsx 的实际状态和子组件 props 进行调整。

- [ ] **Step 2: 提交**

```bash
git add src/app/generator/page.tsx
git commit -m "feat(generator): restructure generator layout with glass cards"
```

---

## Task 9: 改造 RequirementForm

**Files:**
- Modify: `src/components/RequirementForm.tsx`

- [ ] **Step 1: 统一输入框样式为玻璃卡片风格**

将表单容器替换为 GlassCard（如尚未包裹），输入框增加深色背景 + 细边框 + focus 光晕：

```tsx
<input
  className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
/>
```

- [ ] **Step 2: 使用 AnimatedButton 替换生成按钮**

- [ ] **Step 3: 提交**

```bash
git add src/components/RequirementForm.tsx
git commit -m "refactor(form): unify RequirementForm with glass card style"
```

---

## Task 10: 改造 ResultPanel 与 HistoryPanel

**Files:**
- Modify: `src/components/ResultPanel.tsx`
- Modify: `src/components/HistoryPanel.tsx`

- [ ] **Step 1: ResultPanel 内部模块使用 GlassCard 分隔**

将各个结果子区域（款式设计、面料、成本、营销、风险）用 GlassCard 包裹，形成清晰的信息分区。

- [ ] **Step 2: HistoryPanel 改为卡片式列表**

历史项从纯文本列表改为卡片，hover 显示操作按钮（查看、对比、删除）。

- [ ] **Step 3: 提交**

```bash
git add src/components/ResultPanel.tsx src/components/HistoryPanel.tsx
git commit -m "refactor(ui): card-based ResultPanel and HistoryPanel"
```

---

## Task 11: 改造 SettingsModal

**Files:**
- Modify: `src/components/SettingsModal.tsx`

- [ ] **Step 1: 统一弹窗和输入框为玻璃拟态风格**

将 modal 容器改为 GlassCard，输入框统一样式，按钮替换为 AnimatedButton。

- [ ] **Step 2: 提交**

```bash
git add src/components/SettingsModal.tsx
git commit -m "refactor(settings): glassmorphism styling for SettingsModal"
```

---

## Task 12: 全局布局与字体

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 添加 ToastProvider 和最外层背景**

```tsx
import { ToastProvider } from '@/hooks/useToast';

<body className="bg-slate-950 text-slate-100 antialiased">
  <ToastProvider>
    {children}
  </ToastProvider>
</body>
```

- [ ] **Step 2: 提交**

```bash
git add src/app/layout.tsx
git commit -m "feat(layout): add ToastProvider and global dark background"
```

---

## Task 13: 运行全部测试与构建验证

- [ ] **Step 1: 运行单元测试**

```bash
npm test
```

Expected: ALL PASS

- [ ] **Step 2: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```

Expected: NO ERRORS

- [ ] **Step 3: 运行构建**

```bash
npm run build
```

Expected: BUILD SUCCESS

- [ ] **Step 4: 提交任何修复**

如果有修复，单独提交。

---

## Task 14: Push 到 GitHub 并验证线上部署

- [ ] **Step 1: Push**

```bash
git push origin main
```

- [ ] **Step 2: 等待 Vercel 自动部署完成**

- [ ] **Step 3: 访问线上地址验证**

https://ai-outdoor-apparel-agent.vercel.app

检查：
- 首页有 Hero + StepWizard + 三个特性卡片
- 生成器页布局清晰，表单和结果分区明确
- 按钮有 hover/loading 效果
- 历史记录为卡片式

---

## 自检清单

- [ ] 所有新增组件都有单元测试并通过
- [ ] `npx tsc --noEmit` 无错误
- [ ] `npm run build` 成功
- [ ] 线上部署后视觉风格一致，无布局错乱
- [ ] 原有生成/导出/分享功能仍可正常使用
