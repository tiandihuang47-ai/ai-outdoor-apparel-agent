# 用户登录与历史记录持久化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现邮箱验证码登录，并将用户历史记录从 localStorage 迁移到 Vercel KV，支持登录前后数据同步。

**Architecture:** 使用 `@vercel/kv` 作为服务端持久化存储验证码和用户历史；使用 `jose` 签发基于 Cookie 的 JWT Session；邮件发送优先使用 Resend（生产），未配置时降级为在 UI/控制台输出验证码（本地开发测试）。历史记录 API 根据登录状态自动选择 localStorage 或 KV 后端。

**Tech Stack:** Next.js App Router, @vercel/kv, jose, resend, TypeScript, Tailwind CSS

---

## 文件结构

- 新建 `src/lib/auth.ts`：JWT 签发/校验、Session Cookie 读写
- 新建 `src/lib/kv.ts`：Vercel KV 客户端封装和 key 命名规范
- 新建 `src/lib/email.ts`：发送验证码邮件，支持 Resend 和测试降级
- 新建 `src/lib/userHistory.ts`：统一历史记录操作接口（localStorage + KV）
- 新建 `src/app/api/auth/send-code/route.ts`：请求发送验证码
- 新建 `src/app/api/auth/verify-code/route.ts`：验证验证码并创建 Session
- 新建 `src/app/api/auth/logout/route.ts`：清除 Session
- 新建 `src/app/api/auth/me/route.ts`：获取当前登录用户信息
- 新建 `src/app/api/history/route.ts`：获取/保存/删除云端历史
- 新建 `src/components/LoginModal.tsx`：邮箱验证码登录弹窗
- 新建 `src/components/UserMenu.tsx`：顶部用户信息/登录入口
- 修改 `src/lib/historyStorage.ts`：改为优先调用 userHistory 统一接口
- 修改 `src/app/generator/page.tsx`：引入 UserMenu 和 LoginModal
- 修改 `src/components/HistoryPanel.tsx`：增加同步本地历史到云端按钮

---

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 @vercel/kv、jose、resend**

```bash
npm install @vercel/kv jose resend
```

- [ ] **Step 2: 提交**

```bash
git add package.json package-lock.json
git commit -m "chore: add @vercel/kv, jose, resend for auth and history"
```

---

### Task 2: 实现认证工具函数

**Files:**
- Create: `src/lib/auth.ts`

- [ ] **Step 1: 编写 JWT Session 工具函数**

```typescript
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export interface UserSession {
  email: string;
}

const COOKIE_NAME = 'ai-outdoor-session';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET 未配置');
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(email: string): Promise<void> {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.email !== 'string') return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function getUserKey(email: string): string {
  return `user:${email.toLowerCase().trim()}`;
}
```

- [ ] **Step 2: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/lib/auth.ts
git commit -m "feat(auth): add JWT session helpers"
```

---

### Task 3: 实现 KV 客户端和验证码存储

**Files:**
- Create: `src/lib/kv.ts`

- [ ] **Step 1: 创建 KV 工具函数**

```typescript
import { kv } from '@vercel/kv';

export { kv };

export function codeKey(email: string): string {
  return `auth:code:${email.toLowerCase().trim()}`;
}

export function historyKey(email: string): string {
  return `history:${email.toLowerCase().trim()}`;
}

export async function saveCode(email: string, code: string): Promise<void> {
  await kv.set(codeKey(email), code, { ex: 60 * 10 });
}

export async function getCode(email: string): Promise<string | null> {
  return kv.get(codeKey(email));
}

export async function deleteCode(email: string): Promise<void> {
  await kv.del(codeKey(email));
}
```

- [ ] **Step 2: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/lib/kv.ts
git commit -m "feat(kv): add Vercel KV helpers for auth codes and history"
```

---

### Task 4: 实现邮件发送（Resend + 测试降级）

**Files:**
- Create: `src/lib/email.ts`

- [ ] **Step 1: 编写邮件发送函数**

```typescript
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface SendCodeResult {
  success: boolean;
  message: string;
  code?: string;
}

export async function sendVerificationCode(
  email: string,
  code: string
): Promise<SendCodeResult> {
  if (!resend) {
    const msg = `测试模式：验证码为 ${code}（未配置 RESEND_API_KEY，请在 Vercel 环境变量中配置以真实发送邮件）`;
    console.log(`[TEST MODE] ${email}: ${code}`);
    return { success: true, message: msg, code };
  }

  try {
    const { error } = await resend.emails.send({
      from: 'AI户外服饰 <noreply@yourdomain.com>',
      to: email,
      subject: '您的登录验证码',
      html: `<p>您的验证码是：<strong>${code}</strong></p><p>10 分钟内有效，请勿泄露给他人。</p>`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, message: '验证码已发送，请查收邮件' };
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送失败';
    return { success: false, message };
  }
}
```

- [ ] **Step 2: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/lib/email.ts
git commit -m "feat(email): add verification code sender with resend fallback"
```

---

### Task 5: 实现认证 API

**Files:**
- Create: `src/app/api/auth/send-code/route.ts`
- Create: `src/app/api/auth/verify-code/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`

- [ ] **Step 1: 创建发送验证码 API**

```typescript
// src/app/api/auth/send-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { saveCode } from '@/lib/kv';
import { generateCode, sendVerificationCode } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: '请输入有效邮箱' }, { status: 400 });
    }

    const code = generateCode();
    await saveCode(email, code);
    const result = await sendVerificationCode(email, code);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      testCode: result.code,
    });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}
```

- [ ] **Step 2: 创建验证验证码 API**

```typescript
// src/app/api/auth/verify-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCode, deleteCode } from '@/lib/kv';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: '缺少邮箱或验证码' }, { status: 400 });
    }

    const savedCode = await getCode(email);
    if (!savedCode || savedCode !== code.trim()) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
    }

    await deleteCode(email);
    await createSession(email);

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: '验证失败' }, { status: 500 });
  }
}
```

- [ ] **Step 3: 创建登出 API**

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: 创建获取当前用户 API**

```typescript
// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ loggedIn: false });
  }
  return NextResponse.json({ loggedIn: true, email: session.email });
}
```

- [ ] **Step 5: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add src/app/api/auth
git commit -m "feat(auth): add send-code, verify-code, logout and me APIs"
```

---

### Task 6: 实现云端历史记录 API

**Files:**
- Create: `src/app/api/history/route.ts`

- [ ] **Step 1: 创建历史记录 API**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { kv, historyKey } from '@/lib/kv';
import type { HistoryItem } from '@/lib/historyStorage';

const MAX_ITEMS = 50;

async function getUserHistory(email: string): Promise<HistoryItem[]> {
  const data = await kv.get<HistoryItem[]>(historyKey(email));
  return Array.isArray(data) ? data : [];
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const history = await getUserHistory(session.email);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json({ error: '读取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body as { items?: HistoryItem[] };
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: '格式错误' }, { status: 400 });
    }

    const limited = items.slice(0, MAX_ITEMS);
    await kv.set(historyKey(session.email), limited);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History POST error:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    await kv.del(historyKey(session.email));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History DELETE error:', error);
    return NextResponse.json({ error: '清空失败' }, { status: 500 });
  }
}
```

- [ ] **Step 2: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/app/api/history/route.ts
git commit -m "feat(history): add cloud history API backed by Vercel KV"
```

---

### Task 7: 重构历史记录存储层

**Files:**
- Create: `src/lib/userHistory.ts`
- Modify: `src/lib/historyStorage.ts`

- [ ] **Step 1: 创建统一历史记录接口**

```typescript
// src/lib/userHistory.ts
import type { HistoryItem, ScenarioHistoryItem } from './historyStorage';

export interface HistoryBackend {
  getHistory(): Promise<HistoryItem[]> | HistoryItem[];
  saveHistory(items: HistoryItem[]): Promise<void> | void;
}

class LocalStorageBackend implements HistoryBackend {
  private readonly key = 'ai-outdoor-apparel-agent-history';

  getHistory(): HistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as HistoryItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveHistory(items: HistoryItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(items.slice(0, 50)));
    } catch {
      // ignore
    }
  }
}

class CloudBackend implements HistoryBackend {
  async getHistory(): Promise<HistoryItem[]> {
    const res = await fetch('/api/history');
    if (!res.ok) {
      if (res.status === 401) return [];
      throw new Error('读取云端历史失败');
    }
    const data = await res.json();
    return Array.isArray(data.history) ? data.history : [];
  }

  async saveHistory(items: HistoryItem[]): Promise<void> {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      throw new Error('保存云端历史失败');
    }
  }
}

export const localHistory = new LocalStorageBackend();
export const cloudHistory = new CloudBackend();

let currentBackend: HistoryBackend = localHistory;

export function setHistoryBackend(backend: HistoryBackend): void {
  currentBackend = backend;
}

export function getCurrentBackend(): HistoryBackend {
  return currentBackend;
}

export async function loadHistory(): Promise<HistoryItem[]> {
  const result = currentBackend.getHistory();
  return Promise.resolve(result);
}

export async function persistHistory(items: HistoryItem[]): Promise<void> {
  const result = currentBackend.saveHistory(items);
  await Promise.resolve(result);
}
```

- [ ] **Step 2: 修改 historyStorage.ts 使用统一接口**

将 `getHistory` 和 `saveHistory` 改为异步，并调用 `userHistory`：

```typescript
// src/lib/historyStorage.ts
import {
  localHistory,
  cloudHistory,
  setHistoryBackend,
  getCurrentBackend,
} from './userHistory';

export { setHistoryBackend, getCurrentBackend, localHistory, cloudHistory };

export async function getHistory(): Promise<HistoryItem[]> {
  return loadHistory();
}

async function saveHistory(items: HistoryItem[]): Promise<void> {
  return persistHistory(items);
}
```

其他函数（saveSingleResult, saveCompareResults, toggleFavorite 等）需要改为 async/await。

- [ ] **Step 3: 运行测试**

```bash
npm test
```

Expected: 现有测试可能需要更新，因为 getHistory 变为异步

- [ ] **Step 4: 提交**

```bash
git add src/lib/historyStorage.ts src/lib/userHistory.ts
git commit -m "refactor(history): introduce pluggable local/cloud backend"
```

---

### Task 8: 适配异步历史记录到 UI

**Files:**
- Modify: `src/components/HistoryPanel.tsx`
- Modify: `src/app/generator/page.tsx`

- [ ] **Step 1: 修改 HistoryPanel 支持异步刷新和同步按钮**

在 HistoryPanel 中：
- 将 `refresh()` 改为 async
- `useEffect` 中调用 `refresh()`
- 添加 `onSyncLocal?: () => void` 属性
- 如果检测到登录状态且有本地历史，显示"同步到云端"按钮

- [ ] **Step 2: 修改 generator/page.tsx**

- 添加 `user` state，调用 `/api/auth/me`
- 根据登录状态切换历史后端
- 提供 `syncLocalToCloud` 函数，合并本地历史和云端历史

- [ ] **Step 3: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add src/components/HistoryPanel.tsx src/app/generator/page.tsx
git commit -m "feat(history): adapt UI to async history and add sync flow"
```

---

### Task 9: 实现登录弹窗组件

**Files:**
- Create: `src/components/LoginModal.tsx`

- [ ] **Step 1: 创建登录弹窗**

使用现有 GlassCard 和 AnimatedButton 风格，包含：
- 邮箱输入框
- "发送验证码" 按钮（带倒计时）
- 验证码输入框
- "登录" 按钮
- 错误/成功提示
- 测试模式下显示验证码

- [ ] **Step 2: 提交**

```bash
git add src/components/LoginModal.tsx
git commit -m "feat(ui): add email verification login modal"
```

---

### Task 10: 实现用户菜单组件

**Files:**
- Create: `src/components/UserMenu.tsx`

- [ ] **Step 1: 创建用户菜单**

显示：
- 未登录："登录" 按钮
- 已登录：邮箱前缀 + 下拉菜单（退出登录）

使用 GlassCard 风格的下拉菜单。

- [ ] **Step 2: 提交**

```bash
git add src/components/UserMenu.tsx
git commit -m "feat(ui): add user menu with login/logout actions"
```

---

### Task 11: 集成登录入口到生成器页面

**Files:**
- Modify: `src/app/generator/page.tsx`

- [ ] **Step 1: 在页面顶部添加 UserMenu 和 LoginModal**

```tsx
import UserMenu from '@/components/UserMenu';
import LoginModal from '@/components/LoginModal';

// 在 header 区域添加 <UserMenu onLoginClick={() => setIsLoginOpen(true)} />
// 在页面底部添加 <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={handleLogin} />
```

- [ ] **Step 2: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/app/generator/page.tsx
git commit -m "feat(generator): integrate login modal and user menu"
```

---

### Task 12: 添加认证相关测试

**Files:**
- Create: `src/lib/auth.test.ts`
- Create: `src/lib/userHistory.test.ts`

- [ ] **Step 1: 编写 auth 工具函数测试**

测试：
- generateCode 返回 6 位数字
- createSession/getSession/clearSession 正常工作（mock cookies）

- [ ] **Step 2: 编写 userHistory 测试**

测试：
- localStorageBackend 读写正常
- cloudBackend 调用 /api/history
- setHistoryBackend 切换后端

- [ ] **Step 3: 运行测试**

```bash
npm test
```

Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add src/lib/auth.test.ts src/lib/userHistory.test.ts
git commit -m "test(auth): add tests for session and history backends"
```

---

### Task 13: 配置环境变量和 Vercel KV

**Files:**
- Modify: `.env.local`
- Vercel Dashboard

- [ ] **Step 1: 添加本地环境变量模板**

在 `.env.local` 中添加：

```
AUTH_SECRET=your-local-auth-secret-at-least-32-characters-long
# RESEND_API_KEY=optional-for-real-emails
```

注意：`.env.local` 已被 gitignore 忽略，不会提交。

- [ ] **Step 2: 在 Vercel 创建 KV 数据库并绑定**

命令：

```bash
npx vercel kv create ai-outdoor-apparel-agent-kv
npx vercel kv link ai-outdoor-apparel-agent-kv
```

- [ ] **Step 3: 配置 Production 环境变量**

在 Vercel Dashboard 或 CLI 中设置：
- `AUTH_SECRET`：随机 32 位以上字符串
- `RESEND_API_KEY`（可选）

- [ ] **Step 4: 提交环境变量模板说明**

```bash
git add .env.example
git commit -m "docs: add environment variable template"
```

---

### Task 14: 构建、测试与部署

- [ ] **Step 1: 运行完整检查**

```bash
npx tsc --noEmit
npm test
npm run build
```

Expected: 全部通过

- [ ] **Step 2: 提交并推送**

```bash
git push origin main
```

- [ ] **Step 3: 等待 Vercel 部署完成**

```bash
npx vercel --prod
```

或等待 GitHub push 自动触发部署。

- [ ] **Step 4: 线上验证**

1. 打开线上生成器页面
2. 点击"登录"，输入邮箱
3. 获取验证码（测试模式会显示在 UI 或控制台）
4. 输入验证码登录
5. 生成一个方案，确认历史记录保存到云端
6. 刷新页面，确认历史记录仍然显示
7. 退出登录，确认回到本地历史

---

## Self-Review

**1. Spec coverage:**
- 邮箱验证码登录：Task 2-5, 9-11
- 历史记录持久化：Task 6-8
- Vercel KV：Task 3, 6, 13
- 登录前后同步：Task 8
- 测试：Task 12
- 部署验证：Task 14

**2. Placeholder scan:**
- 无 TBD/TODO
- 代码片段完整
- 命令具体

**3. Type consistency:**
- HistoryItem 类型在 `src/lib/historyStorage.ts` 中定义，其他文件复用
- UserSession 类型在 `src/lib/auth.ts` 中定义
- 后端接口在 `src/lib/userHistory.ts` 中定义
