'use client';

import { useState } from 'react';
import type { GenerationResult } from '@/types';

type ImageStyle = 'photography' | 'sketch' | '3d';

interface ImageGeneratorProps {
  result?: GenerationResult;
  prompt?: string;
  variant?: 'default' | 'compact';
}

const STYLE_OPTIONS: { value: ImageStyle; label: string; icon: string }[] = [
  { value: 'photography', label: '摄影', icon: '📷' },
  { value: 'sketch', label: '线稿', icon: '✏️' },
  { value: '3d', label: '3D', icon: '🧊' },
];

export default function ImageGenerator({ result, prompt, variant = 'default' }: ImageGeneratorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState<ImageStyle>('photography');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, prompt, style: imageStyle }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '图片生成失败');
      }

      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片生成失败');
    } finally {
      setLoading(false);
    }
  };

  const styleSelector = (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-400">风格：</span>
      {STYLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => !loading && setImageStyle(option.value)}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            imageStyle === option.value
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          } disabled:opacity-50`}
        >
          {option.icon} {option.label}
        </button>
      ))}
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className="space-y-3">
        {styleSelector}
        {!imageUrl && !loading && (
          <button
            onClick={handleGenerate}
            className="w-full py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 transition-all"
          >
            🎨 生成效果图
          </button>
        )}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-slate-300 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
            正在生成效果图，约需 5-15 秒...
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        {imageUrl && (
          <div className="relative rounded-lg overflow-hidden border border-slate-600">
            <img src={imageUrl} alt="AI 生成效果图" className="w-full h-auto" />
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-slate-900/70 text-xs text-slate-200">
              {STYLE_OPTIONS.find((s) => s.value === imageStyle)?.label}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">🎨 AI 效果图</h3>
        {styleSelector}
      </div>

      {!imageUrl && !loading && (
        <div className="text-center py-6">
          <p className="text-slate-400 text-sm mb-4">根据当前方案自动生成产品设计效果图</p>
          <button
            onClick={handleGenerate}
            className="py-2.5 px-6 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 transition-all"
          >
            生成{STYLE_OPTIONS.find((s) => s.value === imageStyle)?.label}效果图
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-500 border-t-transparent"></div>
          <p className="text-slate-300 text-sm">正在调用 AI 绘图接口，约需 5-15 秒...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {imageUrl && (
        <div className="rounded-xl overflow-hidden border border-slate-600">
          <div className="relative">
            <img src={imageUrl} alt="AI 生成效果图" className="w-full h-auto" />
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-900/70 text-sm text-slate-200">
              {STYLE_OPTIONS.find((s) => s.value === imageStyle)?.label}风格
            </div>
          </div>
          <div className="p-3 bg-slate-900/50 text-xs text-slate-400 text-center">
            效果图由 AI 生成，仅供参考
          </div>
        </div>
      )}
    </div>
  );
}
