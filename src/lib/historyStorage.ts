import type { GenerationResult } from '@/types';

export interface ScenarioHistoryItem {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  targetPrice: number;
  result: GenerationResult;
}

export interface HistoryItem {
  id: string;
  type: 'single' | 'compare';
  title: string;
  category: string;
  timestamp: number;
  isFavorite: boolean;
  data: GenerationResult | ScenarioHistoryItem[];
}

const STORAGE_KEY = 'ai-outdoor-apparel-agent-history';
const MAX_ITEMS = 50;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getHistory(): HistoryItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // ignore storage errors
  }
}

export function saveSingleResult(result: GenerationResult): HistoryItem {
  const items = getHistory();
  const newItem: HistoryItem = {
    id: generateId(),
    type: 'single',
    title: result.marketingCopy.title,
    category: result.parsedRequirement.category,
    timestamp: Date.now(),
    isFavorite: false,
    data: result,
  };

  const filtered = items.filter(
    (item) =>
      !(item.type === 'single' &&
        item.category === newItem.category &&
        JSON.stringify(item.data) === JSON.stringify(newItem.data))
  );

  const updated = [newItem, ...filtered];
  saveHistory(updated);
  return newItem;
}

export function saveCompareResults(scenarios: ScenarioHistoryItem[]): HistoryItem {
  const items = getHistory();
  const category = scenarios[0]?.result.parsedRequirement.category || '服装';
  const title = `${category} 三套方案对比`;
  const newItem: HistoryItem = {
    id: generateId(),
    type: 'compare',
    title,
    category,
    timestamp: Date.now(),
    isFavorite: false,
    data: scenarios,
  };

  const filtered = items.filter(
    (item) =>
      !(item.type === 'compare' &&
        item.category === newItem.category &&
        JSON.stringify(item.data) === JSON.stringify(newItem.data))
  );

  const updated = [newItem, ...filtered];
  saveHistory(updated);
  return newItem;
}

export function toggleFavorite(id: string): HistoryItem | null {
  const items = getHistory();
  const target = items.find((item) => item.id === id);
  if (!target) return null;

  target.isFavorite = !target.isFavorite;
  saveHistory(items);
  return target;
}

export function deleteHistoryItem(id: string): boolean {
  const items = getHistory();
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  saveHistory(filtered);
  return true;
}

export function clearHistory(): void {
  saveHistory([]);
}
