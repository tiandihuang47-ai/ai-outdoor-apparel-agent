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

export async function chatCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
  if (isMockMode()) {
    return `[Mock] AI响应：基于系统提示"${systemPrompt.substring(0, 100)}..."的模拟结果`;
  }

  const config = loadAiConfig();
  const provider = config.provider;

  const apiConfigs: Record<string, { url: string; key: string; model: string }> = {
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

  const apiConfig = apiConfigs[provider];
  if (!apiConfig || !apiConfig.key) {
    console.warn(`AI provider ${provider} not configured, using mock`);
    return `[Mock] AI响应：基于系统提示"${systemPrompt.substring(0, 100)}..."的模拟结果`;
  }

  try {
    const response = await fetch(apiConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiConfig.key}`,
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('AI API call failed:', error);
    return `[Mock Fallback] AI API调用失败，使用模拟结果`;
  }
}
