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

export default function TypeMouvements() {
  const [typeMouvements, setTypeMouvements] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTypeMouvement, setEditingTypeMouvement] = useState(null);
  const [typeMouvementToDelete, setTypeMouvementToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchTypeMouvements();
  }, []);

  // Récupération des types
  const fetchTypeMouvements = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/typeMouvements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTypeMouvements(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement des types :", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const displayed = typeMouvements
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.TYP_LIBELLE).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column[]  = [
    {
      key: "TYP_LIBELLE",
      title: "LIBELLE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
  ];

  //  Ajouter ou modifier un type de bénéficiaires
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      TYP_LIBELLE: formData.get("TYP_LIBELLE"),
    };

    try {
      if (editingTypeMouvement) {
        await axios.put(`${API_URL}/typeMouvements/${editingTypeMouvement.TYP_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ 
          title: "Succès",
          description: "Type de mouvements modifié avec succès",
          variant: "success",
         });
      } else {
        await axios.post(`${API_URL}/typeMouvements`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ 
          title: "Succès",
          description: "Type de mouvements ajouté avec succès",
          variant: "success",
         });
      }
      fetchTypeMouvements();
      setIsDialogOpen(false);
      setEditingTypeMouvement(null);
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
    if (!typeMouvementToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/typeMouvements/${typeMouvementToDelete.TYP_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ 
        title: "Succès",
        description: "Type de mouvements supprimé avec succès",
        variant: "success",
       });
      fetchTypeMouvements();
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
        Gestion des Types de mouvements
      </h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => { setEditingTypeMouvement(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingTypeMouvement(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setTypeMouvementToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher un type de mouvements..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTypeMouvement ? "MODIFIER LE TYPE DE MOUVEMENT" : "NOUVEAU TYPE DE MOUVEMENT"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="TYP_LIBELLE" defaultValue={editingTypeMouvement?.TYP_LIBELLE || ""} required />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingTypeMouvement ? "Modifier" : "Ajouter"}
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
        itemName={typeMouvementToDelete?.TYP_LIBELLE}
      />
    </div>
  );
}