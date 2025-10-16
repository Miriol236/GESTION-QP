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

export default function Echeances() {
  const [echeances, setEcheances] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEcheance, setEditingEcheance] = useState(null);
  const [echeanceToDelete, setEcheanceToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchEcheances();
  }, []);

  // Récupération des échéances
  const fetchEcheances = async () => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/echeances`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setEcheances(res.data);
        } catch (error) {
        console.error("Erreur lors du chargement des échéances :", error);
        } finally {
            setIsLoading(false);
        }
    };

  const columns: Column[]  = [
    {
      key: "ECH_LIBELLE",
      title: "Libellé",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "ECH_DATE_CREER",
      title: "Date de création",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key:"ECH_CREER_PAR",
        title: "Créer par",
    },
    {
      key: "ECH_DATE_MODIFIER",
      title: "Date de modification",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key: "ECH_MODIFIER_PAR",
        title: "Modifier par",
        render: (Value) => Value? Value : "_",
    },
    {
        key: "ECH_VERSION",
        title: "Version modifiée",
        render: (Value) => Value? Value : "_",
    },
  ];

  //  Ajouter ou modifier une échéance
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      ECH_LIBELLE: formData.get("ECH_LIBELLE"),
    };

    try {
      if (editingEcheance) {
        await axios.put(`${API_URL}/echeances/${editingEcheance.ECH_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Echéance modifiée avec succès" });
      } else {
        await axios.post(`${API_URL}/echeances`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Echéance ajoutée avec succès" });
      }
      fetchEcheances();
      setIsDialogOpen(false);
      setEditingEcheance(null);
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
    if (!echeanceToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/echeances/${echeanceToDelete.ECH_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Echéance supprimée avec succès" });
      fetchEcheances();
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
      <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        Gestion des Echéances
      </h1>

      <DataTable
        title={`Enregistrements (${echeances.length})`}
        columns={columns}
        data={echeances}
        onAdd={() => { setEditingEcheance(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingEcheance(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setEcheanceToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouvelle échéance"
        searchPlaceholder="Rechercher une échéance..."
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEcheance ? "Modifier l'Echéance" : "Nouvelle échéance"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="ECH_LIBELLE" defaultValue={editingEcheance?.ECH_LIBELLE || ""} required />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingEcheance ? "Modifier" : "Ajouter"}
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
        itemName={echeanceToDelete?.ECH_LIBELLE}
      />
    </div>
  );
}