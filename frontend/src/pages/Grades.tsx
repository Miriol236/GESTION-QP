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

export default function Grades() {
  const [grades, setGrades] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [gradeToDelete, setGradeToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchGrades();
  }, []);

  // Récupération des grades
  const fetchGrades = async () => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/grades`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setGrades(res.data);
        } catch (error) {
        console.error("Erreur lors du chargement des grades :", error);
        } finally {
            setIsLoading(false);
        }
    };

  const columns: Column[]  = [
    {
      key: "GRD_LIBELLE",
      title: "Libellé",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "GRD_DATE_CREER",
      title: "Date de création",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key:"GRD_CREER_PAR",
        title: "Créer par",
    },
    {
      key: "GRD_DATE_MODIFIER",
      title: "Date de modification",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key: "GRD_MODIFIER_PAR",
        title: "Modifier par",
        render: (Value) => Value? Value : "_",
    },
    {
        key: "GRD_VERSION",
        title: "Version modifiée",
        render: (Value) => Value? Value : "_",
    },
  ];

  //  Ajouter ou modifier un grade
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      GRD_LIBELLE: formData.get("GRD_LIBELLE"),
    };

    try {
      if (editingGrade) {
        await axios.put(`${API_URL}/grades/${editingGrade.GRD_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Grade modifié avec succès" });
      } else {
        await axios.post(`${API_URL}/grades`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Grade ajouté avec succès" });
      }
      fetchGrades();
      setIsDialogOpen(false);
      setEditingGrade(null);
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
    if (!gradeToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/grades/${gradeToDelete.GRD_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Grade supprimé avec succès" });
      fetchGrades();
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
        Gestion des Grades
      </h1>

      <DataTable
        title={`Enregistrements (${grades.length})`}
        columns={columns}
        data={grades}
        onAdd={() => { setEditingGrade(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingGrade(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setGradeToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouvel grade"
        searchPlaceholder="Rechercher un grade..."
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? "Modifier le grade" : "Nouvel grade"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="GRD_LIBELLE" defaultValue={editingGrade?.GRD_LIBELLE || ""} required />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingGrade ? "Modifier" : "Ajouter"}
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
        itemName={gradeToDelete?.GRD_LIBELLE}
      />
    </div>
  );
}