'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getHistory,
  toggleFavorite,
  deleteHistoryItem,
  clearHistory,
  type HistoryItem,
} from '@/lib/historyStorage';
import type { GenerationResult } from '@/types';

interface Scenario {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  targetPrice: number;
  result: GenerationResult;
}

interface HistoryPanelProps {
  onSelect: (item: HistoryItem) => void;
  onCompare?: (scenarios: Scenario[]) => void;
}

type BatchExportFeedback =
  | { type: 'idle' }
  | { type: 'loading'; format: 'markdown' | 'doc' }
  | { type: 'success'; format: 'markdown' | 'doc' }
  | { type: 'error'; message: string };

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function HistoryPanel({ onSelect, onCompare }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<string>>(new Set());
  const [batchFeedback, setBatchFeedback] = useState<BatchExportFeedback>({ type: 'idle' });

  const refresh = () => {
    setHistory(getHistory());
  };

  useEffect(() => {
    refresh();

    const handleStorage = () => refresh();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const categories = useMemo(() => {
    const set = new Set(history.map((item) => item.category));
    return Array.from(set).sort();
  }, [history]);

  const filteredHistory = useMemo(() => {
    let result = [...history];

    if (filterCategory !== 'all') {
      result = result.filter((item) => item.category === filterCategory);
    }

    if (showFavoritesOnly) {
      result = result.filter((item) => item.isFavorite);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => {
      if (a.isFavorite === b.isFavorite) return b.timestamp - a.timestamp;
      return a.isFavorite ? -1 : 1;
    });
  }, [history, filterCategory, searchQuery, showFavoritesOnly]);

  const compareCandidates = useMemo(() => {
    return filteredHistory.filter((item) => item.type === 'single');
  }, [filteredHistory]);

  const handleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
    refresh();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteHistoryItem(id);
    refresh();
  };

  const handleClear = () => {
    if (confirm('确定清空所有历史记录吗？')) {
      clearHistory();
      refresh();
    }
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 3) {
          alert('最多选择 3 个方案进行对比');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleCompare = () => {
    if (selectedIds.size < 2) {
      alert('请至少选择 2 个方案进行对比');
      return;
    }

    const selectedItems = compareCandidates
      .filter((item) => selectedIds.has(item.id))
      .sort((a, b) => {
        const priceA = (a.data as GenerationResult).parsedRequirement.targetPrice;
        const priceB = (b.data as GenerationResult).parsedRequirement.targetPrice;
        return priceA - priceB;
      });

    const tierNames = ['基础版', '中端版', '高端版'];
    const scenarios: Scenario[] = selectedItems.map((item, index) => {
      const result = item.data as GenerationResult;
      return {
        tier: ['basic', 'mid', 'premium'][index] as Scenario['tier'],
        tierName: tierNames[index],
        targetPrice: result.parsedRequirement.targetPrice,
        result,
      };
    });

    onCompare?.(scenarios);
    setCompareMode(false);
    setSelectedIds(new Set());
  };

  const toggleCompareMode = () => {
    setCompareMode((prev) => {
      const next = !prev;
      if (next) {
        setBatchMode(false);
        setBatchSelectedIds(new Set());
      }
      if (!next) {
        setSelectedIds(new Set());
      }
      return next;
    });
  };

  const toggleBatchMode = () => {
    setBatchMode((prev) => {
      const next = !prev;
      if (next) {
        setCompareMode(false);
        setSelectedIds(new Set());
      }
      if (!next) {
        setBatchSelectedIds(new Set());
      }
      return next;
    });
  };

  const toggleBatchSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBatchSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchExport = async (format: 'markdown' | 'doc') => {
    if (batchSelectedIds.size === 0) {
      alert('请至少选择一个方案');
      return;
    }

    setBatchFeedback({ type: 'loading', format });

    const selectedResults = filteredHistory
      .filter((item) => item.type === 'single' && batchSelectedIds.has(item.id))
      .map((item) => item.data as GenerationResult);

    try {
      const response = await fetch(`/api/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: selectedResults }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || '导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      const extension = format === 'doc' ? 'doc' : 'md';
      const a = document.createElement('a');
      a.href = url;
      a.download = `批量导出研发方案_${dateStr}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setBatchFeedback({ type: 'success', format });
      setTimeout(() => {
        setBatchFeedback({ type: 'idle' });
        setBatchMode(false);
        setBatchSelectedIds(new Set());
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败，请重试';
      setBatchFeedback({ type: 'error', message });
      setTimeout(() => setBatchFeedback({ type: 'idle' }), 4000);
    }
  };

  if (history.length === 0) {
    return (
      <div>
        <h3 className="text-base font-semibold text-white mb-2">📜 历史记录</h3>
        <p className="text-sm text-slate-400">暂无生成记录，生成方案后会自动保存到这里。</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">📜 历史记录</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCompareMode}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              compareMode
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {compareMode ? '退出对比' : '对比模式'}
          </button>
          <button
            onClick={toggleBatchMode}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              batchMode
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {batchMode ? '退出批量' : '批量导出'}
          </button>
          <button
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            清空
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <input
          type="text"
          placeholder="搜索标题或品类..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />

        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">全部品类</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFavoritesOnly((prev) => !prev)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              showFavoritesOnly
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            {showFavoritesOnly ? '★ 收藏' : '☆ 收藏'}
          </button>
        </div>
      </div>

      {compareMode && (
        <div className="mb-3 p-3 rounded-lg bg-indigo-900/20 border border-indigo-500/30">
          <p className="text-xs text-indigo-300 mb-2">
            请选择 2-3 个单方案进行对比（已选 {selectedIds.size} 个）
          </p>
          <button
            onClick={handleCompare}
            disabled={selectedIds.size < 2}
            className="w-full py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
          >
            一键对比选中方案
          </button>
        </div>
      )}

      {batchMode && (
        <div className="mb-3 p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30 space-y-2">
          <p className="text-xs text-emerald-300">
            请选择要批量导出的单方案（已选 {batchSelectedIds.size} 个）
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleBatchExport('markdown')}
              disabled={batchSelectedIds.size === 0 || batchFeedback.type === 'loading'}
              className="w-full py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2"
            >
              {batchFeedback.type === 'loading' && batchFeedback.format === 'markdown' ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  导出中...
                </>
              ) : (
                <>📥 Markdown</>
              )}
            </button>
            <button
              onClick={() => handleBatchExport('doc')}
              disabled={batchSelectedIds.size === 0 || batchFeedback.type === 'loading'}
              className="w-full py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2"
            >
              {batchFeedback.type === 'loading' && batchFeedback.format === 'doc' ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  导出中...
                </>
              ) : (
                <>📝 Word</>
              )}
            </button>
          </div>

          {batchFeedback.type === 'success' && (
            <div className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 rounded-lg px-3 py-2">
              ✅ {batchFeedback.format === 'doc' ? 'Word' : 'Markdown'} 批量导出成功
            </div>
          )}

          {batchFeedback.type === 'error' && (
            <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/30 rounded-lg px-3 py-2">
              ❌ {batchFeedback.message}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {filteredHistory.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">没有符合条件的历史记录</p>
        )}

        {filteredHistory.map((item) => (
          <div
            key={item.id}
            onClick={() => !compareMode && !batchMode && onSelect(item)}
            className={`group flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              compareMode && selectedIds.has(item.id)
                ? 'bg-indigo-900/20 border-indigo-500/50'
                : batchMode && batchSelectedIds.has(item.id)
                ? 'bg-emerald-900/20 border-emerald-500/50'
                : 'bg-slate-900/50 hover:bg-slate-700/50 border-slate-700/50 hover:border-slate-600'
            }`}
          >
            {compareMode && item.type === 'single' && (
              <button
                onClick={(e) => toggleSelection(e, item.id)}
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center text-xs transition-colors ${
                  selectedIds.has(item.id)
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'border-slate-600 hover:border-indigo-500'
                }`}
              >
                {selectedIds.has(item.id) ? '✓' : ''}
              </button>
            )}

            {batchMode && item.type === 'single' && (
              <button
                onClick={(e) => toggleBatchSelection(e, item.id)}
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center text-xs transition-colors ${
                  batchSelectedIds.has(item.id)
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'border-slate-600 hover:border-emerald-500'
                }`}
              >
                {batchSelectedIds.has(item.id) ? '✓' : ''}
              </button>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                  {item.type === 'compare' ? '对比' : '单方案'}
                </span>
                <span className="text-xs text-slate-500">{item.category}</span>
                {item.isFavorite && <span className="text-yellow-400 text-xs">★</span>}
              </div>
              <p className="text-sm text-slate-200 mt-1 truncate">{item.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatTime(item.timestamp)}</p>
            </div>

            {!compareMode && !batchMode && (
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={(e) => handleFavorite(e, item.id)}
                  className={`text-lg leading-none transition-colors ${item.isFavorite ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`}
                  title={item.isFavorite ? '取消收藏' : '收藏'}
                >
                  {item.isFavorite ? '★' : '☆'}
                </button>
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  className="text-sm leading-none text-slate-600 hover:text-red-400 transition-colors"
                  title="删除"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
