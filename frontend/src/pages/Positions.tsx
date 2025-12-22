import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/common/DataTable";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tags, Package, AlignVerticalJustifyStartIcon } from "lucide-react";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import axios from "axios";
import { API_URL } from "@/config/api";

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [positionToDelete, setPositionToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchPositions();
  }, []);

  // Récupération
  const fetchPositions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/positions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPositions(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement des positions :", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const displayed = positions
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.POS_LIBELLE).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column[]  = [
    {
      key: "POS_LIBELLE",
      title: "LIBELLE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
  ];

  //  Ajouter ou modifier une position
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      POS_LIBELLE: formData.get("POS_LIBELLE"),
    };

    try {
      if (editingPosition) {
        await axios.put(`${API_URL}/positions/${editingPosition.POS_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ 
          title: "Succès",
          description: "Position modifiée avec succès",
          variant: "success",
         });
      } else {
        await axios.post(`${API_URL}/positions`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ 
          title: "Succès",
          description: "Position ajoutée avec succès",
          variant: "success",
         });
      }
      fetchPositions();
      setIsDialogOpen(false);
      setEditingPosition(null);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Échec de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  // Suppression
  const handleConfirmDelete = async () => {
    if (!positionToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/positions/${positionToDelete.POS_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ 
        title: "Succès",
        description: "Position supprimée avec succès",
        variant: "success",
       });
      fetchPositions();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.response?.data?.message || "Suppression échouée", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold text-primary">
        Gestion des Positions
      </h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => { setEditingPosition(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingPosition(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setPositionToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher une position..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? "MODIFIER POSITION" : "NOUVELLE POSITION"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="POS_LIBELLE" defaultValue={editingPosition?.POS_LIBELLE || ""} required />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingPosition ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={positionToDelete?.POS_LIBELLE}
      />
    </div>
  );
}