'use client';

import type { TechPackPackaging } from '@/types/techpack';

interface PackagingNotesProps {
  packaging: TechPackPackaging;
}

export default function PackagingNotes({ packaging }: PackagingNotesProps) {
  const items = [
    { label: '吊牌', value: packaging.hangtag },
    { label: '洗水标', value: packaging.washingLabel },
    { label: '包装袋', value: packaging.polybag },
    { label: '外箱', value: packaging.carton },
    { label: '特殊说明', value: packaging.specialNotes },
  ];

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[80px_1fr] gap-2 text-sm">
          <span className="text-slate-500">{item.label}</span>
          <span className="text-slate-800">{item.value || '-'}</span>
        </div>
      ))}
    </div>
  );
}
