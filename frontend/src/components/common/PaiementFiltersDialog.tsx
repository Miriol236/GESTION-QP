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
import { Input } from "@/components/ui/input";
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

  const [tempEcheance, setTempEcheance] = useState(selectedEcheance);
  const [tempRegie, setTempRegie] = useState(selectedRegie);
  const [tempStatut, setTempStatut] = useState(selectedStatut);
  const [tempType, setTempType] = useState(selectedType);

  // Etats pour la recherche dans chaque comboBox
  const [searchEcheance, setSearchEcheance] = useState("");
  const [searchRegie, setSearchRegie] = useState("");
  const [searchStatut, setSearchStatut] = useState("");
  const [searchType, setSearchType] = useState("");

  useEffect(() => {
    if (open) {
      setTempEcheance(selectedEcheance);
      setTempRegie(selectedRegie);
      setTempStatut(selectedStatut);
      setTempType(selectedType);

      setSearchEcheance("");
      setSearchRegie("");
      setSearchStatut("");
      setSearchType("");
    }
  }, [open, selectedEcheance, selectedRegie, selectedStatut, selectedType]);

  const handleApply = () => {
    onApply({
      echeance: tempEcheance,
      regie: tempRegie,
      statut: tempStatut,
      type: tempType,
    });
    setOpen(false);
  };

  const isApplyDisabled =
    !tempEcheance &&
    !tempRegie &&
    (tempStatut === null || tempStatut === undefined) &&
    !tempType;

  // Fonction utilitaire pour rendre chaque Select avec recherche et scroll
  const renderSelect = (
    label: string,
    value: any,
    onChange: (v: any) => void,
    options: any[],
    optionLabel: string,
    optionValue: string,
    searchValue: string,
    setSearch: (v: string) => void
  ) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {value && (
          <button onClick={() => onChange(null)} className="text-red-500 hover:text-red-600">
            <X size={16} />
          </button>
        )}
      </div>
      <Select value={value?.[optionValue] ?? ""} onValueChange={(v) => onChange(options.find((o) => o[optionValue] === v) ?? null)}>
        <SelectTrigger>
          <SelectValue placeholder="Par défaut" />
        </SelectTrigger>
        <SelectContent className="w-full">
          {/* Recherche */}
          <div className="p-2">
            <Input
              placeholder="Rechercher..."
              value={searchValue}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm"
            />
          </div>
          {/* Liste avec scrollbar */}
          <div className="max-h-60 overflow-auto">
            {options
              .filter((o) => o[optionLabel].toLowerCase().includes(searchValue.toLowerCase()))
              .map((o) => (
                <SelectItem key={o[optionValue]} value={o[optionValue]}>
                  {o[optionLabel]}
                </SelectItem>
              ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Filter className="h-4 w-4 mr-2" />
          Filtrer
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Filtres</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {renderSelect(
            "Échéance",
            tempEcheance,
            setTempEcheance,
            echeances,
            "ECH_LIBELLE",
            "ECH_CODE",
            searchEcheance,
            setSearchEcheance
          )}

          {showRegie &&
            renderSelect(
              "Régie",
              tempRegie,
              setTempRegie,
              regies ?? [],
              "REG_SIGLE",
              "REG_CODE",
              searchRegie,
              setSearchRegie
            )}

          {renderSelect(
            "Statut",
            tempStatut !== null ? { value: tempStatut, label: statuts.find((s) => s.value === tempStatut)?.label ?? "" } : null,
            (v) => setTempStatut(v ? v.value : null),
            statuts,
            "label",
            "value",
            searchStatut,
            setSearchStatut
          )}

          {renderSelect(
            "Type bénéficiaire",
            tempType,
            setTempType,
            types,
            "TYP_LIBELLE",
            "TYP_CODE",
            searchType,
            setSearchType
          )}
        </div>

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