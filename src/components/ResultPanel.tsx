'use client';

import type { GenerationResult, ParsedRequirement } from '@/types';
import FabricRecommendation from './FabricRecommendation';
import StyleDesign from './StyleDesign';
import CostTable from './CostTable';
import MarketingCopy from './MarketingCopy';
import RiskWarnings from './RiskWarnings';
import ExportButton from './ExportButton';
import ImageGenerator from './ImageGenerator';
import ShareButton from './ShareButton';

interface ResultPanelProps {
  result: GenerationResult | null;
}

export default function ResultPanel({ result }: ResultPanelProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
        <div className="text-6xl mb-4">🧥</div>
        <p className="text-lg">输入需求后，研发方案将在此展示</p>
        <p className="text-sm mt-2">支持自然语言和结构化表单两种输入方式</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-500/30 p-5">
        <h2 className="text-xl font-bold text-white mb-3">📋 研发方案总览</h2>
        <p className="text-slate-300">{result.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded bg-blue-600/30 text-blue-300 text-xs">
            {result.parsedRequirement.category}
          </span>
          <span className="px-2 py-1 rounded bg-cyan-600/30 text-cyan-300 text-xs">
            {result.parsedRequirement.gender}
          </span>
          <span className="px-2 py-1 rounded bg-emerald-600/30 text-emerald-300 text-xs">
            {result.parsedRequirement.targetPrice}元
          </span>
          <span className="px-2 py-1 rounded bg-purple-600/30 text-purple-300 text-xs">
            {result.parsedRequirement.orderQuantity}件
          </span>
        </div>
      </div>

      <ImageGenerator result={result} />

      <ShareButton result={result} />

      <RequireAnalysis requirement={result.parsedRequirement} />
      <FabricRecommendation fabricScores={result.fabricRecommendations} />
      <StyleDesign style={result.selectedStyle} />
      <CostTable cost={result.costResult} />
      <MarketingCopy copy={result.marketingCopy} result={result} category={result.parsedRequirement.category} />
      <RiskWarnings warnings={result.riskWarnings} />
      <ExportButton result={result} />
    </div>
  );
}

function RequireAnalysis({ requirement }: { requirement: ParsedRequirement }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-100">🔍 需求解析</h3>
      <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">产品品类</div>
            <div className="text-sm text-white font-semibold">{requirement.category}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">目标人群</div>
            <div className="text-sm text-white">{requirement.ageRange}{requirement.gender}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">使用场景</div>
            <div className="text-sm text-white">{requirement.scenes.join('、')}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">季节</div>
            <div className="text-sm text-white">{requirement.season}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">价格带 / 订单量</div>
            <div className="text-sm text-white">{requirement.targetPrice}元 / {requirement.orderQuantity}件</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">风格定位</div>
            <div className="text-sm text-white">{requirement.stylePositioning}</div>
          </div>
        </div>

        <div className="mt-3 bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">功能优先级</div>
          <div className="flex flex-wrap gap-2">
            {requirement.functionPriorities.map((func, i) => (
              <span key={func} className="px-2 py-1 bg-cyan-600/20 text-cyan-300 rounded text-xs">
                {i + 1}. {func}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">小单快反要求</div>
          <div className={`text-sm ${requirement.quickResponseRequired ? 'text-green-400' : 'text-slate-300'}`}>
            {requirement.quickResponseRequired ? '优先现货面料，避免复杂工艺' : '常规订单要求'}
          </div>
        </div>

        {requirement.constraints.length > 0 && (
          <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
            <div className="text-xs text-yellow-400 mb-1">系统备注</div>
            <ul className="space-y-1">
              {requirement.constraints.map((c, i) => (
                <li key={i} className="text-sm text-yellow-200/80">{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
