interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

export default function SkeletonLoader({
  lines = 3,
  className,
}: SkeletonLoaderProps) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-700/50 rounded animate-pulse mb-3 last:mb-0"
          style={{ width: `${100 - (i % 3) * 15}%` }}
        />
      ))}
    </div>
  );
}
