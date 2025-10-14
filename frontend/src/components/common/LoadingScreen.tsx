import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-primary-light via-background to-secondary animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Chargement...
        </h1>
      </div>
      <p className="text-sm text-muted-foreground">Veuillez patienter</p>
    </div>
  );
}