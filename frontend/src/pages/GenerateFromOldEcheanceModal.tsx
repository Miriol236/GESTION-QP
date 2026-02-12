import { useEffect, useState } from "react";
import axios from "axios";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { API_URL } from "@/config/api";
import { toast } from "@/components/ui/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onGenerate: (echeanceCode: string) => void;
}

export default function GenerateFromOldEcheanceModal({
  open,
  onClose,
  onGenerate,
}: Props) {
  const [echeances, setEcheances] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeEcheance, setActiveEcheance] = useState(null);

  const fetchActiveEcheance = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/echeance/active`, {
          headers: { Authorization: `Bearer ${token}` },
      });
      setActiveEcheance(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement de l'échéance :", error);
    }
  };

  useEffect(() => {
    if (open) {
      setSelected(null); 
    }
  }, [open]);

  useEffect(() => {
    // Chargement initial
    fetchActiveEcheance();

    //  Actualisation lors d'un changement d'échéance
    const handleEcheanceUpdate = () => {
      fetchActiveEcheance();
    };

    window.addEventListener("echeanceUpdated", handleEcheanceUpdate);

    return () => {
      window.removeEventListener("echeanceUpdated", handleEcheanceUpdate);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const token = localStorage.getItem("token");

    setLoading(true);

    axios
        .get(`${API_URL}/echeances-anciennes`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        })
        .then((res) => {
        setEcheances(res.data);
        })
        .catch((err) => {
        console.error("Erreur chargement échéances :", err);
        })
        .finally(() => {
        setLoading(false);
        });
    }, [open]);

  const handleGenerate = () => {
    if (!selected) {
      toast({
        title: "Sélection obligatoire",
        description: "Veuillez sélectionner une ancienne échéance avant de générer.",
        variant: "destructive", // pour le style d'erreur
      });
      return;
    }
    onGenerate(selected);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            <p
              className="text-xl sm:text-sm  break-words"
            >
              Générer les paiements du 
              {activeEcheance && (
                <span className="ml-1 text-green-600 font-medium">
                   {activeEcheance.ECH_LIBELLE}
                </span>
              )}  à partir d’une ancienne échéance
            </p>
          </DialogTitle>
        </DialogHeader>

        {/* CONTENU */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une ancienne échéance" />
              </SelectTrigger>
              <SelectContent>
                {echeances.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Aucune échéance disponible
                  </div>
                )}
                {echeances.map((e) => (
                  <SelectItem key={e.ECH_CODE} value={e.ECH_CODE}>
                    {e.ECH_LIBELLE}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selected || loading}
            className={`gap-2 bg-sky-600 hover:bg-sky-700 text-white ${!selected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
            <Zap className="h-4 w-4" />
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}