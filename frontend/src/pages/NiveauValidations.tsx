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

export default function NiveauValidations() {
  const [niveauValidations, setNiveauValidations] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNiveauValidation, setEditingNiveauValidation] = useState(null);
  const [niveauValidationToDelete, setNiveauValidationToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchNiveauValidations();
  }, []);

  // Récupération
  const fetchNiveauValidations = async () => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/niveau-validations`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setNiveauValidations(res.data);
        } catch (error) {
        console.error("Erreur lors du chargement des niveaux de validation :", error);
        } finally {
            setIsLoading(false);
        }
    };

  const [searchTerm, setSearchTerm] = useState("");

  const displayed = niveauValidations
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.NIV_LIBELLE).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column[]  = [
    {
      key: "NIV_LIBELLE",
      title: "LIBELLE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "NIV_VALEUR",
      title: "VALEUR",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
  ];

  //  Ajouter ou modifier un grade
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      NIV_LIBELLE: formData.get("NIV_LIBELLE"),
      NIV_VALEUR: formData.get("NIV_VALEUR"),
    };

    try {
      if (editingNiveauValidation) {
        await axios.put(`${API_URL}/niveau-validations/${editingNiveauValidation.NIV_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ 
          title: "Succès",
          description: "Niveau de validation modifié avec succès",
          variant: "success",
        });
      } else {
        await axios.post(`${API_URL}/niveau-validations`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ 
          title: "Succès",
          description: "Niveau de validation ajouté avec succès",
          variant: "success",
        });
      }
      fetchNiveauValidations();
      setIsDialogOpen(false);
      setEditingNiveauValidation(null);
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
    if (!niveauValidationToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/niveau-validations/${niveauValidationToDelete.NIV_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ 
        title: "Succès",
        description: "Niveau de validation supprimé avec succès",
        variant: "success",
      });
      fetchNiveauValidations();
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
        Gestion des Niveaux de validation
      </h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => { setEditingNiveauValidation(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingNiveauValidation(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setNiveauValidationToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher un niveau de validation..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingNiveauValidation ? "MODIFIER LE NIVEAU DE VALIDATION" : "NOUVEAU NIVEAU DE VALIDATION"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="NIV_LIBELLE" defaultValue={editingNiveauValidation?.NIV_LIBELLE || ""} required />
            </div>
            <div>
                <Label>
                    Valeur <span className="text-red-500">*</span>
                </Label>
                <Input
                    type="number"
                    name="NIV_VALEUR"
                    defaultValue={editingNiveauValidation?.NIV_VALEUR ?? ""}
                    required
                    min={1}
                    max={2}
                    step={1}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingNiveauValidation ? "Modifier" : "Ajouter"}
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
        itemName={niveauValidationToDelete?.NIV_LIBELLE}
      />
    </div>
  );
}