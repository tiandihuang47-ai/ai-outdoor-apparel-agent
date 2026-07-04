import type { GenerationResult } from '@/types';
import {
  localHistory,
  cloudHistory,
  setHistoryBackend,
  getCurrentBackend,
  loadHistory,
  persistHistory,
} from './userHistory';

export { setHistoryBackend, getCurrentBackend, localHistory, cloudHistory };

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

const MAX_ITEMS = 50;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function getHistory(): Promise<HistoryItem[]> {
  return loadHistory();
}

async function saveHistory(items: HistoryItem[]): Promise<void> {
  return persistHistory(items.slice(0, MAX_ITEMS));
}

export async function saveSingleResult(result: GenerationResult): Promise<HistoryItem> {
  const items = await getHistory();
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
  await saveHistory(updated);
  return newItem;
}

export async function saveCompareResults(scenarios: ScenarioHistoryItem[]): Promise<HistoryItem> {
  const items = await getHistory();
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
  await saveHistory(updated);
  return newItem;
}

export async function toggleFavorite(id: string): Promise<HistoryItem | null> {
  const items = await getHistory();
  const target = items.find((item) => item.id === id);
  if (!target) return null;

  target.isFavorite = !target.isFavorite;
  await saveHistory(items);
  return target;
}

export async function deleteHistoryItem(id: string): Promise<boolean> {
  const items = await getHistory();
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  await saveHistory(filtered);
  return true;
}

export async function clearHistory(): Promise<void> {
  await saveHistory([]);
}
