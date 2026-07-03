'use client';

import { useState } from 'react';
import type { MarketingCopy, GenerationResult } from '@/types';
import { saveMarketingCopy, getSavedMarketingCopies, deleteMarketingCopy, type SavedMarketingCopy } from '@/lib/marketingCopyStorage';

interface MarketingCopyProps {
  copy: MarketingCopy;
  result?: GenerationResult;
  category?: string;
}

const TONE_OPTIONS = [
  { value: 'default', label: '默认' },
  { value: 'premium', label: '高端' },
  { value: 'youth', label: '年轻' },
];

export default function MarketingCopy({ copy, result, category = '服装' }: MarketingCopyProps) {
  const [currentCopy, setCurrentCopy] = useState<MarketingCopy>(copy);
  const [tone, setTone] = useState<string>('default');
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedCopies, setSavedCopies] = useState<SavedMarketingCopy[]>(() => getSavedMarketingCopies());
  const [showSaved, setShowSaved] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleRefresh = async () => {
    if (!result) return;
    setRefreshing(true);
    try {
      const response = await fetch('/api/regenerate-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, tone }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '重新生成失败');
      }

      setCurrentCopy(data.marketingCopy);
      setSaved(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '重新生成失败');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = () => {
    saveMarketingCopy(category, currentCopy);
    setSaved(true);
    setSavedCopies(getSavedMarketingCopies());
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDeleteSaved = (id: string) => {
    deleteMarketingCopy(id);
    setSavedCopies(getSavedMarketingCopies());
  };

  const startEdit = (index: number, text: string) => {
    setEditingIndex(index);
    setEditingText(text);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const confirmEdit = () => {
    if (editingIndex === null || !editingText.trim()) return;

    setCurrentCopy((prev) => {
      const next = { ...prev };
      next.sellingPoints = [...prev.sellingPoints];
      next.sellingPoints[editingIndex] = editingText.trim();
      return next;
    });

    setEditingIndex(null);
    setEditingText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">📢 营销文案</h3>
        <div className="flex items-center gap-2">
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            disabled={refreshing || !result}
            className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            {TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing || !result}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
          >
            {refreshing ? '生成中...' : '🔄 换一换'}
          </button>
          <button
            onClick={handleSave}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {saved ? '已收藏' : '⭐ 收藏'}
          </button>
          <button
            onClick={() => setShowSaved((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            {showSaved ? '隐藏收藏' : `收藏夹 (${savedCopies.length})`}
          </button>
        </div>
      </div>

      {showSaved && (
        <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-200">已收藏文案</h4>
          {savedCopies.length === 0 ? (
            <p className="text-xs text-slate-500">暂无收藏的文案</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {savedCopies.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">{item.category}</span>
                    <button
                      onClick={() => handleDeleteSaved(item.id)}
                      className="text-xs text-slate-500 hover:text-red-400"
                    >
                      删除
                    </button>
                  </div>
                  <p className="text-sm text-slate-200">{item.copy.title}</p>
                  <ul className="mt-1 space-y-0.5">
                    {item.copy.sellingPoints.slice(0, 3).map((point, i) => (
                      <li key={i} className="text-xs text-slate-400 truncate">
                        {i + 1}. {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-cyan-400 mb-2">商品标题</h4>
          <p className="text-white">{currentCopy.title}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-cyan-400 mb-2">核心卖点</h4>
          <ul className="space-y-2">
            {currentCopy.sellingPoints.map((point, i) => (
              <li key={i} className="text-slate-300 flex items-start gap-2 group">
                <span className="text-cyan-400 flex-shrink-0">{i + 1}.</span>
                {editingIndex === i ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-600 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                      autoFocus
                    />
                    <button
                      onClick={confirmEdit}
                      className="text-xs px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white"
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1">{point}</span>
                    <button
                      onClick={() => startEdit(i, point)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-slate-500 hover:text-cyan-400 transition-opacity"
                    >
                      编辑
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-cyan-400 mb-2">🎬 抖音短视频口播稿</h4>
          <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300 whitespace-pre-wrap">
            {currentCopy.tiktokScript}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-cyan-400 mb-2">📄 商品详情页文案</h4>
          <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300 whitespace-pre-wrap">
            {currentCopy.detailPageCopy}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-cyan-400 mb-2">🎤 直播间话术</h4>
          <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300 whitespace-pre-wrap">
            {currentCopy.liveScript}
          </div>
        </div>
      </div>
    </div>
  );
}
