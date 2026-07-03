'use client';

import type { RiskWarning } from '@/types';

interface RiskWarningsProps {
  warnings: RiskWarning[];
}

export default function RiskWarnings({ warnings }: RiskWarningsProps) {
  const severityColors = {
    '高': 'border-red-500/30 bg-red-500/5 text-red-400',
    '中': 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
    '低': 'border-slate-500/30 bg-slate-500/5 text-slate-400',
  };

  const severityBadgeColors = {
    '高': 'bg-red-600 text-white',
    '中': 'bg-yellow-600 text-white',
    '低': 'bg-slate-600 text-white',
  };

  const categories = [...new Set(warnings.map((w) => w.category))];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-100">⚠️ 风险提醒</h3>
      <div className="space-y-3">
        {categories.map((cat) => {
          const catWarnings = warnings.filter((w) => w.category === cat);
          return (
            <div key={cat} className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">{cat}</h4>
              <div className="space-y-2">
                {catWarnings.map((w, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${severityColors[w.severity]}`}
                  >
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${severityBadgeColors[w.severity]} flex-shrink-0`}>
                      {w.severity}
                    </span>
                    <span className="text-sm">{w.message}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
