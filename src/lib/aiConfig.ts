import fs from 'fs';
import path from 'path';
import type { AiProvider } from '@/types';

export interface AiConfig {
  provider: AiProvider;
  keys: Record<AiProvider, string>;
  imageApiKey: string;
}

const CONFIG_PATH = path.join(process.cwd(), 'src', 'data', 'aiConfig.json');

export function loadAiConfig(): AiConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as AiConfig;
  } catch {
    return {
      provider: 'mock',
      keys: { mock: '', openai: '', deepseek: '', qwen: '' },
      imageApiKey: '',
    };
  }
}

export function saveAiConfig(config: AiConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function maskKey(key: string): string {
  if (!key || key.length <= 8) return '';
  return key.slice(0, 4) + '****' + key.slice(-4);
}
