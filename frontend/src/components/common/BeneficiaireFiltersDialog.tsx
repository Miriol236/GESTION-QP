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
  const [tempType, setTempType] = useState(selectedType);
  const [searchType, setSearchType] = useState("");

  useEffect(() => {
    if (open) {
      setTempType(selectedType);
      setSearchType("");
    }
  }, [open, selectedType]);

  const handleApply = () => {
    onApply({ type: tempType });
    setOpen(false);
  };

  const isApplyDisabled = !tempType;

  // Fonction utilitaire pour Select avec recherche et scroll
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
      <Select
        value={value?.[optionValue] ?? ""}
        onValueChange={(v) => onChange(options.find((o) => o[optionValue] === v) ?? null)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Par défaut" />
        </SelectTrigger>
        <SelectContent className="w-full">
          <div className="p-2">
            <Input
              placeholder="Rechercher..."
              value={searchValue}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm"
            />
          </div>
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