import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveSharedPlan, loadSharedPlan, EXPIRE_DAYS } from './shareStorage';
import { mockGenerationResult } from './__fixtures__/generationResult';
import type { GenerationResult } from '@/types';

const STORAGE_KEY_PREFIX = 'ai-outdoor-apparel-agent-share-';

function singlePlan(data?: Partial<GenerationResult>) {
  return { type: 'single' as const, data: mockGenerationResult(data) };
}

describe('shareStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('保存并读取单方案', () => {
    const plan = singlePlan({ summary: '测试方案' });

    const id = saveSharedPlan(plan);
    expect(id).toBeTruthy();
    expect(id.length).toBeGreaterThan(0);

    const loaded = loadSharedPlan(id);
    expect(loaded).not.toBeNull();
    expect(loaded?.type).toBe('single');
    expect((loaded?.data as GenerationResult).summary).toBe('测试方案');
    expect(loaded?.createdAt).toBeTypeOf('number');
  });

  it('保存并读取对比方案', () => {
    const result = mockGenerationResult();
    const plan = {
      type: 'compare' as const,
      data: [{ tier: 'basic' as const, tierName: '基础版', targetPrice: 100, result }],
    };

    const id = saveSharedPlan(plan);
    const loaded = loadSharedPlan(id);
    expect(loaded?.type).toBe('compare');
  });

  it('过期方案返回 null 并清理', () => {
    const id = saveSharedPlan(singlePlan());
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    expect(localStorage.getItem(key)).not.toBeNull();

    vi.advanceTimersByTime((EXPIRE_DAYS + 1) * 24 * 60 * 60 * 1000);

    const loaded = loadSharedPlan(id);
    expect(loaded).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('读取不存在的方案返回 null', () => {
    expect(loadSharedPlan('not-exist')).toBeNull();
  });

  it('localStorage 不可用时抛出错误', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => saveSharedPlan(singlePlan())).toThrow('浏览器本地存储不可用');

    spy.mockRestore();
  });

  it('清理过期数据时保留未过期方案', () => {
    const freshId = saveSharedPlan(singlePlan());
    const expiredId = saveSharedPlan(singlePlan());

    vi.advanceTimersByTime((EXPIRE_DAYS + 1) * 24 * 60 * 60 * 1000);

    saveSharedPlan(singlePlan());

    expect(loadSharedPlan(freshId)).toBeNull();
    expect(loadSharedPlan(expiredId)).toBeNull();
  });
});
