'use client';

import type { TechPackConstructionNote } from '@/types/techpack';

interface ConstructionListProps {
  notes: TechPackConstructionNote[];
}

const priorityLabels = {
  required: { text: '必须', class: 'bg-red-100 text-red-700' },
  recommended: { text: '建议', class: 'bg-yellow-100 text-yellow-700' },
  optional: { text: '可选', class: 'bg-blue-100 text-blue-700' },
};

export default function ConstructionList({ notes }: ConstructionListProps) {
  if (!notes || notes.length === 0) return <p className="text-sm text-slate-400">暂无工艺要求</p>;

  return (
    <ul className="space-y-2">
      {notes.map((note, index) => (
        <li key={index} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
          <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${priorityLabels[note.priority].class}`}>
            {priorityLabels[note.priority].text}
          </span>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{note.title}</div>
            <div className="text-sm text-slate-600 mt-0.5">{note.description}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
