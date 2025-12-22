import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import BeneficiaireWizard from "./BeneficiaireWizard";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import BeneficiairePreviewModal from "./BeneficiairePreviewModal";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { User, ChartColumnIncreasing, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Beneficiaires() {
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [fonctions, setFonctions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [beneficiaireToDelete, setBeneficiaireToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBeneficiaire, setEditBeneficiaire] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState<any>(null);
  const { toast } = useToast();

  const { user } = useAuth();
  const regCodeUser = user?.REG_CODE || null; // null si l'utilisateur n'est pas rattaché à une régie

  // Permissions par groupe (si besoin on peut externaliser)
  const can = {
    onAdd: regCodeUser != null,       // seuls les admins (sans régie) peuvent ajouter
    onEdit: regCodeUser != null,      // idem pour éditer
    onDelete: regCodeUser != null,    // idem pour supprimer
    // onDeleteAll: regCodeUser != null, // idem pour suppression multiple
    onViews: true,                     // tous peuvent voir leurs paiements
  };

    // Handlers réutilisables (passés au DataTable seulement si permitted)
  const handleAdd = () => {
    setIsEditing(false);
    setEditBeneficiaire(null);
    setOpenModal(true);
  };

  const handleEdit = (b: any) => {
    setIsEditing(true);
    setEditBeneficiaire(b);
    setOpenModal(true);
  };

  const handleDelete = (b: any) => {
    setBeneficiaireToDelete(b);
    setIsDeleteDialogOpen(true);
  };

  const handlePrint = () => {
    window.print(); // Simple impression du contenu
  };

  //  Charger les bénéficiaires depuis l’API
  const fetchBeneficiaires = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/beneficiaires`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBeneficiaires(data);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description:"Erreur lors du chargement des bénéficiaires",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const displayed = beneficiaires
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.BEN_MATRICULE).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.BEN_CODE).toLowerCase().includes(searchTerm.toLowerCase())  ||
      String(p.BEN_NOM).toLowerCase().includes(searchTerm.toLowerCase())  ||
      String(p.BEN_PRENOM).toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchBeneficiaires();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_URL}/typeBeneficiaires-public`, { headers }),
      axios.get(`${API_URL}/fonctions-public`, { headers }),
      axios.get(`${API_URL}/grades-public`, { headers }),
      axios.get(`${API_URL}/positions-publiques`, { headers }),
    ])
      .then(([t, f, g, p]) => {
        setTypes(t.data);
        setFonctions(f.data);
        setGrades(g.data);
        setPositions(p.data);
      })
      .catch(() => toast({
        title: "Erreur",
        description: "Erreur lors du chargement des listes.",
        variant: "destructive",
      }));
  }, []);

  // Suppression
    const handleConfirmDelete = async () => {
      if (!beneficiaireToDelete) return;
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/beneficiaires/${beneficiaireToDelete.BEN_CODE}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({
          title: "Succès",
          description: "Bénéficiaire supprimé avec succès !",
          variant: "success",
        });
        fetchBeneficiaires();
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

  //  Colonnes du tableau
  const columns: Column[] = [
    {
      key: "BEN_CODE",
      title: "CODE",
      render: (value: string) => {
        const ben = beneficiaires.find(b => b.BEN_CODE === value);
        return (
          <div  className="bg-primary/10 font-semibold text-primary">
            {ben ? ben.BEN_CODE : "—"}
          </div>
        );
      },
    },
    {
      key: "BEN_NOM",
      title: "BENEFICIAIRE",
      render: (_, row) => (
        <div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium">{row.BEN_NOM} {row.BEN_PRENOM}</span>
          </div>
        </div>
      ),
    },
    {
      key: "BEN_SEXE",
      title: "SEXE",
      render: (value) => {
        if (value !== "M" && value !== "F") {
          return (
            <Badge className="bg-gray-500/20 text-gray-700">
              Non défini
            </Badge>
          );
        }

        const isMale = value === "M";

        return (
          <Badge
            variant={isMale ? "default" : "secondary"}
            className={
              isMale
                ? "bg-blue-500/20 text-blue-700"
                : "bg-pink-500/20 text-pink-700"
            }
          >
            {isMale ? "Masculin" : "Féminin"}
          </Badge>
        );
      },
    },
    {
      key: "TYP_CODE",
      title: "TYPE DE BENEFICIARE",
      render: (value: string) => {
        const typ = types.find(t => t.TYP_CODE === value);
        return (
          <div>
            {typ ? typ.TYP_LIBELLE : "—"}
          </div>
        );
      },
    },
    {
      key: "POS_CODE",
      title: "POSITION",
      render: (value: string) => {
        const pst = positions.find(p => p.POS_CODE === value);

        // Cas où POS_CODE n'est pas défini ou inconnu
        if (!pst) {
          return (
            <Badge className="bg-gray-500/20 text-gray-700">
              Non défini
            </Badge>
          );
        }

        // Définir les couleurs selon POS_CODE
        let bgClass = "bg-gray-500/20";
        let textClass = "text-gray-700";

        switch (value) {
          case "01": // En activité
            bgClass = "bg-green-500/20";
            textClass = "text-green-700";
            break;
          case "02": // En retraite
            bgClass = "bg-gray-500/20";
            textClass = "text-gray-700";
            break;
          case "03": // Décédé
            bgClass = "bg-red-500/20";
            textClass = "text-red-700";
            break;
        }

        return (
          <Badge className={`${bgClass} ${textClass}`}>
            {pst.POS_LIBELLE}
          </Badge>
        );
      },
    }
  ];

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-primary">
            Gestion des bénéficiaires et leurs informations bancaires</h1>
        </div>
        <Dialog
          open={openModal}
          onOpenChange={(open) => {
            // Toujours mettre à jour l'état local
            setOpenModal(open);
            // Lorsqu'on ferme le dialog (via le bouton Close ou programmatique),
            // rafraîchir la liste des bénéficiaires.
            if (!open) fetchBeneficiaires();
          }}
        >
          {/*
            Empêcher la fermeture par clic hors du modal ou par la touche Escape.
            On utilise les handlers Radix `onPointerDownOutside` et `onEscapeKeyDown`
            pour empêcher l'action par défaut qui fermerait le modal.
          */}
          <DialogContent
            className="max-w-4xl"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <BeneficiaireWizard
              beneficiaireData={isEditing ? editBeneficiaire : null}
              // onSuccess ferme le modal ; le fetch est géré dans onOpenChange
              onSuccess={() => setOpenModal(false)}
              onFinish={() => fetchBeneficiaires()}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={can.onAdd ? handleAdd : undefined}
        onView={(b) => {
          setSelectedBeneficiaire(b);
          setOpenPreview(true);
        }}
        onEdit={can.onEdit ? handleEdit : undefined}
        onDelete={can.onDelete ? handleDelete : undefined}
        addButtonText="Nouveau"
        // onDeleteAll={(rows) => (rows)}
        searchPlaceholder="Rechercher un bénéficiaire (Code, Mat, Nom et Prénom)."
        onSearchChange={(value: string) => setSearchTerm(value)}
        // onPrint={handlePrint}
      />

      {/* Confirmation suppression */}
        <ConfirmDeleteDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={beneficiaireToDelete ? `bénéficiaire ${beneficiaireToDelete.BEN_NOM}  ${beneficiaireToDelete.BEN_PRENOM}` : ""}
        />
      
      <BeneficiairePreviewModal
        open={openPreview}
        onClose={() => {
          setOpenPreview(false);
          // fetchBeneficiaires();
        }}
        beneficiaire={selectedBeneficiaire}
      />
    </div>
  );
}