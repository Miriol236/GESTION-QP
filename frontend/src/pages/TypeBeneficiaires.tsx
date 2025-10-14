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

export default function TypeBeneficiaires() {
  const [typeBeneficiaires, setTypeBeneficiaires] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTypeBeneficiaire, setEditingTypeBeneficiaire] = useState(null);
  const [typeBeneficiaireToDelete, setTypeBeneficiaireToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchTypeBeneficiaires();
  }, []);

  // Récupération des types bénéficiaires
  const fetchTypeBeneficiaires = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/typeBeneficiaires`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTypeBeneficiaires(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement des types bénéficiaires :", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column[]  = [
    {
      key: "TYP_LIBELLE",
      title: "Libellé",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "TYP_DATE_CREER",
      title: "Date de création",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key:"TYP_CREER_PAR",
        title: "Créer par",
    },
    {
      key: "TYP_DATE_MODIFIER",
      title: "Date de modification",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key: "TYP_MODIFIER_PAR",
        title: "Modifier par",
        render: (Value) => Value? Value : "_",
    },
    {
        key: "TYP_VERSION",
        title: "Version modifiée",
        render: (Value) => Value? Value : "_",
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
      if (editingTypeBeneficiaire) {
        await axios.put(`${API_URL}/typeBeneficiaires/${editingTypeBeneficiaire.TYP_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Type de bénéficiaires modifié avec succès" });
      } else {
        await axios.post(`${API_URL}/typeBeneficiaires`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Type de bénéficiaires ajouté avec succès" });
      }
      fetchTypeBeneficiaires();
      setIsDialogOpen(false);
      setEditingTypeBeneficiaire(null);
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
    if (!typeBeneficiaireToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/typeBeneficiaires/${typeBeneficiaireToDelete.TYP_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Type de bénéficiaires supprimé avec succès" });
      fetchTypeBeneficiaires();
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
      <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        Gestion des Types de bénéficiaires
      </h1>

      <DataTable
        title={`Enregistrements (${typeBeneficiaires.length})`}
        columns={columns}
        data={typeBeneficiaires}
        onAdd={() => { setEditingTypeBeneficiaire(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingTypeBeneficiaire(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setTypeBeneficiaireToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouveau type de bénéficiaires"
        searchPlaceholder="Rechercher un type de bénéficiaires..."
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTypeBeneficiaire ? "Modifier le type de bénéficiaires" : "Nouveau type de bénéficiaires"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="TYP_LIBELLE" defaultValue={editingTypeBeneficiaire?.TYP_LIBELLE || ""} required />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingTypeBeneficiaire ? "Modifier" : "Ajouter"}
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
        itemName={typeBeneficiaireToDelete?.TYP_LIBELLE}
      />
    </div>
  );
}