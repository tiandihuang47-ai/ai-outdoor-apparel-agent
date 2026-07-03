import type { MarketingCopy } from '@/types';

const STORAGE_KEY = 'ai-outdoor-apparel-agent-marketing-copies';
const MAX_ITEMS = 100;

export interface SavedMarketingCopy {
  id: string;
  title: string;
  category: string;
  copy: MarketingCopy;
  createdAt: number;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getSavedMarketingCopies(): SavedMarketingCopy[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedMarketingCopy[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems(items: SavedMarketingCopy[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // ignore storage errors
  }
}

export function saveMarketingCopy(category: string, copy: MarketingCopy): SavedMarketingCopy {
  const items = getSavedMarketingCopies();
  const newItem: SavedMarketingCopy = {
    id: generateId(),
    title: copy.title,
    category,
    copy,
    createdAt: Date.now(),
  };

  const updated = [newItem, ...items];
  saveItems(updated);
  return newItem;
}

export function deleteMarketingCopy(id: string): boolean {
  const items = getSavedMarketingCopies();
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  saveItems(filtered);
  return true;
}

export function clearMarketingCopies(): void {
  saveItems([]);
}
