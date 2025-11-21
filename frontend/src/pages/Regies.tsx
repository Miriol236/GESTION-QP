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

export default function Regies() {
  const [regies, setRegies] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegie, setEditingRegie] = useState(null);
  const [regieToDelete, setRegieToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchRegies();
  }, []);

  // Récupération 
  const fetchRegies = async () => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/regies`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setRegies(res.data);
        } catch (error) {
        console.error("Erreur lors du chargement des régies :", error);
        } finally {
            setIsLoading(false);
        }
    };

  const [searchTerm, setSearchTerm] = useState("");

  const displayed = regies
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.REG_LIBELLE).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.REG_SIGLE).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column[]  = [
    {
      key: "REG_LIBELLE",
      title: "LIBELLE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
        key: "REG_SIGLE",
        title: "SIGLE",
    },
    {
        key: "REG_SIGLE_CODE",
        title: "SIGLE CODE",
    },
    {
      key: "REG_DATE_CREER",
      title: "DATE DE CREATION",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key:"REG_CREER_PAR",
        title: "CREER PAR",
    },
    {
      key: "REG_DATE_MODIFIER",
      title: "DATE DE MODIFICATION",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key: "REG_MODIFIER_PAR",
        title: "MODIFIER PAR",
        render: (Value) => Value? Value : "_",
    },
    {
        key: "REG_VERSION",
        title: "VERSION MODIFIEE",
        render: (Value) => Value? Value : "_",
    },
  ];

  //  Ajouter ou modifier 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      REG_LIBELLE: formData.get("REG_LIBELLE"),
      REG_SIGLE: formData.get("REG_SIGLE"),
      REG_SIGLE_CODE: formData.get("REG_SIGLE_CODE"),
    };

    try {
      if (editingRegie) {
        await axios.put(`${API_URL}/regies/${editingRegie.REG_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Régie modifiée avec succès" });
      } else {
        await axios.post(`${API_URL}/regies`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Régie ajoutée avec succès" });
      }
      fetchRegies();
      setIsDialogOpen(false);
      setEditingRegie(null);
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
    if (!regieToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/regies/${regieToDelete.REG_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Régie supprimée avec succès" });
      fetchRegies();
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
        Gestion des Régies
      </h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => { setEditingRegie(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingRegie(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setRegieToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher une régie..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRegie ? "MODIFIER LA REGIE" : "NOUVELLE REGIE"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="REG_LIBELLE" defaultValue={editingRegie?.REG_LIBELLE || ""} required />
            </div>

            <div>
              <Label>Sigle <span className="text-red-500">*</span></Label>
              <Input name="REG_SIGLE" defaultValue={editingRegie?.REG_SIGLE || ""} required />
            </div>

            <div>
              <Label>Sigle code <span className="text-red-500">*</span></Label>
              <Input name="REG_SIGLE_CODE" defaultValue={editingRegie?.REG_SIGLE_CODE || ""} required />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingRegie ? "Modifier" : "Ajouter"}
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
        itemName={regieToDelete?.REG_LIBELLE}
      />
    </div>
  );
}