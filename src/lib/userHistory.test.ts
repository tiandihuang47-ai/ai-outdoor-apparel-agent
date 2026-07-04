import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  localHistory,
  cloudHistory,
  setHistoryBackend,
  getCurrentBackend,
  loadHistory,
  persistHistory,
} from './userHistory';
import type { HistoryItem } from './historyStorage';

function mockItem(id: string): HistoryItem {
  return {
    id,
    type: 'single',
    title: '测试方案',
    category: '冲锋衣',
    timestamp: Date.now(),
    isFavorite: false,
    data: {} as HistoryItem['data'],
  };
}

describe('userHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    setHistoryBackend(localHistory);
    vi.restoreAllMocks();
  });

  describe('LocalStorageBackend', () => {
    it('初始为空数组', () => {
      expect(localHistory.getHistory()).toEqual([]);
    });

    it('保存后读取一致', () => {
      const items = [mockItem('1'), mockItem('2')];
      localHistory.saveHistory(items);
      expect(localHistory.getHistory()).toHaveLength(2);
      expect(localHistory.getHistory()[0].id).toBe('1');
    });

    it('最多保留 50 条', () => {
      const items = Array.from({ length: 60 }, (_, i) => mockItem(String(i)));
      localHistory.saveHistory(items);
      expect(localHistory.getHistory()).toHaveLength(50);
    });

    it('localStorage 不可用时静默忽略', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => localHistory.saveHistory([mockItem('1')])).not.toThrow();
      setItemSpy.mockRestore();
    });
  });

  describe('CloudBackend', () => {
    it('getHistory 调用 /api/history', async () => {
      const items = [mockItem('1')];
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ history: items }),
        })
      ) as unknown as typeof fetch;

      const result = await cloudHistory.getHistory();
      expect(result).toEqual(items);
      expect(fetch).toHaveBeenCalledWith('/api/history');
    });

    it('401 返回空数组', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: '未登录' }),
        })
      ) as unknown as typeof fetch;

      const result = await cloudHistory.getHistory();
      expect(result).toEqual([]);
    });

    it('非 401 错误抛出异常', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: '失败' }),
        })
      ) as unknown as typeof fetch;

      await expect(cloudHistory.getHistory()).rejects.toThrow('读取云端历史失败');
    });

    it('saveHistory POST 到 /api/history', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        })
      ) as unknown as typeof fetch;

      const items = [mockItem('1')];
      await cloudHistory.saveHistory(items);
      expect(fetch).toHaveBeenCalledWith('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    });

    it('保存失败抛出异常', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: '失败' }),
        })
      ) as unknown as typeof fetch;

      await expect(cloudHistory.saveHistory([mockItem('1')])).rejects.toThrow('保存云端历史失败');
    });
  });

  describe('后端切换', () => {
    it('默认后端为 localHistory', () => {
      expect(getCurrentBackend()).toBe(localHistory);
    });

    it('setHistoryBackend 切换后端', () => {
      setHistoryBackend(cloudHistory);
      expect(getCurrentBackend()).toBe(cloudHistory);
    });

    it('loadHistory 使用当前后端', async () => {
      localHistory.saveHistory([mockItem('1')]);
      const result = await loadHistory();
      expect(result).toHaveLength(1);
    });

    it('persistHistory 使用当前后端', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        })
      ) as unknown as typeof fetch;

      setHistoryBackend(cloudHistory);
      await persistHistory([mockItem('1')]);
      expect(fetch).toHaveBeenCalled();
    });
  });
});
