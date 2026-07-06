'use client';

import type { TechPackSizeRow } from '@/types/techpack';

interface SizeChartProps {
  rows: TechPackSizeRow[];
}

export default function SizeChart({ rows }: SizeChartProps) {
  if (!rows || rows.length === 0) return <p className="text-sm text-slate-400">暂无尺码数据</p>;

  const measurementKeys = Object.keys(rows[0].measurements);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">尺码</th>
            {measurementKeys.map((key) => (
              <th key={key} className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.size} className="even:bg-slate-50">
              <td className="border border-slate-300 px-3 py-2 font-medium text-slate-800">{row.size}</td>
              {measurementKeys.map((key) => (
                <td key={key} className="border border-slate-300 px-3 py-2 text-slate-700">{row.measurements[key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
