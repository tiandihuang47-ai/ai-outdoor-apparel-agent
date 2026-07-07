import type { AiProvider } from '@/types';
import { loadAiConfig } from './aiConfig';

export function getAiProvider(): AiProvider {
  return loadAiConfig().provider;
}

export function isMockMode(): boolean {
  const config = loadAiConfig();
  const provider = config.provider;

  if (provider === 'mock') return true;

  const key = config.keys[provider];
  if (!key) {
    console.warn(`${provider} API key not set, falling back to mock mode`);
    return true;
  }
  return false;
}

interface AiApiConfig {
  url: string;
  key: string;
  model: string;
}

function getApiConfig(provider: string): AiApiConfig | null {
  const config = loadAiConfig();
  const apiConfigs: Record<string, AiApiConfig> = {
    openai: {
      url: 'https://api.openai.com/v1/chat/completions',
      key: config.keys.openai,
      model: 'gpt-4o-mini',
    },
    deepseek: {
      url: 'https://api.deepseek.com/v1/chat/completions',
      key: config.keys.deepseek,
      model: 'deepseek-chat',
    },
    qwen: {
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      key: config.keys.qwen,
      model: 'qwen-plus',
    },
  };
  return apiConfigs[provider] || null;
}

async function callProvider(messages: unknown[]): Promise<string> {
  if (isMockMode()) {
    const firstUser = messages.find((m) => (m as { role?: string }).role === 'user') as
      | { content?: string | { type: string; text?: string }[] }
      | undefined;
    const text =
      typeof firstUser?.content === 'string'
        ? firstUser.content
        : firstUser?.content?.find((c) => c.type === 'text')?.text || '';
    return `[Mock] AI响应：基于"${text.substring(0, 100)}..."的模拟结果`;
  }

  const config = loadAiConfig();
  const apiConfig = getApiConfig(config.provider);
  if (!apiConfig || !apiConfig.key) {
    console.warn(`AI provider ${config.provider} not configured, using mock`);
    return '[Mock] AI provider not configured';
  }

  const response = await fetch(apiConfig.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiConfig.key}`,
    },
    body: JSON.stringify({
      model: apiConfig.model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function chatCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  return callProvider(messages);
}

export async function visionCompletion(systemPrompt: string, userPrompt: string, imageBase64: string): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    },
  ];

  return callProvider(messages);
}
