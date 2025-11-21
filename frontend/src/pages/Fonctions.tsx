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

export default function Fonctions() {
  const [fonctions, setFonctions] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFonction, setEditingFonction] = useState(null);
  const [fonctionToDelete, setFonctionToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchFonctions();
  }, []);

  // Récupération des fonctions
  const fetchFonctions = async () => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/fonctions`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setFonctions(res.data);
        } catch (error) {
        console.error("Erreur lors du chargement des fonctions :", error);
        } finally {
            setIsLoading(false);
        }
    };

  const [searchTerm, setSearchTerm] = useState("");

  const displayedPaiements = fonctions
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.FON_LIBELLE).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column[]  = [
    {
      key: "FON_LIBELLE",
      title: "LIBELLE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "FON_DATE_CREER",
      title: "DATE DE CREATION",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key:"FON_CREER_PAR",
        title: "CREER PAR",
    },
    {
      key: "FON_DATE_MODIFIER",
      title: "DATE DE MODIFICATION",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key: "FON_MODIFIER_PAR",
        title: "MODIFIER PAR",
        render: (Value) => Value? Value : "_",
    },
    {
        key: "FON_VERSION",
        title: "VERSION MODIFIEE",
        render: (Value) => Value? Value : "_",
    },
  ];

  //  Ajouter ou modifier une fonction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      FON_LIBELLE: formData.get("FON_LIBELLE"),
    };

    try {
      if (editingFonction) {
        await axios.put(`${API_URL}/fonctions/${editingFonction.FON_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Fonction modifiée avec succès" });
      } else {
        await axios.post(`${API_URL}/fonctions`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Fonction ajoutée avec succès" });
      }
      fetchFonctions();
      setIsDialogOpen(false);
      setEditingFonction(null);
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
    if (!fonctionToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/fonctions/${fonctionToDelete.FON_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Fonction supprimée avec succès" });
      fetchFonctions();
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
        Gestion des Fonctions
      </h1>

      <DataTable
        title={`Effectif (${displayedPaiements.length})`}
        columns={columns}
        data={displayedPaiements}
        onAdd={() => { setEditingFonction(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingFonction(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setFonctionToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher une fonction..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingFonction ? "MODIFIER LA FONCTION" : "NOUVELLE FONCTION"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="FON_LIBELLE" defaultValue={editingFonction?.FON_LIBELLE || ""} required />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingFonction ? "Modifier" : "Ajouter"}
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
        itemName={fonctionToDelete?.FON_LIBELLE}
      />
    </div>
  );
}