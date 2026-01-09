import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmValidateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export default function ConfirmValidateDialog({
  open,
  onClose,
  onConfirm,
  itemName,
}: ConfirmValidateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <AlertTriangle className="w-5 h-5" />
            Confirmer la validation
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Êtes-vous sûr de vouloir valider{" "}
            <span className="font-semibold text-foreground">
              {itemName ?? "cet élément"}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Non
            </Button>
            <Button
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={onConfirm}
            >
              Oui
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}