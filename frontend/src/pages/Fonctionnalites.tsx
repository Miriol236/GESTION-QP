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

export default function Fonctionnalites() {
  const [fonctionnalites, setFonctionnalites] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFonctionnalite, setEditingFonctionnalite] = useState(null);
  const [fonctionnaliteToDelete, setFonctionnaliteToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchFonctionnalites();
  }, []);

  // Récupération des fonctionnalités
  const fetchFonctionnalites = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/fonctionnalites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFonctionnalites(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement des fonctionnalités :", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  
  const displayed = fonctionnalites
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.FON_LIBELLE).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column[]  = [
    {
      key: "FON_NOM",
      title: "LIBELLE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <AlignVerticalJustifyStartIcon className="h-4 w-4 text-primary" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
  ];

  //  Ajouter ou modifier une fonctionnalité
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      FON_NOM: formData.get("FON_NOM"),
    };

    try {
      if (editingFonctionnalite) {
        await axios.put(`${API_URL}/fonctionnalites/${editingFonctionnalite.FON_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ 
          title: "Succès",
          description: "Fonctionnalité modifiée avec succès",
          variant: "success",
        });
      } else {
        await axios.post(`${API_URL}/fonctionnalites`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ 
          title: "Succès",
          description: "Fonctionnalité ajoutée avec succès",
          variant: "success",
        });
      }
      fetchFonctionnalites();
      setIsDialogOpen(false);
      setEditingFonctionnalite(null);
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
    if (!fonctionnaliteToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/fonctionnalites/${fonctionnaliteToDelete.FON_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ 
        title: "Succès",
        description: "Fonctionnalité supprimée avec succès",
        variant: "success",
      });
      fetchFonctionnalites();
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
        Gestion des Fonctionnalités
      </h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => { setEditingFonctionnalite(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingFonctionnalite(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setFonctionnaliteToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher une fonctionnalité..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingFonctionnalite ? "MODIFIER LA FONCTIONNALITE" : "NOUVELLE FONCTIONNALITE"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="FON_NOM" defaultValue={editingFonctionnalite?.FON_NOM || ""} required />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingFonctionnalite ? "Modifier" : "Ajouter"}
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
        itemName={fonctionnaliteToDelete?.FON_NOM}
      />
    </div>
  );
}