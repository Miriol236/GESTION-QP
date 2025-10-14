import React from "react";

export default function UserSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Titre & sous-titre */}
      <div className="h-8 w-1/3 bg-muted rounded-lg animate-pulse" />
      <div className="h-4 w-1/4 bg-muted rounded-md animate-pulse" />

      {/* Tableau simulé */}
      <div className="mt-6 space-y-2 border rounded-lg p-4 shadow-sm">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b last:border-0 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-32 bg-muted rounded-md animate-pulse" />
                <div className="h-2 w-20 bg-muted rounded-md animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-3 w-16 bg-muted rounded-md animate-pulse" />
              <div className="h-3 w-12 bg-muted rounded-md animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded-md animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}