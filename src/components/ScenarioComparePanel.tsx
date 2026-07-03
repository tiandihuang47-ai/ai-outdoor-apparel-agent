'use client';

import { useState } from 'react';
import type { GenerationResult, RiskWarning } from '@/types';
import ImageGenerator from './ImageGenerator';
import ShareButton from './ShareButton';

type ExportFeedback =
  | { type: 'idle' }
  | { type: 'loading'; format: 'doc' | 'markdown' }
  | { type: 'success'; format: 'doc' | 'markdown' }
  | { type: 'error'; message: string };

interface Scenario {
  tier: 'basic' | 'mid' | 'premium';
  tierName: string;
  targetPrice: number;
  result: GenerationResult;
}

interface ScenarioComparePanelProps {
  scenarios: Scenario[];
  onReset?: () => void;
}

const TIER_STYLES = {
  basic: {
    badge: 'bg-emerald-600',
    border: 'border-emerald-500/40',
    gradient: 'from-emerald-600 to-teal-500',
    light: 'bg-emerald-900/20',
  },
  mid: {
    badge: 'bg-blue-600',
    border: 'border-blue-500/40',
    gradient: 'from-blue-600 to-cyan-500',
    light: 'bg-blue-900/20',
  },
  premium: {
    badge: 'bg-purple-600',
    border: 'border-purple-500/40',
    gradient: 'from-purple-600 to-pink-500',
    light: 'bg-purple-900/20',
  },
};

function countRisks(warnings: RiskWarning[], severity: string) {
  return warnings.filter((w) => w.severity === severity).length;
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const { result, tierName, targetPrice } = scenario;
  const styles = TIER_STYLES[scenario.tier];
  const [expanded, setExpanded] = useState(false);

  const fabric = result.fabricRecommendations[0]?.fabric;
  const cost = result.costResult;
  const profit = targetPrice - cost.estimatedUnitCost;
  const marginRate = targetPrice > 0 ? ((profit / targetPrice) * 100).toFixed(1) : '0.0';
  const profitText = profit.toFixed(1);
  const unitCostText = cost.estimatedUnitCost.toFixed(1);
  const high = countRisks(result.riskWarnings, '高');
  const medium = countRisks(result.riskWarnings, '中');
  const low = countRisks(result.riskWarnings, '低');

  return (
    <div className={`bg-slate-800 border ${styles.border} rounded-2xl overflow-hidden flex flex-col`}>
      <div className={`bg-gradient-to-r ${styles.gradient} p-4`}>
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-lg">{tierName}</span>
          <span className="text-white/90 text-sm">零售价 {targetPrice}元</span>
        </div>
      </div>

      <div className="p-5 space-y-4 flex-1">
        <div className={`${styles.light} rounded-lg p-3 text-sm text-slate-200`}>
          {result.summary}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">单件成本</div>
            <div className="text-lg font-semibold text-white">{unitCostText}元</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">预计毛利</div>
            <div className={`text-lg font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {profitText}元 ({marginRate}%)
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">成本率</div>
            <div className="text-lg font-semibold text-white">{cost.costRate}%</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">风险提醒</div>
            <div className="text-sm font-medium text-white">
              {high > 0 && <span className="text-red-400 mr-2">{high}高</span>}
              {medium > 0 && <span className="text-orange-400 mr-2">{medium}中</span>}
              {low > 0 && <span className="text-green-400">{low}低</span>}
              {result.riskWarnings.length === 0 && <span className="text-slate-400">无</span>}
            </div>
          </div>
        </div>

        <ImageGenerator result={result} variant="compact" />

        <ShareButton result={result} variant="compact" />

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">推荐面料</span>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="font-medium text-white">{fabric?.name || '-'}</div>
            <div className="text-xs text-slate-400 mt-1">{fabric?.structure} · {fabric?.composition}</div>
            <div className="text-xs text-slate-400">{fabric?.pricePerMeter}元/米 · {fabric?.stockStatus}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-slate-400">款式方案</div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="font-medium text-white">{result.selectedStyle.name}</div>
            <div className="text-xs text-slate-400 mt-1">
              {result.selectedStyle.silhouette} · {result.selectedStyle.process} · {result.selectedStyle.productionDifficulty}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="space-y-4 pt-2 border-t border-slate-700">
            <div>
              <div className="text-sm text-slate-400 mb-2">核心卖点</div>
              <ul className="list-disc list-inside text-sm text-slate-200 space-y-1">
                {result.marketingCopy.sellingPoints.slice(0, 5).map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm text-slate-400 mb-2">面料候选 Top 3</div>
              <div className="space-y-2">
                {result.fabricRecommendations.map((rec, i) => (
                  <div key={i} className="bg-slate-900/50 rounded-lg p-2 text-sm">
                    <span className="text-white">{rec.fabric.name}</span>
                    <span className="text-slate-400 ml-2">{rec.fabric.pricePerMeter}元/米</span>
                    <span className="text-slate-500 ml-2">总分 {rec.totalScore}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-400 mb-2">风险提醒</div>
              {result.riskWarnings.length > 0 ? (
                <div className="space-y-1">
                  {result.riskWarnings.map((w, i) => (
                    <div key={i} className={`text-sm ${w.severity === '高' ? 'text-red-400' : w.severity === '中' ? 'text-orange-400' : 'text-green-400'}`}>
                      [{w.severity}] {w.message}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400">无风险提醒</div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 rounded-lg text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 transition-colors"
        >
          {expanded ? '收起详情' : '查看详情'}
        </button>
      </div>
    </div>
  );
}

export default function ScenarioComparePanel({ scenarios, onReset }: ScenarioComparePanelProps) {
  const [feedback, setFeedback] = useState<ExportFeedback>({ type: 'idle' });

  const handleExport = async (format: 'doc' | 'markdown') => {
    setFeedback({ type: 'loading', format });

    try {
      const response = await fetch(`/api/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarios }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || '导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const category = scenarios[0]?.result.parsedRequirement.category || '服装';
      const dateStr = new Date().toISOString().slice(0, 10);
      const extension = format === 'doc' ? 'doc' : 'md';
      const a = document.createElement('a');
      a.href = url;
      a.download = `多套方案对比_${category}_${dateStr}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

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
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">📊 三套方案对比</h2>
        <div className="flex flex-wrap items-center gap-3">
          <ShareButton scenarios={scenarios} variant="compact" />
          <button
            onClick={() => handleExport('markdown')}
            disabled={isLoading}
            className="text-sm px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2"
          >
            {loadingFormat === 'markdown' ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                导出中...
              </>
            ) : (
              <>📥 Markdown 对比</>
            )}
          </button>
          <button
            onClick={() => handleExport('doc')}
            disabled={isLoading}
            className="text-sm px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2"
          >
            {loadingFormat === 'doc' ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                导出中...
              </>
            ) : (
              <>📝 Word 对比</>
            )}
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              重新生成
            </button>
          )}
        </div>
      </div>

      {feedback.type === 'success' && (
        <div className="text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-500/30 rounded-lg px-4 py-3">
          ✅ {feedback.format === 'doc' ? 'Word' : 'Markdown'} 对比方案导出成功
        </div>
      )}

      {feedback.type === 'error' && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
          ❌ {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.tier} scenario={scenario} />
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">关键指标对比</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-2">指标</th>
                {scenarios.map((s) => (
                  <th key={s.tier} className="py-2">{s.tierName}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-200">
              <tr className="border-b border-slate-700/50">
                <td className="py-2 text-slate-400">零售价</td>
                {scenarios.map((s) => <td key={s.tier} className="py-2">{s.targetPrice}元</td>)}
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-2 text-slate-400">预计单件成本</td>
                {scenarios.map((s) => <td key={s.tier} className="py-2">{s.result.costResult.estimatedUnitCost.toFixed(1)}元</td>)}
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-2 text-slate-400">成本区间</td>
                {scenarios.map((s) => <td key={s.tier} className="py-2">{s.result.costResult.costRangeLow}-{s.result.costResult.costRangeHigh}元</td>)}
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-2 text-slate-400">成本率</td>
                {scenarios.map((s) => <td key={s.tier} className="py-2">{s.result.costResult.costRate}%</td>)}
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-2 text-slate-400">预计毛利</td>
                {scenarios.map((s) => {
                  const profit = s.targetPrice - s.result.costResult.estimatedUnitCost;
                  const rate = s.targetPrice > 0 ? ((profit / s.targetPrice) * 100).toFixed(1) : '0.0';
                  return <td key={s.tier} className={`py-2 ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{profit.toFixed(1)}元 ({rate}%)</td>;
                })}
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-2 text-slate-400">推荐面料</td>
                {scenarios.map((s) => <td key={s.tier} className="py-2">{s.result.fabricRecommendations[0]?.fabric.name}</td>)}
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-2 text-slate-400">款式</td>
                {scenarios.map((s) => <td key={s.tier} className="py-2">{s.result.selectedStyle.name}</td>)}
              </tr>
              <tr>
                <td className="py-2 text-slate-400">高风险提醒</td>
                {scenarios.map((s) => <td key={s.tier} className="py-2">{countRisks(s.result.riskWarnings, '高')}项</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
