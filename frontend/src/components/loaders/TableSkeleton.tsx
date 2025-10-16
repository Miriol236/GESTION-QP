export function TableSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-primary">
          QP
        </div>
      </div>
      <p className="mt-4 text-muted-foreground text-sm">Chargement...</p>
    </div>
  );
}
