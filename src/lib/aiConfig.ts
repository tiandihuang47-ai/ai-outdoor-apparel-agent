import fs from 'fs';
import path from 'path';
import type { AiProvider } from '@/types';

export interface AiConfig {
  provider: AiProvider;
  keys: Record<AiProvider, string>;
  imageApiKey: string;
}

const CONFIG_PATH = path.join(process.cwd(), 'src', 'data', 'aiConfig.json');

const ENV_KEY_MAP: Record<keyof AiConfig['keys'], string> = {
  mock: '',
  openai: 'OPENAI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  qwen: 'QWEN_API_KEY',
};

const IMAGE_API_KEY_ENV = 'DASHSCOPE_API_KEY';

function readFileConfig(): AiConfig {
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

function applyEnvOverrides(config: AiConfig): AiConfig {
  const next: AiConfig = {
    provider: config.provider,
    keys: { ...config.keys },
    imageApiKey: config.imageApiKey,
  };

  for (const provider of Object.keys(ENV_KEY_MAP) as AiProvider[]) {
    const envName = ENV_KEY_MAP[provider];
    if (envName) {
      const envValue = process.env[envName];
      if (envValue && envValue.trim().length > 0) {
        next.keys[provider] = envValue.trim();
      }
    }
  }

  const envImageKey = process.env[IMAGE_API_KEY_ENV];
  if (envImageKey && envImageKey.trim().length > 0) {
    next.imageApiKey = envImageKey.trim();
  }

  const envProvider = process.env.AI_PROVIDER as AiProvider | undefined;
  if (envProvider && ['mock', 'openai', 'deepseek', 'qwen'].includes(envProvider)) {
    next.provider = envProvider;
  }

  return next;
}

export function loadAiConfig(): AiConfig {
  const fileConfig = readFileConfig();
  return applyEnvOverrides(fileConfig);
}

export function getFileConfig(): AiConfig {
  return readFileConfig();
}

export function getEnvKeyFlags(): {
  provider: boolean;
  keys: Record<AiProvider, boolean>;
  imageApiKey: boolean;
} {
  return {
    provider: Boolean(process.env.AI_PROVIDER),
    keys: {
      mock: false,
      openai: Boolean(process.env.OPENAI_API_KEY),
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      qwen: Boolean(process.env.QWEN_API_KEY),
    },
    imageApiKey: Boolean(process.env.DASHSCOPE_API_KEY),
  };
}

export function saveAiConfig(config: AiConfig): void {
  const envFlags = getEnvKeyFlags();

  const fileConfig: AiConfig = {
    provider: envFlags.provider ? readFileConfig().provider : config.provider,
    keys: {
      mock: '',
      openai: envFlags.keys.openai ? readFileConfig().keys.openai : config.keys.openai,
      deepseek: envFlags.keys.deepseek ? readFileConfig().keys.deepseek : config.keys.deepseek,
      qwen: envFlags.keys.qwen ? readFileConfig().keys.qwen : config.keys.qwen,
    },
    imageApiKey: envFlags.imageApiKey
      ? readFileConfig().imageApiKey
      : config.imageApiKey,
  };

  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(fileConfig, null, 2), 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('saveAiConfig: unable to write config file (read-only filesystem?):', message);
  }
}

export function maskKey(key: string): string {
  if (!key || key.length <= 8) return '';
  return key.slice(0, 4) + '****' + key.slice(-4);
}
