import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  itemName,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Confirmer la suppression
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Êtes-vous sûr de vouloir supprimer{" "}
            <span className="font-semibold text-foreground">
              {itemName ?? "cet élément"}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Supprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}