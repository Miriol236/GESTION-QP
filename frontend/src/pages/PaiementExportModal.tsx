import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config/api";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { FileText, FileSpreadsheet } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

interface Echeance {
  ECH_CODE: string;
  ECH_LIBELLE: string;
}

interface Type {
  TYP_CODE: string;
  TYP_LIBELLE: string;
}

interface Regie {
  REG_CODE: string;
  REG_LIBELLE: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedType: Type | null; // Type filtré depuis le parent, facultatif
  echeances: Echeance[];     // Liste des échéances disponibles
  selectedRegie: Regie | null;
  regies: Regie[];             // liste complète des régies
  userSansRegie: boolean;       // true si l'utilisateur n'a pas de régie
  onRegieChange?: (regie: Regie | null) => void; // callback pour changer la régie
}

export default function PaiementExportModal({
  open,
  onOpenChange,
  selectedType,
  echeances,
  selectedRegie,
  regies,
  userSansRegie,
  onRegieChange,
}: Props) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedEcheance, setSelectedEcheance] = useState<Echeance | null>(null);

  // Fake progress animation
  useEffect(() => {
    let interval: number | undefined;
    if (isLoading) {
      interval = window.setInterval(() => {
        setProgress((p) => Math.min(p + Math.floor(Math.random() * 5), 95));
      }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Debug
//   useEffect(() => {
//     console.log("Échéance sélectionnée :", selectedEcheance?.ECH_CODE);
//     console.log("Type sélectionné :", selectedType?.TYP_CODE);
//   }, [selectedEcheance, selectedType]);

  const handleExport = async (format: "pdf" | "excel") => {
    if (!selectedEcheance) return;

    setIsLoading(true);
    setProgress(0);

    try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/paiements-export`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
            ech_code: selectedEcheance.ECH_CODE,
            typ_code: selectedType?.TYP_CODE,
            reg_code: selectedRegie?.REG_CODE,
            format,
        },
        responseType: "blob",
        withCredentials: true,
        onDownloadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
        });

        const blob = new Blob([response.data], {
        type:
            format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const echSlug = selectedEcheance.ECH_LIBELLE.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase();
        const regSlug = selectedRegie?.REG_LIBELLE
        ? selectedRegie.REG_LIBELLE.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()
        : "TOUTES_LES_REGIES";

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = `PAIEMENTS_QP_${echSlug}_${regSlug}.${format === "pdf" ? "pdf" : "xlsx"}`;
        link.click();

        toast({
        title: "Export terminé",
        description: `Le fichier ${format.toUpperCase()} a été téléchargé.`,
        variant: "success",
        });
    } catch (err: any) {
        toast({
        title: "Erreur",
        description: err.response?.data?.message || "Impossible d'exporter ou aucun paiement.",
        variant: "destructive",
        });
    } finally {
        setIsLoading(false);
        setProgress(100);
        setTimeout(() => setProgress(0), 500);
    }
    };

    const DEFAULT_REGIE = "__ALL__";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg space-y-4">
        <h2 className="text-lg font-bold">Exporter les paiements</h2>

        {/* Affichage du type filtré */}
        {selectedType ? (
          <p className="text-sm text-gray-700">
            Type sélectionné : <span className="font-medium">{selectedType.TYP_LIBELLE}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500">Tous les types seront exportés</p>
        )}

        {/* Sélection de l'échéance */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Échéance <span className="text-red-500">*</span>
          </label>
            <Select
                value={selectedEcheance?.ECH_CODE || ""}
                onValueChange={(val) =>
                    setSelectedEcheance(echeances.find((e) => e.ECH_CODE === val) || null)
                }
                >
                <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une échéance" />
                </SelectTrigger>

                <SelectContent>
                    <Command>
                    <CommandInput placeholder="Rechercher une échéance..." />
                    <CommandGroup>
                        {echeances.map((e) => (
                        <SelectItem key={e.ECH_CODE} value={e.ECH_CODE}>
                            {e.ECH_LIBELLE}
                        </SelectItem>
                        ))}
                    </CommandGroup>
                    </Command>
                </SelectContent>
            </Select>
        </div>

        {userSansRegie && (
            <div className="space-y-1">
                <label className="block text-sm font-medium">
                Régie
                </label>

                <Select
                    value={selectedRegie?.REG_CODE ?? DEFAULT_REGIE}
                    onValueChange={(val) => {
                        if (val === DEFAULT_REGIE) return onRegieChange?.(null);
                        onRegieChange?.(regies.find((r) => r.REG_CODE === val) ?? null);
                    }}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Par défaut" />
                    </SelectTrigger>

                    <SelectContent>
                        <Command>
                        <CommandInput placeholder="Rechercher une régie..." />
                        <CommandGroup>
                            <SelectItem value={DEFAULT_REGIE}>-- Par défaut --</SelectItem>
                            {regies.map((r) => (
                            <SelectItem key={r.REG_CODE} value={r.REG_CODE}>
                                {r.REG_LIBELLE}
                            </SelectItem>
                            ))}
                        </CommandGroup>
                        </Command>
                    </SelectContent>
                </Select>
            </div>
        )}

        {/* Boutons export (activés uniquement si échéance sélectionnée) */}
        {selectedEcheance && (
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => handleExport("pdf")}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              disabled={isLoading}
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
            <Button
              onClick={() => handleExport("excel")}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              disabled={isLoading}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
          </div>
        )}

        {/* Progress Bar */}
        {isLoading && (
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mt-2">
            <div
              className="h-4 bg-blue-500 text-white text-xs font-medium text-center"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}