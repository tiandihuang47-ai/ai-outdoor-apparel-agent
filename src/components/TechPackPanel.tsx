'use client';

import type { TechPack } from '@/types/techpack';
import SizeChart from './SizeChart';
import BomTable from './BomTable';
import ConstructionList from './ConstructionList';
import ColorwaySwatches from './ColorwaySwatches';
import PackagingNotes from './PackagingNotes';

interface TechPackPanelProps {
  techPack: TechPack;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-base font-bold text-slate-800 mb-3 pb-1 border-b border-slate-200">{title}</h3>
      {children}
    </section>
  );
}

export default function TechPackPanel({ techPack }: TechPackPanelProps) {
  return (
    <div className="bg-white text-slate-800 rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{techPack.productName}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {techPack.category} · {techPack.gender} · {techPack.season} · {techPack.scenes.join('、')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">目标零售价</div>
          <div className="text-lg font-bold text-slate-900">¥{techPack.targetPrice}</div>
        </div>
      </div>

      <Section title="📏 尺码表">
        <SizeChart rows={techPack.sizeChart} />
      </Section>

      <Section title="🧵 物料清单（BOM）">
        <BomTable items={techPack.bom} />
      </Section>

      <Section title="🔧 工艺要求">
        <ConstructionList notes={techPack.construction} />
      </Section>

      <Section title="🎨 配色方案">
        <ColorwaySwatches colorways={techPack.colorways} />
      </Section>

      <Section title="📦 包装要求">
        <PackagingNotes packaging={techPack.packaging} />
      </Section>

      {techPack.risks.length > 0 && (
        <Section title="⚠️ 风险提示">
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
            {techPack.risks.map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
