'use client';

import type { TechPackColorway } from '@/types/techpack';

interface ColorwaySwatchesProps {
  colorways: TechPackColorway[];
}

export default function ColorwaySwatches({ colorways }: ColorwaySwatchesProps) {
  if (!colorways || colorways.length === 0) return <p className="text-sm text-slate-400">暂无配色数据</p>;

  return (
    <div className="flex flex-wrap gap-4">
      {colorways.map((color, index) => (
        <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white">
          <div
            className="w-10 h-10 rounded-full border border-slate-300"
            style={{ backgroundColor: color.hex }}
            title={color.hex}
          />
          <div>
            <div className="font-medium text-slate-800 text-sm">{color.name}</div>
            <div className="text-xs text-slate-500">{color.usage} · {color.fabricPart}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
