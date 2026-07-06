'use client';

import type { TechPackBomItem } from '@/types/techpack';

interface BomTableProps {
  items: TechPackBomItem[];
}

export default function BomTable({ items }: BomTableProps) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">暂无物料数据</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">类别</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">名称</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">规格</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">供应商</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">单价</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">用量</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">MOQ</th>
            <th className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">部位</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="even:bg-slate-50">
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.category}</td>
              <td className="border border-slate-300 px-2 py-2 font-medium text-slate-800">{item.name}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.spec}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.supplier}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.unitPrice}元/{item.unit}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.consumptionPerPiece}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.moq}</td>
              <td className="border border-slate-300 px-2 py-2 text-slate-700">{item.position}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
