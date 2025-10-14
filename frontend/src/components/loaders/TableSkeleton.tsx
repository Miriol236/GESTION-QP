export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="p-4 space-y-2 border rounded-lg shadow-sm">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
          <div className="h-4 w-1/3 bg-muted rounded-md animate-pulse" />
          <div className="h-4 w-1/4 bg-muted rounded-md animate-pulse" />
        </div>
      ))}
    </div>
  );
}
