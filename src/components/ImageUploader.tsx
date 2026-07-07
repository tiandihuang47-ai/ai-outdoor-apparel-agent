'use client';

import { useRef, useState } from 'react';

interface ImageUploaderProps {
  onAnalyzed: (data: { parsedRequirement: Record<string, unknown>; description: string }) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ImageUploader({ onAnalyzed, onError, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError('仅支持 jpg、jpeg、png、webp 格式');
      return;
    }

    if (file.size > MAX_SIZE) {
      onError('图片大小不能超过 5MB');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || '图片分析失败');
      }

      const data = await response.json();
      onAnalyzed(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : '图片分析失败';
      onError(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || analyzing}
        className="hidden"
      />

      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled || analyzing}
          className="w-full py-4 px-6 rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/50 text-slate-300 hover:border-cyan-500 hover:text-cyan-400 transition-all disabled:opacity-50"
        >
          {analyzing ? '分析中...' : '📷 上传衣服图片'}
        </button>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-slate-600">
          <img src={preview} alt="预览" className="w-full max-h-64 object-contain bg-slate-900" />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-900/80 text-xs text-white hover:bg-slate-800"
          >
            重新上传
          </button>
          {analyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
              <div className="flex items-center gap-2 text-white">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                正在分析图片...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
