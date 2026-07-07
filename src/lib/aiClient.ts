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
    gemini: {
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.keys.gemini}`,
      key: config.keys.gemini,
      model: 'gemini-2.0-flash',
    },
  };
  return apiConfigs[provider] || null;
}

function extractMockText(messages: unknown[]): string {
  const firstUser = messages.find((m) => (m as { role?: string }).role === 'user') as
    | { content?: string | { type: string; text?: string }[] }
    | undefined;
  return typeof firstUser?.content === 'string'
    ? firstUser.content
    : firstUser?.content?.find((c) => c.type === 'text')?.text || '';
}

function convertMessagesToGemini(messages: unknown[]) {
  const systemMessages = messages.filter((m) => (m as { role?: string }).role === 'system');
  const nonSystemMessages = messages.filter((m) => (m as { role?: string }).role !== 'system');

  const systemInstruction = systemMessages
    .map((m) => (m as { content?: string }).content)
    .filter(Boolean)
    .join('\n');

  const contents = nonSystemMessages.map((m) => {
    const role = (m as { role?: string }).role === 'assistant' ? 'model' : 'user';
    const content = (m as { content?: string | { type: string; text?: string; image_url?: { url?: string } }[] }).content;

    let parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];

    if (typeof content === 'string') {
      parts = [{ text: content }];
    } else if (Array.isArray(content)) {
      parts = content.map((item) => {
        if (item.type === 'text') {
          return { text: item.text || '' };
        }
        if (item.type === 'image_url' && item.image_url?.url) {
          const url = item.image_url.url;
          const base64Match = url.match(/^data:image\/[^;]+;base64,(.+)$/);
          if (base64Match) {
            return {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Match[1],
              },
            };
          }
        }
        return { text: '' };
      });
    }

    return { role, parts };
  });

  const body: Record<string, unknown> = { contents };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  return body;
}

async function callGemini(apiConfig: AiApiConfig, messages: unknown[]): Promise<string> {
  const body = convertMessagesToGemini(messages);

  const response = await fetch(apiConfig.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callProvider(messages: unknown[]): Promise<string> {
  if (isMockMode()) {
    const text = extractMockText(messages);
    return `[Mock] AI响应：基于"${text.substring(0, 100)}..."的模拟结果`;
  }

  const config = loadAiConfig();
  const apiConfig = getApiConfig(config.provider);
  if (!apiConfig || !apiConfig.key) {
    console.warn(`AI provider ${config.provider} not configured, using mock`);
    return '[Mock] AI provider not configured';
  }

  if (config.provider === 'gemini') {
    return callGemini(apiConfig, messages);
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
