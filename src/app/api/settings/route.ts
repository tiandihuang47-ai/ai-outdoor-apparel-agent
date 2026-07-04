import { NextRequest, NextResponse } from 'next/server';
import {
  loadAiConfig,
  getFileConfig,
  saveAiConfig,
  maskKey,
  getEnvKeyFlags,
} from '@/lib/aiConfig';
import type { AiConfig } from '@/lib/aiConfig';

export async function GET() {
  try {
    const config = loadAiConfig();
    const envFlags = getEnvKeyFlags();

    return NextResponse.json({
      provider: config.provider,
      keys: {
        openai: maskKey(config.keys.openai),
        deepseek: maskKey(config.keys.deepseek),
        qwen: maskKey(config.keys.qwen),
      },
      imageApiKey: maskKey(config.imageApiKey),
      envFlags,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: '读取配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, keys, imageApiKey } = body;

    const current = loadAiConfig();

    const newConfig: AiConfig = {
      provider: provider || current.provider,
      keys: {
        mock: '',
        openai: keys?.openai ?? current.keys.openai,
        deepseek: keys?.deepseek ?? current.keys.deepseek,
        qwen: keys?.qwen ?? current.keys.qwen,
      },
      imageApiKey:
        imageApiKey && imageApiKey.length > 0 ? imageApiKey : current.imageApiKey,
    };

    if (provider && apiKey && apiKey.length > 0) {
      newConfig.keys[provider as keyof AiConfig['keys']] = apiKey;
    }

    saveAiConfig(newConfig);

    const savedConfig = loadAiConfig();
    const envFlags = getEnvKeyFlags();

    return NextResponse.json({
      success: true,
      provider: savedConfig.provider,
      keys: {
        openai: maskKey(savedConfig.keys.openai),
        deepseek: maskKey(savedConfig.keys.deepseek),
        qwen: maskKey(savedConfig.keys.qwen),
      },
      imageApiKey: maskKey(savedConfig.imageApiKey),
      envFlags,
    });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json(
      { error: '保存配置失败' },
      { status: 500 }
    );
  }
}
