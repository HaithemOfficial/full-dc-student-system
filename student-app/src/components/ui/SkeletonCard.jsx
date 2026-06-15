export function SkeletonLine({ className = '' }) {
  return <div className={`bg-gray-200 rounded-full animate-pulse ${className}`} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-5 space-y-3 ${className}`}>
      <SkeletonLine className="h-4 w-2/5" />
      <SkeletonLine className="h-3 w-3/4" />
      <SkeletonLine className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
