export function TableSkeletonWizard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] bg-background">
      <div className="relative">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
        <div className="absolute inset-0 flex items-center justify-center font-semibold text-primary text-xs">
          QP
        </div>
      </div>
      <p className="mt-2 text-muted-foreground text-xs">Chargement...</p>
    </div>
  );
}