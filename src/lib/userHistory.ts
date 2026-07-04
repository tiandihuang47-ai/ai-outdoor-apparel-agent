import type { HistoryItem } from './historyStorage';

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
      // ignore storage errors
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
