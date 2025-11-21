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

export default function Banques() {
  const [banques, setBanques] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanque, setEditingBanque] = useState(null);
  const [banqueToDelete, setBanqueToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchBanques();
  }, []);

  // Récupération 
  const fetchBanques = async () => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/banques`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setBanques(res.data);
        } catch (error) {
        console.error("Erreur lors du chargement des banques :", error);
        } finally {
            setIsLoading(false);
        }
    };

  const [searchTerm, setSearchTerm] = useState("");

  const displayed = banques
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.BNQ_NUMERO).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.BNQ_LIBELLE).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column[]  = [
    {
        key: "BNQ_NUMERO",
        title: "NUMERO",
        render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "BNQ_LIBELLE",
      title: "LIBELLE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "BNQ_DATE_CREER",
      title: "DATE DE CREATION",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key:"BNQ_CREER_PAR",
        title: "CREER PAR",
    },
    {
      key: "BNQ_DATE_MODIFIER",
      title: "DATE DE MODIFICATION",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key: "BNQ_MODIFIER_PAR",
        title: "MODIFIER PAR",
        render: (Value) => Value? Value : "_",
    },
    {
        key: "BNQ_VERSION",
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
      BNQ_NUMERO: formData.get("BNQ_NUMERO"),
      BNQ_LIBELLE: formData.get("BNQ_LIBELLE"),
    };

    try {
      if (editingBanque) {
        await axios.put(`${API_URL}/banques/${editingBanque.BNQ_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Banque modifiée avec succès" });
      } else {
        await axios.post(`${API_URL}/banques`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Banque ajoutée avec succès" });
      }
      fetchBanques();
      setIsDialogOpen(false);
      setEditingBanque(null);
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
    if (!banqueToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/banques/${banqueToDelete.BNQ_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Banque supprimée avec succès" });
      fetchBanques();
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
        Gestion des Banques
      </h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => { setEditingBanque(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingBanque(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setBanqueToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher une banque..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBanque ? "MODIFIER LA BANQUE" : "NOUVELLE BANQUE"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Numéro <span className="text-red-500">*</span></Label>
              <Input type="number" name="BNQ_NUMERO" defaultValue={editingBanque?.BNQ_NUMERO || ""} required />
            </div>

            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="BNQ_LIBELLE" defaultValue={editingBanque?.BNQ_LIBELLE || ""} required />
            </div>


            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingBanque ? "Modifier" : "Ajouter"}
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
        itemName={banqueToDelete?.BNQ_LIBELLE}
      />
    </div>
  );
}