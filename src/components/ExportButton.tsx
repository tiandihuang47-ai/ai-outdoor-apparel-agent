'use client';

import { useState } from 'react';
import type { GenerationResult } from '@/types';

interface ExportButtonProps {
  result: GenerationResult;
}

type FeedbackState =
  | { type: 'idle' }
  | { type: 'loading'; format: 'markdown' | 'doc' }
  | { type: 'success'; format: 'markdown' | 'doc' }
  | { type: 'error'; message: string };

export default function ExportButton({ result }: ExportButtonProps) {
  const [feedback, setFeedback] = useState<FeedbackState>({ type: 'idle' });

  const handleExport = async (format: 'markdown' | 'doc') => {
    setFeedback({ type: 'loading', format });

    try {
      const response = await fetch(`/api/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || '导出失败');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const dateStr = new Date().toISOString().slice(0, 10);
      const extension = format === 'doc' ? 'doc' : 'md';
      a.download = `研发方案_${result.parsedRequirement.category}_${dateStr}.${extension}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({ type: 'success', format });
      setTimeout(() => setFeedback({ type: 'idle' }), 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败，请重试';
      setFeedback({ type: 'error', message });
      setTimeout(() => setFeedback({ type: 'idle' }), 4000);
    }
  };

  const isLoading = feedback.type === 'loading';
  const loadingFormat = feedback.type === 'loading' ? feedback.format : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleExport('markdown')}
          disabled={isLoading}
          className="py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
        >
          {loadingFormat === 'markdown' ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              导出中...
            </>
          ) : (
            <>📥 Markdown</>
          )}
        </button>
        <button
          onClick={() => handleExport('doc')}
          disabled={isLoading}
          className="py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
        >
          {loadingFormat === 'doc' ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              导出中...
            </>
          ) : (
            <>📝 Word 文档</>
          )}
        </button>
      </div>

      {feedback.type === 'success' && (
        <div className="text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-500/30 rounded-lg px-3 py-2">
          ✅ {feedback.format === 'doc' ? 'Word' : 'Markdown'} 导出成功
        </div>
      )}

      {feedback.type === 'error' && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
          ❌ {feedback.message}
        </div>
      )}
    </div>
  );
}
