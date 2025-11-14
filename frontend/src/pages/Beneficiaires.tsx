import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import BeneficiaireWizard from "./BeneficiaireWizard";
import { toast } from "sonner";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import BeneficiairePreviewModal from "./BeneficiairePreviewModal";
import { Badge } from "@/components/ui/badge";

export default function Beneficiaires() {
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [fonctions, setFonctions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [beneficiaireToDelete, setBeneficiaireToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBeneficiaire, setEditBeneficiaire] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState<any>(null);

  //  Charger les bénéficiaires depuis l’API
  const fetchBeneficiaires = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

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
    ])
      .then(([t, f, g]) => {
        setTypes(t.data);
        setFonctions(f.data);
        setGrades(g.data);
      })
      .catch(() => toast.error("Erreur lors du chargement des listes."));
  }, []);

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
    // {
    //   key: "BEN_MATRICULE",
    //   title: "MATRICULE SOLDE",
    //   render: (value: string) => {
    //     const ben = beneficiaires.find(b => b.BEN_MATRICULE === value);
    //     return (
    //       <div  className="bg-primary/10 font-semibold text-primary">
    //         {ben ? ben.BEN_MATRICULE : "—"}
    //       </div>
    //     );
    //   },
    // },
    {
          key: "BEN_NOM",
          title: "BENEFICIAIRE",
          render: (_, row) => (
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{row.BEN_NOM} {row.BEN_PRENOM}</span>
              </div>
            </div>
          ),
        },
    {
      key: "BEN_SEXE",
      title: "SEXE",
      render: (value) => (
        <Badge
          variant={value === 'M' ? "default" : "secondary"}
          className={
            value === 'M'
              ? "bg-green-500/20 text-green-700"
              : "bg-red-500/20 text-red-700"
          }
        >
          {value === 'M' ? "Masculin" : "Féminin"}
        </Badge>
      ),
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
    // {
    //   key: "FON_CODE",
    //   title: "FONCTION",
    //   render: (value: string) => {
    //     const fon = fonctions.find(f => f.FON_CODE === value);
    //     return (
    //       <div>
    //         {fon ? fon.FON_LIBELLE : "—"}
    //       </div>
    //     );
    //   },
    // },
    // {
    //   key: "GRD_CODE",
    //   title: "GRADE",
    //   render: (value: string) => {
    //     const grd = grades.find(g => g.GRD_CODE === value);
    //     return (
    //       <div>
    //         {grd ? grd.GRD_LIBELLE : "—"}
    //       </div>
    //     );
    //   },
    // },
  ];

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6 overflow-hidden h-full">
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
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des bénéficiaires */}
      <Card>
        {/* <CardHeader>
          <CardTitle>Liste des bénéficiaires</CardTitle>
        </CardHeader> */}
        <CardContent>

          {/* Table */}
          <DataTable
            title={`Enregistrement (${beneficiaires.length})`}
            columns={columns}
            data={beneficiaires}
            onAdd={() => {
              setIsEditing(false);
              setEditBeneficiaire(null);
              setOpenModal(true);
            }}
            onView={(b) => {
              setSelectedBeneficiaire(b);
              setOpenPreview(true);
            }}
            onEdit={(b) => {
              setIsEditing(true);
              setEditBeneficiaire(b);
              setOpenModal(true);
            }}
            onDelete={(b) => {
              setBeneficiaireToDelete(b);
              setIsDeleteDialogOpen(true);
            }}
            addButtonText="Nouveau bénéficiaire"
            onDeleteAll={(rows) => (rows)}
            searchPlaceholder="Rechercher un bénéficiaire..."
          />
        </CardContent>
      </Card>

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
          fetchBeneficiaires();
        }}
        beneficiaire={selectedBeneficiaire}
      />
    </div>
  );
}