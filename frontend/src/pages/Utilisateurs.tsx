import { useState, useEffect } from "react";
import { DataTable, type Column } from "@/components/common/DataTable";
import UserSkeleton from "@/components/loaders/UserSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users as UsersIcon, Shield, User } from "lucide-react";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import axios from "axios";
import { Value } from "@radix-ui/react-select";
import { API_URL } from "@/config/api";

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [selectedGroupe, setSelectedGroupe] = useState("");
  const [regies, setRegies] = useState<any[]>([]);
  const [selectedRegie, setSelectedRegie] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUtilisateur, setEditingUtilisateur] = useState<any>(null);
  const [utilisateurToDelete, setUtilisateurToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSexe, setSelectedSexe] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchUtilisateurs();
    fetchGroupes();
    fetchRegie();
  }, []);

  // Quand on ouvre le modal pour modifier, on remplit les valeurs
  useEffect(() => {
    if (editingUtilisateur) {
      setSelectedSexe(editingUtilisateur.UTI_SEXE || "");
    } else {
      setSelectedSexe("");
    }
  }, [editingUtilisateur]);

  // Récupération des utilisateurs
  const fetchUtilisateurs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/utilisateurs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUtilisateurs(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs :", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Récupération des groupes
  const fetchGroupes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/groupes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupes(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement des groupes :", error);
    }
  };

   const fetchRegie = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/regies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegies(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement des régies :", error);
    }
  };

  //  Fonction pour basculer le statut d'un utilisateur
  const handleToggleStatus = async (user: any) => {
    try {
      const token = localStorage.getItem("token");

      //  Assure-toi que la valeur est bien booléenne
      const currentStatus = user.UTI_STATUT === true || user.UTI_STATUT === 1 || user.UTI_STATUT === "1";
      const newStatus = !currentStatus;

      //cEnvoi de la requête PATCH vers ton backend
      await axios.patch(
        `${API_URL}/utilisateurs/${user.UTI_CODE}/toggle-status`,
        { statut: newStatus ? 1 : 0 }, // on envoie un entier clair
        { headers: { Authorization: `Bearer ${token}` } }
      );

      //  Message de confirmation
      toast({
        title: "Statut modifié",
        description: `${user.UTI_PRENOM} ${user.UTI_NOM} est maintenant ${newStatus ? "Actif" : "Inactif"}.`,
      });

      //  Rafraîchir depuis le backend 
      await fetchUtilisateurs();
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Impossible de changer le statut.",
        variant: "destructive",
      });
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const displayed = utilisateurs
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.UTI_NOM).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.UTI_PRENOM).toLowerCase().includes(searchTerm.toLowerCase())
  );

  //  Colonnes du tableau
  const columns: Column[] = [
    {
      key: "UTI_NOM",
      title: "UTILISATEUR",
      render: (_, row) => (
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              {`${row.UTI_PRENOM?.[0] || ""}${row.UTI_NOM?.[0] || ""}`.toUpperCase()}
            </div>
            <span className="font-medium">{row.UTI_PRENOM} {row.UTI_NOM}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            {row.UTI_USERNAME}
          </div>
        </div>
      ),
    },
    {
      key: "UTI_SEXE",
      title: "SEXE",
    },
    {
      key: "GRP_CODE",
      title: "GROUPE",
      render: (value: string) => {
        const grp = groupes.find(g => g.GRP_CODE === value);
        return (
          <Badge variant="secondary" className="bg-primary/10 font-semibold text-primary">
            {grp ? grp.GRP_NOM : "—"}
          </Badge>
        );
      },
    },
    {
      key: "REG_CODE",
      title: "REGIE",
      render: (value: string) => {
        const reg = regies.find(r => r.REG_CODE === value);
        return (
          <Badge  className="bg-primary/10 font-semibold text-primary">
            {reg ? reg.REG_SIGLE : "—"}
          </Badge>
        );
      },
    },
    {
      key: "UTI_STATUT",
      title: "STATUT",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"} className={value ? "bg-green-500/20 text-green-700" : ""}>
          {value ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "UTI_DATE_CREER",
      title: "DATE DE CREATION",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key:"UTI_CREER_PAR",
        title: "CREER PAR",
    },
    {
      key: "UTI_DATE_MODIFIER",
      title: "DATE DE MODIFICATION",
      render: (value) => value? new Date(value).toLocaleDateString("fr-FR") : "_",
    },
    {
        key: "UTI_MODIFIER_PAR",
        title: "MODIFIER PAR",
        render: (Value) => Value? Value : "_",
    },
    // {
    //     key: "UTI_VERSION",
    //     title: "VERSION MODIFIEE",
    //     render: (Value) => Value? Value : "_",
    // },
  ];

  //  Ajouter ou modifier un utilisateur
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      UTI_NOM: formData.get("UTI_NOM"),
      UTI_PRENOM: formData.get("UTI_PRENOM"),
      UTI_SEXE: selectedSexe,
      UTI_USERNAME: formData.get("UTI_USERNAME"),
      UTI_PASSWORD: formData.get("UTI_PASSWORD"),
      GRP_CODE: selectedGroupe,
      REG_CODE: selectedRegie,
    };

    try {
      if (editingUtilisateur) {
        await axios.put(`${API_URL}/utilisateurs/${editingUtilisateur.UTI_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Utilisateur modifié avec succès" });
      } else {
        await axios.post(`${API_URL}/utilisateurs`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Utilisateur ajouté avec succès" });
      }
      fetchUtilisateurs();
      setIsDialogOpen(false);
      setEditingUtilisateur(null);
      setSelectedGroupe("");
      setSelectedRegie("");
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
    if (!utilisateurToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/utilisateurs/${utilisateurToDelete.UTI_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Utilisateur supprimé avec succès" });
      fetchUtilisateurs();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.response?.data?.message || "Suppression échouée", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return <UserSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold text-primary">
        Gestion des utilisateurs
      </h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => { setEditingUtilisateur(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingUtilisateur(u); setSelectedGroupe(u.GRP_CODE); setSelectedRegie(u.REG_CODE); setIsDialogOpen(true); }}
        onDelete={(u) => { setUtilisateurToDelete(u); setIsDeleteDialogOpen(true); }}
        onToggleStatus={handleToggleStatus}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher un utilisateur..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUtilisateur ? "MODIFIER L'UTILISATEUR" : "NOUVEAU UTILISATEUR"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nom <span className="text-red-500">*</span></Label>
              <Input name="UTI_NOM" defaultValue={editingUtilisateur?.UTI_NOM || ""} required />
            </div>
            <div>
              <Label>Prénom <span className="text-red-500">*</span></Label>
              <Input name="UTI_PRENOM" defaultValue={editingUtilisateur?.UTI_PRENOM || ""} required />
            </div>
            <div className="space-y-2">
              <Label>Sexe <span className="text-red-500">*</span></Label>
              <Select
                value={selectedSexe || undefined}
                onValueChange={(value) => setSelectedSexe(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionner le sexe --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nom d'utilisateur <span className="text-red-500">*</span></Label>
              <Input name="UTI_USERNAME" type="email" defaultValue={editingUtilisateur?.UTI_USERNAME || ""} placeholder="exemple@oni-car.com" required />
            </div>
            <div>
              <Label>Mot de passe <span className="text-red-500">*</span></Label>
              <Input
                name="UTI_PASSWORD"
                type="password"
                placeholder={editingUtilisateur ? "Laisser vide si vous ne voulez pas modifier" : ""}
                required={!editingUtilisateur}
              />
            </div>
            <div>
              <Label>Groupe <span className="text-red-500">*</span></Label>
              <Select
                value={selectedGroupe || undefined}
                onValueChange={setSelectedGroupe}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionner un groupe --" />
                </SelectTrigger>
                <SelectContent>
                  {groupes.map((grp) => (
                    <SelectItem key={grp.GRP_CODE} value={grp.GRP_CODE}>
                      {grp.GRP_NOM}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Régie</Label>
              <Select
                value={selectedRegie || undefined}
                onValueChange={setSelectedRegie}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionner une régie --" />
                </SelectTrigger>
                <SelectContent>
                  {regies.map((reg) => (
                    <SelectItem key={reg.REG_CODE} value={reg.REG_CODE}>
                      {reg.REG_LIBELLE}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingUtilisateur ? "Modifier" : "Ajouter"}
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
        itemName={utilisateurToDelete?.UTI_NOM}
      />
    </div>
  );
}