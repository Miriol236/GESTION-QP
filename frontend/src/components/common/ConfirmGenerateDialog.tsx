import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";

interface ConfirmGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  echCode: string | null;
  echLibelle?: string | null; // <-- optionnel ou string
  activeEcheance: any | null; 
  // onConfirm reçoit un callback pour mettre à jour le pourcentage
  onConfirm: (echCode: string, onProgress?: (percent: number) => void) => Promise<void>;
}

export default function ConfirmGenerateDialog({
  open,
  onClose,
  echCode,
  onConfirm,
  echLibelle,
  activeEcheance,
}: ConfirmGenerateDialogProps) {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!echCode) {
      toast({
        title: "Erreur",
        description: "Aucune échéance sélectionnée.",
        variant: "destructive",
      });
      return; // Très important : stoppe ici l'exécution
    }

    setLoading(true);
    setProgress(0);

    try {
      await onConfirm(echCode, (percent: number) => {
        setProgress(percent);
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération des paiements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>          
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Zap className="w-5 h-5" />
            Confirmer la génération</DialogTitle>
        </DialogHeader>

        <div className="py-4 text-sm text-muted-foreground">
          Voulez-vous vraiment générer les paiements de l’échéance 
          <span className="ml-1 text-green-600 font-medium"> {`(${activeEcheance?.ECH_LIBELLE})`} </span> 
          en cours à partir de l’échéance {" "}
          <span className="ml-1 text-red-600 font-medium"> {`(${echLibelle})`} </span> déjà passée ?
        </div>

        {/* Barre de progression */}
        {loading && (
          <div className="w-full bg-gray-200 rounded h-2 mb-4">
            <div
              className="bg-sky-600 h-2 rounded transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Non
          </Button>
          <Button
            className="bg-sky-600 text-white hover:bg-sky-700"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? `${progress}% Génération…` : "Oui"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}