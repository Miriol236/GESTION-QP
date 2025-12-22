import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown, Save, X } from "lucide-react";
import { API_URL } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

interface EditDomiciliationModalProps {
  domiciliation: any;
  banques: any[];
  guichets: any[];
  onClose: () => void;
  onUpdate?: () => void;
}

// ComboBox exactement comme dans beneficiaireWizard
const ComboBox = ({ label, items, value, onSelect, display, disabled = false }: any) => {
  const [open, setOpen] = useState(false);
  const selected = items.find(
    (i: any) => i.BNQ_CODE === value || i.GUI_ID === value
  );

  return (
    <div>
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between truncate text-left"
            disabled={disabled}
          >
            {selected ? (
              <span className="truncate max-w-[230px]">{display(selected)}</span>
            ) : (
              <span className="text-muted-foreground">-- Sélectionner --</span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
          </Button>
        </PopoverTrigger>
        {!disabled && (
          <PopoverContent className="p-0 w-full sm:w-[300px]">
            <Command>
              <CommandInput placeholder={`Rechercher ${label.toLowerCase()}...`} />
              <CommandList>
                <CommandEmpty>Aucun résultat</CommandEmpty>
                <CommandGroup>
                  {items.map((item: any) => (
                    <CommandItem
                      key={item.BNQ_CODE || item.GUI_ID}
                      onSelect={() => {
                        onSelect(item.BNQ_CODE ?? item.GUI_ID);
                        setTimeout(() => setOpen(false), 100);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          value === (item.BNQ_CODE ?? item.GUI_ID)
                            ? "opacity-100 text-blue-600"
                            : "opacity-0"
                        }`}
                      />
                      {display(item)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
};

export default function EditDomiciliationModal({
  domiciliation,
  banques,
  guichets,
  onClose,
  onUpdate,
}: EditDomiciliationModalProps) {
  const { toast } = useToast();
  const [current, setCurrent] = useState(domiciliation);
  const [loading, setLoading] = useState(false);

  const calculerCleRib = (BNQ_CODE: string, GUI_ID: string, DOM_NUMCPT: string) => {
    const banque = banques.find(b => String(b.BNQ_CODE).trim() === String(BNQ_CODE).trim());
    const guichet = guichets.find(g => String(g.GUI_ID).trim() === String(GUI_ID).trim());
    if (!banque || !guichet || !DOM_NUMCPT) return "";
    const codeBanque = String(banque.BNQ_CODE || "00000").padStart(5, "0");
    const codeGuichet = String(guichet.GUI_CODE || "00000").padStart(5, "0");
    const numCompte = DOM_NUMCPT.toUpperCase().trim();
    const onlyDigits = numCompte.replace(/\D/g, "");
    if (onlyDigits.length < 11) return "";
    const ribBase = codeBanque + codeGuichet + onlyDigits + "00";
    let reste = 0;
    for (let i = 0; i < ribBase.length; i++) {
      reste = (reste * 10 + Number(ribBase[i])) % 97;
    }
    const cle = 97 - reste;
    return String(cle).padStart(2, "0");
  };

  const handleUpdate = async () => {
    if (!current.BNQ_CODE || !current.GUI_ID || !current.DOM_NUMCPT) {
      return toast({
        title: "Avertissement",
        description: "Tous les champs sont obligatoires.",
        variant: "warning",
      });
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_URL}/domiciliations/${current.DOM_CODE}`, {
        BNQ_CODE: current.BNQ_CODE,
        GUI_ID: current.GUI_ID,
        DOM_NUMCPT: current.DOM_NUMCPT,
        DOM_RIB: calculerCleRib(current.BNQ_CODE, current.GUI_ID, current.DOM_NUMCPT),
      }, { headers });

      toast({ title: "Succès", description: "Domiciliation mise à jour !", variant: "success" });
      if (onUpdate) onUpdate();
      onClose();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Erreur lors de la mise à jour.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ComboBox
          label="Banque *"
          items={banques}
          value={current.BNQ_CODE}
          onSelect={(v: any) => setCurrent({ ...current, BNQ_CODE: v, GUI_ID: "" })}
          display={(b: any) => b.BNQ_LIBELLE}
        />

        <ComboBox
          label="Guichet *"
          items={guichets.filter(g => String(g.BNQ_CODE).trim() === String(current.BNQ_CODE).trim())}
          value={current.GUI_ID}
          onSelect={(v: any) => setCurrent({ ...current, GUI_ID: v })}
          display={(g: any) => `${g.GUI_CODE} - ${g.GUI_NOM || "—"}`}
          disabled={!current.BNQ_CODE}
        />

        <div className="sm:col-span-2">
          <Label>Numéro de compte *</Label>
          <Input
            value={current.DOM_NUMCPT}
            onChange={(e) => {
              const num = e.target.value.replace(/\D/g, "").slice(0, 11);
              setCurrent({ ...current, DOM_NUMCPT: num, DOM_RIB: calculerCleRib(current.BNQ_CODE, current.GUI_ID, num) });
            }}
          />
        </div>

        <div className="sm:col-span-2 flex justify-end gap-2 mt-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-1" /> Annuler
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            <Save className="w-4 h-4 mr-1" /> {loading ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </div>
      </div>
    </div>
  );
}