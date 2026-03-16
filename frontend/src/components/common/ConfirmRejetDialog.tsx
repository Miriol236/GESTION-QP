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
      alert("Veuillez saisir un motif de rejet.");
      return;
    }
    onConfirm(motif);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card dark:bg-card border-border dark:border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Confirmer le rejet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground dark:text-muted-foreground">
            Êtes-vous sûr de vouloir rejeter{" "}
            <span className="font-semibold text-foreground dark:text-foreground">
              {itemName ?? "cet élément"}
            </span>
            ?
          </p>

          {/* Champ texte pour le motif */}
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">
              Motif du rejet *
            </label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Saisissez le motif ici"
              className="w-full border border-border dark:border-border rounded px-2 py-1 resize-none bg-card dark:bg-card text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={5}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-border dark:border-border hover:bg-muted dark:hover:bg-muted/20"
            >
              Non
            </Button>
            <Button
              className="bg-primary hover:bg-primary-dark text-primary-foreground"
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