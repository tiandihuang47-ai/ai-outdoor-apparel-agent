'use client';

import type { CostResult } from '@/types';

interface CostTableProps {
  cost: CostResult;
}

export default function CostTable({ cost }: CostTableProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-100">💰 BOM成本核算</h3>
      <div className="rounded-xl border border-slate-600 bg-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/50 text-left">
                <th className="p-3 text-slate-300 font-medium">项目</th>
                <th className="p-3 text-slate-300 font-medium text-right">用量</th>
                <th className="p-3 text-slate-300 font-medium text-right">单价</th>
                <th className="p-3 text-slate-300 font-medium text-right">小计</th>
                <th className="p-3 text-slate-300 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              {cost.bomItems.map((item, i) => (
                <tr key={i} className={`border-t border-slate-700/50 ${i % 2 === 0 ? 'bg-slate-800/30' : ''}`}>
                  <td className="p-3 text-white">{item.name}</td>
                  <td className="p-3 text-slate-300 text-right">{item.usage}</td>
                  <td className="p-3 text-slate-300 text-right">
                    {item.unitPrice > 0 ? `${item.unitPrice}元` : '-'}
                  </td>
                  <td className="p-3 text-white text-right font-mono">{item.subtotal}元</td>
                  <td className="p-3 text-slate-400 text-xs">{item.note}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-500 bg-slate-700/30">
                <td className="p-3 text-white font-semibold">合计</td>
                <td className="p-3"></td>
                <td className="p-3"></td>
                <td className="p-3 text-white font-bold text-right font-mono">{cost.estimatedUnitCost}元</td>
                <td className="p-3 text-slate-400 text-xs">单件成本</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400">基础成本</div>
          <div className="text-lg font-bold text-white">{cost.baseCost}元</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400">损耗成本</div>
          <div className="text-lg font-bold text-white">{cost.lossCost}元</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400">打样制版摊销</div>
          <div className="text-lg font-bold text-white">{cost.samplePatternAmortization}元</div>
        </div>
        <div className={`rounded-lg p-3 text-center ${cost.costRate > 45 ? 'bg-red-900/30' : 'bg-green-900/20'}`}>
          <div className="text-xs text-slate-400">成本率</div>
          <div className={`text-lg font-bold ${cost.costRate > 45 ? 'text-red-400' : 'text-green-400'}`}>
            {cost.costRate}%
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-500/30 p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-center">
            <div className="text-xs text-slate-400">预计单件成本</div>
            <div className="text-2xl font-bold text-white">{cost.estimatedUnitCost}元</div>
          </div>
          <div className="text-slate-500 text-xl">→</div>
          <div className="text-center">
            <div className="text-xs text-slate-400">成本区间</div>
            <div className="text-2xl font-bold text-cyan-400">
              {cost.costRangeLow} - {cost.costRangeHigh}元
            </div>
          </div>
          <div className="text-slate-500 text-xl">→</div>
          <div className="text-center">
            <div className="text-xs text-slate-400">零售价</div>
            <div className="text-2xl font-bold text-white">{cost.retailPrice}元</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">工费系数</div>
            <div className="text-lg font-semibold text-yellow-400">{cost.laborMultiplier}x</div>
            <div className="text-xs text-slate-400">{cost.laborMultiplierNote}</div>
          </div>
        </div>
      </div>

      {cost.costWarnings.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="text-sm font-semibold text-yellow-400 mb-2">⚠️ 成本提醒</div>
          <ul className="space-y-1">
            {cost.costWarnings.map((w, i) => (
              <li key={i} className="text-sm text-yellow-200/80">{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
