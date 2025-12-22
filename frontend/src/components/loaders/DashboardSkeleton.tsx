import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* ===== Header ===== */}
      <div className="space-y-2">
        <div className="h-7 w-1/2 sm:w-1/3 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 w-1/3 sm:w-1/4 bg-muted rounded-md animate-pulse" />
      </div>

      {/* ===== Cartes statistiques ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="border rounded-xl p-4 space-y-3 shadow-sm"
          >
            <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse" />
            <div className="h-8 w-2/3 bg-muted rounded-lg animate-pulse" />
            <div className="h-3 w-1/3 bg-muted rounded-md animate-pulse" />
          </div>
        ))}
      </div>

      {/* ===== Charts ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie */}
        <div className="border rounded-xl p-4 h-[320px] space-y-4">
          <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse" />
          <div className="h-full bg-muted/60 rounded-lg animate-pulse" />
        </div>

        {/* Bar */}
        <div className="border rounded-xl p-4 h-[320px] space-y-4">
          <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse" />
          <div className="h-full bg-muted/60 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* ===== Tableau / Liste ===== */}
      <div className="border rounded-xl p-4 space-y-3">
        <div className="h-4 w-1/3 bg-muted rounded-md animate-pulse" />

        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-3 border-b last:border-0"
          >
            <div className="space-y-2">
              <div className="h-3 w-40 bg-muted rounded-md animate-pulse" />
              <div className="h-2 w-24 bg-muted rounded-md animate-pulse" />
            </div>

            <div className="h-3 w-20 bg-muted rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
