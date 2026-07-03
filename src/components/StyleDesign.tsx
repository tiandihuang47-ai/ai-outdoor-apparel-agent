'use client';

import type { StyleTemplate } from '@/types';

interface StyleDesignProps {
  style: StyleTemplate;
}

export default function StyleDesign({ style }: StyleDesignProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-100">👕 款式设计</h3>
      <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-5">
        <h4 className="text-base font-semibold text-white mb-4">{style.name}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">版型</div>
            <div className="text-sm text-white">{style.silhouette}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">衣长</div>
            <div className="text-sm text-white">{style.length}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">帽子结构</div>
            <div className="text-sm text-white">{style.hood}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">门襟结构</div>
            <div className="text-sm text-white">{style.closure}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">口袋结构</div>
            <div className="text-sm text-white">{style.pockets}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">袖口结构</div>
            <div className="text-sm text-white">{style.cuff}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">下摆结构</div>
            <div className="text-sm text-white">{style.hem}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">透气结构</div>
            <div className="text-sm text-white">{style.ventilation}</div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">工艺建议</div>
            <div className="text-sm text-white">{style.process}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">颜色建议</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {style.colorSuggestions.map((color) => (
                <span key={color} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                  {color}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">成本等级 / 生产难度</div>
            <div className="text-sm text-white">
              {style.costLevel} / {style.productionDifficulty}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">设计理由</div>
            <div className="text-sm text-slate-300">{style.designReason}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
