import React from "react";
import { cn } from "@/lib/utils";

export default function Footer({ className = "" }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "h-12 flex items-center justify-center text-sm text-muted-foreground bg-muted/30",
        className
      )}
    >
      © {year} — Développé par{" "}
      <span className="font-medium text-foreground ml-1">
        Office National d’Informatique
      </span> - Tous droits réservés
    </footer>
  );
}
