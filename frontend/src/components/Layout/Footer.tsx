import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-muted/40 py-4 text-center text-sm text-muted-foreground">
      © {year} Développé par Office National d’Informatique — Tous droits réservés.
    </footer>
  );
}
