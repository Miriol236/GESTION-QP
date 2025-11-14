import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PaiementWizard from "./PaiementWizard";
import { toast } from "sonner";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
// import PaiementPreviewModal from "./PaiementPreviewModal";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function Paiements() {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [echeances, setEcheances] = useState<any[]>([]);
  const [selectedEcheance, setSelectedEcheance] = useState<any | null>(null);
  const [paiementToDelete, setPaiementToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPaiement, setEditPaiement] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<any>(null);

  // Récupérer l'utilisateur courant pour déterminer les permissions
  const { user } = useAuth();
  const grpCode = user?.GRP_CODE || null;

  // Permissions par groupe (si besoin on peut externaliser)
  const can = {
    onAdd: grpCode === "0003",
    onEdit: grpCode === "0003",
    onDelete: grpCode === "0003",
    onDeleteAll: grpCode === "0003",
    onViews: grpCode === "0003" || grpCode === "0002" || grpCode === "0001",
    onValidateVirement: grpCode === "0001",
    onStatusUpdate: grpCode === "0001",
  };

  // Handlers réutilisables (passés au DataTable seulement si permitted)
  const handleAdd = () => {
    setIsEditing(false);
    setEditPaiement(null);
    setOpenModal(true);
  };

  const handleEdit = (b: any) => {
    setIsEditing(true);
    setEditPaiement(b);
    setOpenModal(true);
  };

  const handleDelete = (b: any) => {
    setPaiementToDelete(b);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAll = (rows: any[]) => {
    // Placeholder: comportement à implémenter côté API si nécessaire
    console.log("Supprimer tous:", rows);
    toast.success(`${rows?.length || 0} paiement(s) sélectionné(s) supprimés (simulation).`);
    // rafraîchir si nécessaire
    fetchPaiements();
  };

  //  Charger les paiements depuis l’API
  const fetchPaiements = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/paiements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaiements(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des paiements.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaiements();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_URL}/info-beneficiaires`, { headers }),
      axios.get(`${API_URL}/echeances-publique`, { headers }),
    ])
      .then(([b, e]) => {
        setBeneficiaires(b.data);
        setEcheances(e.data);
      })
      .catch(() => toast.error("Erreur lors du chargement des listes."));
  }, []);

  // Data displayed in the table, filtered by selected echeance if any
  const displayedPaiements = selectedEcheance
    ? paiements.filter((p) => String(p.ECH_CODE) === String(selectedEcheance.ECH_CODE))
    : paiements;

  // Suppression
    const handleConfirmDelete = async () => {
      if (!paiementToDelete) return;
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/paiements/${paiementToDelete.PAI_CODE}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Paiement supprimé avec succès !");
        fetchPaiements();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Suppression échouée" );
      } finally {
        setIsDeleteDialogOpen(false);
      }
    };

  // Valider virement pour les lignes sélectionnées (appelée depuis DataTable)
  const handleValidateVirement = async (rows: any[]) => {
    if (!rows || rows.length === 0) {
      toast.error("Aucun paiement sélectionné !");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const ids = rows.map((r) => r.PAI_CODE);

      const { data } = await axios.put(
        `${API_URL}/paiements/valider-virement`,
        { ids },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(data.message || `Virement validé pour ${ids.length} paiement(s).`);
      fetchPaiements();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Erreur lors de la validation des virements.");
    }
  };

  // Mettre à jour le statut pour les lignes sélectionnées (appelée depuis DataTable)
  const handleStatusUpdate = async (rows: any[]) => {
    if (!rows || rows.length === 0) {
      toast.error("Aucun paiement sélectionné !");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const ids = rows.map((r) => r.PAI_CODE);

      const { data } = await axios.put(
        `${API_URL}/paiements/valider-statut`,
        { ids },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(data.message || `Statut mis à jour pour ${ids.length} paiement(s).`);
      fetchPaiements();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Erreur lors de la mise à jour du statut.");
    }
  };

  // Voir la sélection de lignes (appelée depuis DataTable)
  const handleViews = (rows: any[]) => {
    if (!rows || rows.length === 0) return;
    // Par défaut, ouvrir la preview pour le premier élément sélectionné
    console.log("Voir détails :", rows);
    setSelectedPaiement(rows[0]);
    setOpenPreview(true);
  };

  //  Colonnes du tableau
  const columns: Column[] = [
    {
      key: "PAI_CODE",
      title: "CODE",
      render: (value: string) => {
        const pai = paiements.find(b => b.PAI_CODE === value);
        return (
          <div  className="bg-primary/10 font-semibold text-primary">
            {pai ? pai.PAI_CODE : "—"}
          </div>
        );
      },
    },
    {
        key: "PAI_BENEFICIAIRE",
        title: "BENEFICIAIRE",
        render: (_, row) => (
        <div>
            <div className="flex items-center gap-2">
            <span className="font-medium">{row.PAI_BENEFICIAIRE}</span>
            </div>
        </div>
        ),
    },
    {
      key: "PAI_STATUT",
      title: "STATUT",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"} className={
            value
              ? "bg-green-500/20 text-green-700"
              : "bg-red-500/20 text-red-700"
          }>
          {value ? "Payé" : "Non payé"}
        </Badge>
      ),
    },
    {
        key: "PAI_VIREMENT",
        title: "VIREMENT",
        render: (value: string) => {
            const pai = paiements.find(b => b.PAI_VIREMENT === value);
            const montant = pai ? Number(pai.PAI_VIREMENT) : 0;

            return (
            <div
                className={`font-semibold ${
                montant === 0 ? "text-red-500" : "text-green-600"
                }`}
            >
                {pai ? montant : ""}
            </div>
            );
        },
    },
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
            Gestion de paiements des bénéficiaires</h1>
        </div>
        <Dialog
          open={openModal}
          onOpenChange={(open) => {
            setOpenModal(open);
            // When dialog is closed (either by X button or programmatically), refresh the list
            if (!open) fetchPaiements();
          }}
        >
          <DialogContent
            className="max-w-4xl"
            // Prevent closing by clicking outside
            onPointerDownOutside={(e: any) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            // Prevent closing with Escape
            onEscapeKeyDown={(e: any) => e.preventDefault()}
          >
            <PaiementWizard
              paiementData={isEditing ? editPaiement : null}
              onSuccess={() => {
                // Close dialog; fetch will run via onOpenChange (so X and Terminer behave the same)
                setOpenModal(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des paiements */}
      <Card>
        {/* <CardHeader>
          <CardTitle>Liste des paiements</CardTitle>
        </CardHeader> */}
        <CardContent>

          {/* Table */}
          <DataTable
            title={`Enregistrement (${paiements.length})`}
            columns={columns}
            data={displayedPaiements}
            onAdd={can.onAdd ? handleAdd : undefined}
            onValidateVirement={can.onValidateVirement ? handleValidateVirement : undefined}
            onStatusUpdate={can.onStatusUpdate ? handleStatusUpdate : undefined}
            onViews={can.onViews ? handleViews : undefined}
            rowKey="PAI_CODE"
            filterItems={echeances}
            filterDisplay={(it: any) => it.ECH_LIBELLE || it.ECH_CODE}
            onFilterSelect={(it) => {
              setSelectedEcheance(it);
            }}
            onEdit={can.onEdit ? handleEdit : undefined}
            onDelete={can.onDelete ? handleDelete : undefined}
            addButtonText="Nouveau paiement"
            onDeleteAll={can.onDeleteAll ? handleDeleteAll : undefined}
            searchPlaceholder="Rechercher un paiement..."
            filterPlaceholder="Filtrer par échéance..."
          />
        </CardContent>
      </Card>

      {/* Confirmation suppression */}
        <ConfirmDeleteDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={paiementToDelete ? `paiement ${paiementToDelete.PAI_CODE} du bénéficiaire ${paiementToDelete.PAI_BENEFICIAIRE}` : ""}
        />
      
      {/* <PaiementPreviewModal
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        beneficiaire={selectedPaiement}
      /> */}
    </div>
  );
}