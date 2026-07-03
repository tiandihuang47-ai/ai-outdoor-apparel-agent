import { NextRequest, NextResponse } from 'next/server';
import { loadAiConfig } from '@/lib/aiConfig';
import type { GenerationResult } from '@/types';

export const maxDuration = 60;

const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com';
const IMAGE_SYNTHESIS_URL = `${DASHSCOPE_BASE_URL}/api/v1/services/aigc/text2image/image-synthesis`;

export type ImageStyle = 'photography' | 'sketch' | '3d';

const STYLE_MAP: Record<ImageStyle, string> = {
  photography: '<photography>',
  sketch: '<sketch>',
  '3d': '<3d cartoon>',
};

const STYLE_PROMPT_SUFFIX: Record<ImageStyle, string> = {
  photography:
    '白色纯色背景，正面平铺/挂拍展示，专业服装产品摄影，高清细节，真实面料质感，无模特，无文字，无水印，无装饰物，电商主图风格。',
  sketch:
    '白色背景，服装线稿图， technical flat sketch，正面展示，清晰轮廓，结构线，缝线细节，无颜色填充，无模特，无文字，无水印，设计手稿风格。',
  '3d':
    '白色背景，3D 产品渲染图，正面展示，立体廓形，柔和光影，干净简约，无模特，无文字，无水印，电商 3D 效果图风格。',
};

function buildPrompt(result: GenerationResult, style: ImageStyle): string {
  const { parsedRequirement, selectedStyle, fabricRecommendations } = result;
  const fabric = fabricRecommendations[0]?.fabric;
  const colors = selectedStyle.colorSuggestions.slice(0, 3).join('、') || '经典色';
  const scenes = parsedRequirement.scenes.join('、') || '日常';

  const basePrompt = `一件${parsedRequirement.gender}${parsedRequirement.category}，${parsedRequirement.season}穿着，${selectedStyle.silhouette}版型，${selectedStyle.length}，${selectedStyle.hood}，${selectedStyle.closure}，${selectedStyle.pockets}，面料为${fabric?.name || '专业面料'}，颜色为${colors}，适合${scenes}场景。`;

  return `${basePrompt}${STYLE_PROMPT_SUFFIX[style]}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitTask(apiKey: string, prompt: string, style: ImageStyle): Promise<string> {
  const response = await fetch(IMAGE_SYNTHESIS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: 'wanx-v1',
      input: {
        prompt,
        negative_prompt:
          '低分辨率，错误，最差质量，低质量，残缺，多余的手指，比例不良，文字，水印，logo，复杂背景，人物，模特，杂乱背景，阴影过重',
      },
      parameters: {
        style: STYLE_MAP[style],
        size: '1024*1024',
        n: 1,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `创建任务失败: ${response.status}`);
  }

  const data = await response.json();
  const taskId = data.output?.task_id;
  if (!taskId) {
    throw new Error('未返回任务ID');
  }
  return taskId;
}

async function pollTask(apiKey: string, taskId: string, maxAttempts = 30): Promise<string> {
  const queryUrl = `${DASHSCOPE_BASE_URL}/api/v1/tasks/${taskId}`;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(queryUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`查询任务失败: ${response.status}`);
    }

    const data = await response.json();
    const status = data.output?.task_status;

    if (status === 'SUCCEEDED') {
      const url = data.output?.results?.[0]?.url;
      if (url) return url;
      throw new Error('任务成功但未返回图片URL');
    }

    if (status === 'FAILED' || status === 'CANCELED') {
      const message = data.output?.message || data.message || '任务失败';
      throw new Error(message);
    }

    await sleep(1500);
  }

  throw new Error('图片生成超时，请稍后重试');
}

export async function POST(request: NextRequest) {
  try {
    const config = loadAiConfig();
    if (!config.imageApiKey) {
      return NextResponse.json(
        { error: '未配置 AI 绘图 Key，请先在设置中填写 DashScope API Key' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      prompt,
      result,
      style = 'photography',
    } = body as { prompt?: string; result?: GenerationResult; style?: ImageStyle };

    const imageStyle: ImageStyle = STYLE_MAP[style as ImageStyle] ? (style as ImageStyle) : 'photography';
    const finalPrompt = prompt || (result ? buildPrompt(result, imageStyle) : '');

    if (!finalPrompt) {
      return NextResponse.json(
        { error: '缺少绘图描述或生成结果' },
        { status: 400 }
      );
    }

    const taskId = await submitTask(config.imageApiKey, finalPrompt, imageStyle);
    const imageUrl = await pollTask(config.imageApiKey, taskId);

    return NextResponse.json({ imageUrl, prompt: finalPrompt, style: imageStyle });
  } catch (error) {
    console.error('Image generation error:', error);
    const message = error instanceof Error ? error.message : '图片生成失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
