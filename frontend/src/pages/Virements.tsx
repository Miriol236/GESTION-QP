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

export default function Virements() {
  const [virements, setVirements] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVirement, setEditingVirement] = useState(null);
  const [virementToDelete, setVirementToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchVirements();
  }, []);

  // Récupération
  const fetchVirements = async () => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/virements`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setVirements(res.data);
        } catch (error) {
        console.error("Erreur lors du chargement des virements :", error);
        } finally {
            setIsLoading(false);
        }
    };

  const [searchTerm, setSearchTerm] = useState("");

  const displayed = virements
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.VIR_LIBELLE).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column[]  = [
    {
      key: "VIR_LIBELLE",
      title: "LIBELLE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
  ];

  //  Ajouter ou modifier
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      VIR_LIBELLE: formData.get("VIR_LIBELLE"),
    };

    try {
      if (editingVirement) {
        await axios.put(`${API_URL}/virements/${editingVirement.VIR_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ 
          title: "Succès",
          description: "Virement modifié avec succès",
          variant: "success",
        });
      } else {
        await axios.post(`${API_URL}/virements`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ 
          title: "Succès",
          description: "Virement ajouté avec succès",
          variant: "success",
        });
      }
      fetchVirements();
      setIsDialogOpen(false);
      setEditingVirement(null);
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
    if (!virementToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/virements/${virementToDelete.VIR_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ 
        title: "Succès",
        description: "Virement supprimé avec succès",
        variant: "success",
      });
      fetchVirements();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.response?.data?.message || "Suppression échouée", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  if(isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold text-primary">
        Gestion du parametre des Virements
      </h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => { setEditingVirement(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingVirement(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setVirementToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher un virement..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVirement ? "MODIFIER LE VIREMENT" : "NOUVEAU VIREMENT"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="VIR_LIBELLE" defaultValue={editingVirement?.VIR_LIBELLE || ""} required />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingVirement ? "Modifier" : "Ajouter"}
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
        itemName={virementToDelete?.VIR_LIBELLE}
      />
    </div>
  );
}