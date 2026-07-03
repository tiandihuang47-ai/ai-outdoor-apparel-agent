'use client';

import type { FabricScore } from '@/types';

interface FabricRecommendationProps {
  fabricScores: FabricScore[];
}

export default function FabricRecommendation({ fabricScores }: FabricRecommendationProps) {
  const labels = ['方案A：成本优先', '方案B：性能均衡', '方案C：高性能方案'];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-100">🧵 面料推荐</h3>
      {fabricScores.map((fs, i) => {
        const f = fs.fabric;
        const label = i < labels.length ? labels[i] : `方案${i + 1}`;
        return (
          <div
            key={f.id}
            className={`rounded-xl border p-5 ${
              i === 0
                ? 'border-blue-500/50 bg-blue-500/5'
                : 'border-slate-600 bg-slate-800/50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'
                }`}>
                  {label}
                </span>
                <h4 className="text-base font-semibold text-white mt-2">{f.name}</h4>
              </div>
              <span className="text-sm text-slate-400">评分：{fs.totalScore.toFixed(0)}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="bg-slate-800 rounded-lg p-2">
                <div className="text-xs text-slate-400">面料结构</div>
                <div className="text-sm text-white">{f.structure}</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2">
                <div className="text-xs text-slate-400">成分/克重</div>
                <div className="text-sm text-white">{f.composition.split('%')[0]} / {f.weightGsm}g</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2">
                <div className="text-xs text-slate-400">米价</div>
                <div className="text-sm text-white font-semibold">{f.pricePerMeter}元/米</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2">
                <div className="text-xs text-slate-400">现货状态</div>
                <div className={`text-sm font-semibold ${f.stockStatus === '现货' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {f.stockStatus}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="bg-slate-800 rounded-lg p-2">
                <div className="text-xs text-slate-400">静水压</div>
                <div className="text-sm text-white">{f.hydrostaticHead}mm</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2">
                <div className="text-xs text-slate-400">透湿率</div>
                <div className="text-sm text-white">{f.breathability}g/㎡·24h</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2">
                <div className="text-xs text-slate-400">防泼水</div>
                <div className="text-sm text-white">{f.waterRepellent}</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2">
                <div className="text-xs text-slate-400">弹力</div>
                <div className="text-sm text-white">{f.elasticity}</div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-3">
              <div className="text-center">
                <div className="text-xs text-slate-400">场景</div>
                <div className="text-sm text-white font-semibold">{fs.sceneScore}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">功能</div>
                <div className="text-sm text-white font-semibold">{fs.functionScore}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">价格</div>
                <div className="text-sm text-white font-semibold">{fs.priceScore}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">快反</div>
                <div className="text-sm text-white font-semibold">{fs.quickResponseScore}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">季节</div>
                <div className="text-sm text-white font-semibold">{fs.seasonScore}</div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3 mt-3">
              <div className="text-xs text-slate-400 mb-1">推荐理由</div>
              <div className="text-sm text-slate-300">{fs.recommendationReason}</div>
            </div>

            <div className="flex items-start gap-2 mt-2">
              <span className="text-yellow-400 text-sm flex-shrink-0">⚠️</span>
              <span className="text-sm text-yellow-200/80">{f.riskNotes}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
