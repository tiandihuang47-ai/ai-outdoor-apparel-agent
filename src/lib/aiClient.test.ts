import { describe, it, expect, vi } from 'vitest';
import { chatCompletion, visionCompletion, isMockMode } from './aiClient';

vi.mock('./aiConfig', () => ({
  loadAiConfig: () => ({
    provider: 'mock',
    model: '',
    keys: {},
  }),
}));

describe('aiClient', () => {
  it('isMockMode returns true when provider is mock', () => {
    expect(isMockMode()).toBe(true);
  });

  it('chatCompletion returns mock response', async () => {
    const result = await chatCompletion('system', 'user prompt');
    expect(result).toContain('[Mock]');
    expect(result).toContain('user prompt');
  });

  it('visionCompletion returns mock response', async () => {
    const result = await visionCompletion('system', 'describe image', 'base64data');
    expect(result).toContain('[Mock]');
    expect(result).toContain('describe image');
  });
});
