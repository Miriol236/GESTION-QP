import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/DataTable";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import { API_URL } from "@/config/api";

export default function Groupe() {
  const [groupes, setGroupes] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroupe, setEditingGroupe] = useState<any>(null);
  const [groupeToDelete, setGroupeToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFonctionnalites, setIsLoadingFonctionnalites] = useState(false);


  // Gestion des droits
  const [openRightsModal, setOpenRightsModal] = useState(false);
  const [fonctionnalites, setFonctionnalites] = useState<any[]>([]);
  const [selectedFonctionnalites, setSelectedFonctionnalites] = useState<string[]>([]);
  const [currentGroupe, setCurrentGroupe] = useState<any | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchGroupes();
    fetchFonctionnalites();
  }, []);

  // === Récupération des groupes ===
  const fetchGroupes = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/groupes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupes(res.data); //  Corrigé ici
    } catch (error) {
      console.error("Erreur lors du chargement des groupes :", error);
    } finally {
      setIsLoading(false);
    }
  };

  // === Récupération des fonctionnalités ===
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
  
  const displayed = groupes
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.GRP_NOM).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === Colonnes du tableau ===
  const columns = [
    {
      key: "GRP_NOM",
      title: "NOM DU GROUPE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
  ];

  // === Ajouter ou modifier un groupe ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      GRP_NOM: formData.get("GRP_NOM"),
    };

    try {
      if (editingGroupe) {
        await axios.put(`${API_URL}/groupes/${editingGroupe.GRP_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Groupe modifié avec succès" });
      } else {
        await axios.post(`${API_URL}/groupes`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Groupe ajouté avec succès" });
      }
      fetchGroupes();
      setIsDialogOpen(false);
      setEditingGroupe(null);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Échec de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  // === Suppression d’un groupe ===
  const handleConfirmDelete = async () => {
    if (!groupeToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/groupes/${groupeToDelete.GRP_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Groupe supprimé avec succès" });
      fetchGroupes();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Suppression échouée",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // === Gestion des droits d’un groupe ===
  const handleManageRoles = async (groupe: any) => {
    setCurrentGroupe(groupe);
    setOpenRightsModal(true);
    setIsLoadingFonctionnalites(true);

    try {
      const token = localStorage.getItem("token");

      // Charger toutes les fonctionnalités disponibles
      const allFonctionnalites = await axios.get(`${API_URL}/fonctionnalites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFonctionnalites(allFonctionnalites.data);

      // Charger les fonctionnalités déjà attribuées à ce groupe
      const assignedFonctionnalites = await axios.get(
        `${API_URL}/groupes/${groupe.GRP_CODE}/fonctionnalites`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Corrigé : bonne clé selon ton backend
      setSelectedFonctionnalites(assignedFonctionnalites.data.fonctionnalites_associees);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les fonctionnalités.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFonctionnalites(false);
    }
  };

  // Cocher/décocher une fonctionnalité
  const toggleFonctionnalite = (fonCode: string) => {
    setSelectedFonctionnalites((prev) =>
      prev.includes(fonCode)
        ? prev.filter((id) => id !== fonCode)
        : [...prev, fonCode]
    );
  };

  // Sauvegarde des droits
  const handleSaveFonctionnalites = async () => {
    if (!currentGroupe) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/groupes/${currentGroupe.GRP_CODE}/fonctionnalites`,
        { fonctionnalites: selectedFonctionnalites },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.dispatchEvent(new Event("droitUpdated"));

      toast({ title: "Droits mis à jour avec succès" });
      setOpenRightsModal(false);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les droits.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold text-primary">
        Gestion des Groupes et leurs droits
      </h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => { setEditingGroupe(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingGroupe(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setGroupeToDelete(u); setIsDeleteDialogOpen(true); }}
        onManageRoles={handleManageRoles}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher un groupe..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Modal ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGroupe ? "MODIFIER LE GROUPE" : "NOUVEAU GROUPE"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nom du groupe <span className="text-red-500">*</span></Label>
              <Input name="GRP_NOM" defaultValue={editingGroupe?.GRP_NOM || ""} required />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingGroupe ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal gestion des droits */}
      <Dialog open={openRightsModal} onOpenChange={setOpenRightsModal}>
        <DialogContent className="max-w-2xl">
          <DialogTitle className="text-blue-600 font-semibold">
            Gérer les droits : <span className="text-gray-900">{currentGroupe?.GRP_NOM}</span>
          </DialogTitle>
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {isLoadingFonctionnalites ? (
              // Loader visuel pendant le chargement
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 text-sm text-muted-foreground">Chargement des fonctionnalités...</p>
              </div>
            ) : (
              fonctionnalites.map((fon) => (
                <div key={fon.FON_CODE} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedFonctionnalites.includes(fon.FON_CODE)}
                    onCheckedChange={() => toggleFonctionnalite(fon.FON_CODE)}
                  />
                  <span>{fon.FON_NOM}</span>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenRightsModal(false)}>Annuler</Button>
            <Button onClick={handleSaveFonctionnalites}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={groupeToDelete?.GRP_NOM}
      />
    </div>
  );
}