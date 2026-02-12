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

type Option = {
  label: string;
  value: any;
};

interface Props {
  echeances: any[];
  regies?: any[];
  types: any[];
  statuts: Option[];
  showRegie: boolean;

  selectedEcheance: any | null;
  selectedRegie: any | null;
  selectedStatut: number | null;
  selectedType: any | null;

  onApply: (v: {
    echeance: any | null;
    regie: any | null;
    statut: number | null;
    type: any | null;
  }) => void;

  onReset: () => void;
}

export default function PaiementFiltersDialog({
  echeances,
  regies,
  types,
  statuts,
  showRegie,
  selectedEcheance,
  selectedRegie,
  selectedStatut,
  selectedType,
  onApply,
  onReset,
}: Props) {
  const [open, setOpen] = useState(false);

  // Etats locaux pour stocker temporairement les sélections
  const [tempEcheance, setTempEcheance] = useState(selectedEcheance);
  const [tempRegie, setTempRegie] = useState(selectedRegie);
  const [tempStatut, setTempStatut] = useState(selectedStatut);
  const [tempType, setTempType] = useState(selectedType);

  // Réinitialiser les états temporaires quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setTempEcheance(selectedEcheance);
      setTempRegie(selectedRegie);
      setTempStatut(selectedStatut);
      setTempType(selectedType);
    }
  }, [open, selectedEcheance, selectedRegie, selectedStatut, selectedType]);

  // Appliquer les filtres et fermer le modal
  const handleApply = () => {
    onApply({
      echeance: tempEcheance,
      regie: tempRegie,
      statut: tempStatut,
      type: tempType,
    });
    setOpen(false);
  };

  // Vérifie si aucun filtre n'est sélectionné
  const isApplyDisabled =
    !tempEcheance &&
    !tempRegie &&
    (tempStatut === null || tempStatut === undefined) &&
    !tempType;

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
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Filtres</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* ===== ÉCHÉANCE ===== */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Échéance</Label>
              {tempEcheance && (
                <button
                  onClick={() => setTempEcheance(null)}
                  className="text-red-500 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <Select
              value={tempEcheance?.ECH_CODE ?? ""}
              onValueChange={(v) =>
                setTempEcheance(echeances.find((e) => e.ECH_CODE === v))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Par défaut" />
              </SelectTrigger>
              <SelectContent>
                {echeances.map((e) => (
                  <SelectItem key={e.ECH_CODE} value={e.ECH_CODE}>
                    {e.ECH_LIBELLE}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ===== RÉGIE ===== */}
          {showRegie && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Régie</Label>
                {tempRegie && (
                  <button
                    onClick={() => setTempRegie(null)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <Select
                value={tempRegie?.REG_CODE ?? ""}
                onValueChange={(v) =>
                  setTempRegie(regies?.find((r) => r.REG_CODE === v) ?? null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Par défaut" />
                </SelectTrigger>
                <SelectContent>
                  {regies?.map((r) => (
                    <SelectItem key={r.REG_CODE} value={r.REG_CODE}>
                      {r.REG_SIGLE}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ===== STATUT ===== */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Statut</Label>
              {tempStatut !== null && (
                <button
                  onClick={() => setTempStatut(null)}
                  className="text-red-500 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <Select
              value={tempStatut?.toString() ?? ""}
              onValueChange={(v) => setTempStatut(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Par défaut" />
              </SelectTrigger>
              <SelectContent>
                {statuts.map((s) => (
                  <SelectItem key={s.value} value={String(s.value)}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              onValueChange={(v) =>
                setTempType(types.find((t) => t.TYP_CODE === v))
              }
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
              setTempEcheance(null);
              setTempRegie(null);
              setTempStatut(null);
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