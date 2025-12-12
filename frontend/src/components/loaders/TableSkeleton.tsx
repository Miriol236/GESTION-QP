export function TableSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 sm:px-6">
      <div className="relative">
        {/* Spinner responsive */}
        <div className="animate-spin rounded-full border-t-4 border-primary h-12 w-12 sm:h-16 sm:w-16"></div>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-primary text-lg sm:text-2xl">
          QP
        </div>
      </div>
      <p className="mt-4 text-muted-foreground text-sm sm:text-base text-center">
        Chargement...
      </p>
    </div>
  );
}