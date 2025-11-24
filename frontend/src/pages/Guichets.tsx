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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { API_URL } from "@/config/api";

export default function Guichets() {
  const [guichets, setGuichets] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuichet, setEditingGuichet] = useState(null);
  const [guichetToDelete, setGuichetToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [banques, setBanques] = useState<any[]>([]);
  const [selectedBanque, setSelectedBanque] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchGuichets();
    fetchBanques();
  }, []);

  // Récupération 
  const fetchGuichets = async () => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/guichets`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setGuichets(res.data);
        } catch (error) {
        console.error("Erreur lors du chargement des guichets :", error);
        } finally {
            setIsLoading(false);
        }
    };

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

  const displayed = guichets
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.GUI_CODE).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.GUI_NOM).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column[]  = [
    {
        key: "GUI_CODE",
        title: "CODE",
        render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "GUI_NOM",
      title: "LIBELLE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "BNQ_CODE",
      title: "BANQUE",
      render: (value: string) => {
        const bnq = banques.find(b => b.BNQ_CODE === value);
        return (
          <div  className="bg-primary/10 font-semibold text-primary">
            {bnq ? bnq.BNQ_LIBELLE : "—"}
          </div>          
        );
      },
    },
  ];

  //  Ajouter ou modifier 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      GUI_NOM: formData.get("GUI_NOM"),
      GUI_CODE: formData.get("GUI_CODE"),
      BNQ_CODE: selectedBanque,
    };

    try {
      if (editingGuichet) {
        await axios.put(`${API_URL}/guichets/${editingGuichet.GUI_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Guichet modifié avec succès" });
      } else {
        await axios.post(`${API_URL}/guichets`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Guichet ajouté avec succès" });
      }
      fetchGuichets();
      setIsDialogOpen(false);
      setEditingGuichet(null);
      setSelectedBanque("");
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
    if (!guichetToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/guichets/${guichetToDelete.GUI_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Guichet supprimé avec succès" });
      fetchGuichets();
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
        Gestion des Guichets
      </h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => { setEditingGuichet(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingGuichet(u); setSelectedBanque(u.BNQ_CODE); setIsDialogOpen(true); }}
        onDelete={(u) => { setGuichetToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher un guichet..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingGuichet ? "MODIFIER LE GUICHET" : "NOUVEAU GUICHET"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Code <span className="text-red-500">*</span></Label>
              <Input type="number" name="GUI_CODE" defaultValue={editingGuichet?.GUI_CODE || ""} required />
            </div>

            <div>
              <Label>Libellé </Label>
              <Input name="GUI_NOM" defaultValue={editingGuichet?.GUI_NOM || ""} />
            </div>

            <div>
              <Label>Banque <span className="text-red-500">*</span></Label>
              <Select
                value={selectedBanque || undefined}
                onValueChange={setSelectedBanque}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionner une banque --" />
                </SelectTrigger>
                <SelectContent>
                  {banques.map((bnq) => (
                    <SelectItem key={bnq.BNQ_CODE} value={bnq.BNQ_CODE}>
                      {bnq.BNQ_LIBELLE}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingGuichet ? "Modifier" : "Ajouter"}
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
        itemName={guichetToDelete?.GUI_NOM}
      />
    </div>
  );
}