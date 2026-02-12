import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";

interface Props {
  types: any[];
  selectedType: any | null;
  onApply: (v: { type: any | null }) => void;
  onReset: () => void;
}

export default function BeneficiaireFiltersDialog({
  types,
  selectedType,
  onApply,
  onReset,
}: Props) {
  const [open, setOpen] = useState(false);

  // Etat temporaire pour stocker la sélection dans le modal
  const [tempType, setTempType] = useState(selectedType);

  // Réinitialiser la sélection temporaire à l'ouverture du modal
  useEffect(() => {
    if (open) {
      setTempType(selectedType);
    }
  }, [open, selectedType]);

  // Appliquer et fermer le modal
  const handleApply = () => {
    onApply({ type: tempType });
    setOpen(false);
  };

  // Désactiver le bouton si aucun filtre sélectionné
  const isApplyDisabled = !tempType;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Filter className="h-4 w-4 mr-2" />
          Filtrer
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()} // Bloque le clic à l’extérieur
      >
        <DialogHeader>
          <DialogTitle>Filtres</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* ===== TYPE ===== */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Type bénéficiaire</Label>
              {tempType && (
                <button
                  onClick={() => setTempType(null)}
                  className="text-red-500 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <Select
              value={tempType?.TYP_CODE ?? ""}
              onValueChange={(v) => setTempType(types.find((t) => t.TYP_CODE === v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Par défaut" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.TYP_CODE} value={t.TYP_CODE}>
                    {t.TYP_LIBELLE}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <DialogFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              onReset();
              setTempType(null);
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>

          <Button
            variant="default"
            onClick={handleApply}
            disabled={isApplyDisabled}
            className={isApplyDisabled ? "opacity-50 cursor-not-allowed" : ""}
          >
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}