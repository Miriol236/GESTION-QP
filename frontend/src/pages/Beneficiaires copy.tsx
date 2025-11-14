import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import BeneficiaireWizard from "./BeneficiaireWizard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/config/api";

interface Beneficiaire {
  BEN_CODE: string;
  BEN_MATRICULE: string;
  BEN_NOM: string;
  BEN_PRENOM: string;
  BEN_SEXE: string;
  FON_CODE: string;
  GRD_CODE: string;
  TYP_CODE: string;
  RIB?: string;
}

export default function Beneficiaires() {
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [fonctions, setFonctions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [beneficiaireToDelete, setBeneficiaireToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  //  Charger les bénéficiaires depuis l’API
  const fetchBeneficiaires = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/beneficiaires`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBeneficiaires(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des bénéficiaires.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaires();
    fetchBeneficiaires();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_URL}/typeBeneficiaires-public`, { headers }),
      axios.get(`${API_URL}/fonctions-public`, { headers }),
      axios.get(`${API_URL}/grades-public`, { headers }),
    ])
      .then(([t, f, g]) => {
        setTypes(t.data);
        setFonctions(f.data);
        setGrades(g.data);
      })
      .catch(() => toast.error("Erreur lors du chargement des listes."));
  }, []);

  //  Suppression
  const handleDelete = async (code: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce bénéficiaire ?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/beneficiaires/${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Bénéficiaire supprimé avec succès !");
      fetchBeneficiaires();
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  // Suppression
    const handleConfirmDelete = async () => {
      if (!beneficiaireToDelete) return;
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/beneficiaires/${beneficiaireToDelete.BEN_CODE}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Bénéficiaire supprimé avec succès !");
        fetchBeneficiaires();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Suppression échouée" );
      } finally {
        setIsDeleteDialogOpen(false);
      }
    };

  //  Filtrage
  const filteredBeneficiaires = beneficiaires.filter(
    (b) =>
      b.BEN_NOM.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.BEN_PRENOM.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.BEN_CODE.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Utilitaires d'affichage
  const getTypeInfo = (code: string) => {
    const t = types.find((typ) => String(typ.TYP_CODE).trim() === String(code).trim());
    return t ? `${t.TYP_LIBELLE || "—"}` : code;
  };

  const getFonctionInfo = (code: string) => {
    const f = fonctions.find((fon) => String(fon.FON_CODE).trim() === String(code).trim());
    return f ? `${f.FON_LIBELLE || "—"}` : code;
  };

  const getGradeInfo = (code: string) => {
    const g = grades.find((grd) => String(grd.GRD_CODE).trim() === String(code).trim());
    return g ? `${g.GRD_LIBELLE || "—"}` : code;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bénéficiaires</h1>
          <p className="text-muted-foreground mt-1">
            Gestion des bénéficiaires des quotes-parts
          </p>
        </div>
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" /> Nouveau Bénéficiaire
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl">
            <BeneficiaireWizard
              onSuccess={() => {
                setOpenModal(false);  //  ferme le modal
                fetchBeneficiaires(); // recharge la liste
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des bénéficiaires */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des bénéficiaires</CardTitle>
          <CardDescription>
            {filteredBeneficiaires.length} bénéficiaire(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CODE</TableHead>
                  <TableHead>NOM (S)</TableHead>
                  <TableHead>PRENOM (S)</TableHead>
                  <TableHead>SEXE</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>FONCTION</TableHead>
                  <TableHead>GRADE</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredBeneficiaires.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                      Aucun bénéficiaire trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBeneficiaires.map((b) => (
                    <TableRow key={b.BEN_CODE} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-primary">{b.BEN_CODE}</TableCell>
                      <TableCell className="font-medium">{b.BEN_NOM}</TableCell>
                      <TableCell className="font-medium">{b.BEN_PRENOM}</TableCell>
                      <TableCell>{b.BEN_SEXE}</TableCell>
                      <TableCell>{getTypeInfo(b.TYP_CODE)}</TableCell>
                      <TableCell>{getFonctionInfo(b.FON_CODE)}</TableCell>
                      <TableCell>{getGradeInfo(b.GRD_CODE)}</TableCell>
                      {/* <TableCell>
                        <Badge variant={b.BEN_STATUT ? "default" : "secondary"}>
                          {b.BEN_STATUT ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell> */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={(b) => { setBeneficiaireToDelete(b); setIsDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation suppression */}
        <ConfirmDeleteDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={beneficiaireToDelete?.BEN_NOM}
        />
    </div>
  );
}