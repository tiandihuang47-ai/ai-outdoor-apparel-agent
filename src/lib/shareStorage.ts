import type { GenerationResult } from '@/types';

export interface SharedPlan {
  type: 'single' | 'compare';
  data: GenerationResult | ScenarioData[];
  createdAt: number;
}

export interface ScenarioData {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  targetPrice: number;
  result: GenerationResult;
}

const STORAGE_KEY_PREFIX = 'ai-outdoor-apparel-agent-share-';
export const EXPIRE_DAYS = 30;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function isLocalStorageAvailable(): boolean {
  if (!isBrowser()) return false;
  try {
    const testKey = `${STORAGE_KEY_PREFIX}__test__`;
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function cleanupExpired(): void {
  if (!isBrowser()) return;
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}') as SharedPlan;
        if (!item.createdAt || (now - item.createdAt) > EXPIRE_DAYS * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(key);
        }
      } catch {
        // ignore
      }
    }
  }
}

export function saveSharedPlan(plan: Omit<SharedPlan, 'createdAt'>): string {
  if (!isBrowser() || !isLocalStorageAvailable()) {
    throw new Error('浏览器本地存储不可用，请检查是否开启了隐私/无痕模式或禁用了 localStorage');
  }
  cleanupExpired();
  const id = generateId();
  const fullPlan: SharedPlan = { ...plan, createdAt: Date.now() };
  localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify(fullPlan));
  return id;
}

export function loadSharedPlan(id: string): SharedPlan | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + id);
    if (!raw) return null;
    const plan = JSON.parse(raw) as SharedPlan;
    if (!plan.createdAt || (Date.now() - plan.createdAt) > EXPIRE_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY_PREFIX + id);
      return null;
    }
    return plan;
  } catch {
    return null;
  }
}
