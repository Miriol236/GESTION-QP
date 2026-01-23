import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface ConfirmRejetDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (motif: string) => void;
  itemName?: string;
}

export default function ConfirmRejetDialog({
  open,
  onClose,
  onConfirm,
  itemName,
}: ConfirmRejetDialogProps) {
  const [motif, setMotif] = useState("");

  const handleConfirm = () => {
    if (!motif.trim()) {
      alert("Veuillez saisir un motif de rejet."); // simple validation
      return;
    }
    onConfirm(motif);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Confirmer le rejet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p>
            Êtes-vous sûr de vouloir rejeter{" "}
            <span className="font-semibold text-foreground">
              {itemName ?? "cet élément"}
            </span>
            ?
          </p>

          {/* Champ texte pour le motif */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Motif du rejet *
            </label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Saisissez le motif ici"
              className="w-full border rounded px-2 py-1 resize-none"
              rows={5} // nombre de lignes visibles
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Non
            </Button>
            <Button
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={handleConfirm}
            >
              Valider
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}