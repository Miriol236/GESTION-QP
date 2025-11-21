import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import ConfirmValidateDialog from "@/components/common/ConfirmValidateDialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PaiementWizard from "./PaiementWizard";
import { toast } from "sonner";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { User, DollarSign, CheckCheck, Banknote } from "lucide-react";
import PaiementPreviewModal from "./PaiementPreviewModal";
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
  const [selectedRowsToDelete, setSelectedRowsToDelete] = useState<any[]>([]);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [selectedRowsForVirement, setSelectedRowsForVirement] = useState<any[]>([]);
  const [isValidateVirementDialogOpen, setIsValidateVirementDialogOpen] = useState(false);
  const [selectedRowsForStatus, setSelectedRowsForStatus] = useState<any[]>([]);
  const [isValidateStatusDialogOpen, setIsValidateStatusDialogOpen] = useState(false);
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
  // const displayedPaiements = selectedEcheance
  //   ? paiements.filter((p) => String(p.ECH_CODE) === String(selectedEcheance.ECH_CODE))
  //   : paiements;

  const [searchTerm, setSearchTerm] = useState("");

  const displayedPaiements = paiements
    // Filtrer par échéance si sélectionnée
    .filter((p) =>
      !selectedEcheance || String(p.ECH_CODE) === String(selectedEcheance.ECH_CODE)
    )
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.PAI_BENEFICIAIRE).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.PAI_CODE).toLowerCase().includes(searchTerm.toLowerCase())
  );

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
  const handleValidateVirement = (rows: any[]) => {
      if (!rows || rows.length === 0) {
          toast.error("Aucun paiement sélectionné !");
          return;
      }

      setSelectedRowsForVirement(rows);
      setIsValidateVirementDialogOpen(true);
  };

  const handleConfirmValidateVirement = async () => {
      if (!selectedRowsForVirement || selectedRowsForVirement.length === 0) return;

      try {
          const token = localStorage.getItem("token");

          let url = `${API_URL}/paiements/valider-virement`;
          let body = {};

          if (selectedRowsForVirement.length === 1) {
              url += `/${selectedRowsForVirement[0].PAI_CODE}`; // route single
          } else {
              body = { ids: selectedRowsForVirement.map(r => r.PAI_CODE) }; // route multiple
          }

          console.log("envoie", {url, body});

          const { data } = await axios.put(url, body, {
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
              }
          });

          if (selectedRowsForVirement.length === 1) {
              // Single validation
              if (data.message && data.message.includes("Virement validé")) {
                  toast.success("Virement validé avec succès.");
                  fetchPaiements();
              } else {
                  toast.error(data.message || "Erreur lors de la validation du virement.");
              }
          } else {
              // Bulk validation
              if (data.updated > 0) {
                  toast.success(`${data.updated} virement(s) validé(s) avec succès.`);
                  fetchPaiements();
              }

              if (data.failed && data.failed.length > 0) {
                  const failedMessages = data.failed.map((f: any) => `${f.PAI_CODE}: ${f.reason}`).join(', ');
                  toast.error(`Échecs de validation: ${failedMessages}`);
              }
          }
      } catch (err: any) {
          console.error(err);
          toast.error(err?.response?.data?.message || "Erreur lors de la validation des virements.");
      } finally {
          setIsValidateVirementDialogOpen(false);
          setSelectedRowsForVirement([]);
      }
  };

  // Mettre à jour le statut pour les lignes sélectionnées (appelée depuis DataTable)
  const handleStatusUpdate = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      toast.error("Aucun paiement sélectionné !");
      return;
    }

    setSelectedRowsForStatus(rows);
    setIsValidateStatusDialogOpen(true);
  };

  const handleConfirmValidateStatus = async () => {
    if (!selectedRowsForStatus || selectedRowsForStatus.length === 0) return;

    try {
      const token = localStorage.getItem("token");

      let url = `${API_URL}/paiements/valider-statut`;
      let body = {};

      if (selectedRowsForStatus.length === 1) {
        url += `/${selectedRowsForStatus[0].PAI_CODE}`; // route single
      } else {
        body = { ids: selectedRowsForStatus.map(r => r.PAI_CODE) }; // route multiple
      }

      const { data } = await axios.put(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      // Afficher un toast success pour chaque scénario
      if (selectedRowsForStatus.length === 1) {
        toast.success(`Statut du paiement ${selectedRowsForStatus[0].PAI_CODE} mis à jour avec succès.`);
      } else if (data.updated > 0) {
        toast.success(`${data.updated} statut(s) mis à jour avec succès.`);
      }

      // Gestion des échecs
      if (data.failed && data.failed.length > 0) {
        const failedMessages = data.failed.map((f: any) => `${f.PAI_CODE}: ${f.reason}`).join(', ');
        toast.error(`Échecs de mise à jour: ${failedMessages}`);
      }

      fetchPaiements();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Erreur lors de la mise à jour du statut.");
    } finally {
      setIsValidateStatusDialogOpen(false);
      setSelectedRowsForStatus([]);
    }
  };

  const handleDeleteVirement = (rows: any[]) => {
      if (!rows || rows.length === 0) {
          toast.error("Aucun paiement sélectionné !");
          return;
      }

      setSelectedRowsToDelete(rows);
      setIsDeleteAllDialogOpen(true);
  };

  const handleConfirmDeleteAll = async () => {
      if (!selectedRowsToDelete || selectedRowsToDelete.length === 0) return;

      try {
          const token = localStorage.getItem("token");

          const body = { ids: selectedRowsToDelete.map(r => r.PAI_CODE) };

          console.log("envoie", {url: `${API_URL}/paiements/supprimer-virements`, body});

          const { data } = await axios.delete(`${API_URL}/paiements/supprimer-virements`, {
              data: body,
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
              }
          });

          if (data.deleted > 0) {
              toast.success(`${data.deleted} paiement(s) supprimé(s) avec succès.`);
              fetchPaiements();
          }

          if (data.failed && data.failed.length > 0) {
              const failedMessages = data.failed.map((f: any) => `${f.PAI_CODE}: ${f.reason}`).join(', ');
              toast.error(`Échecs de suppression: ${failedMessages}`);
          }
      } catch (err: any) {
          console.error(err);
          toast.error(err?.response?.data?.message || "Erreur lors de la suppression des virements.");
      } finally {
          setIsDeleteAllDialogOpen(false);
          setSelectedRowsToDelete([]);
      }
  };

  interface Stat {
    title: string;
    value: string;
    icon: any;
    color: string;
    bgColor: string;
  }

  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    const fetchTotals = async (ech_code: string | null = null) => {
      try {
        const token = localStorage.getItem("token");

        // On ajoute le paramètre ech_code si défini
        const url = ech_code
          ? `${API_URL}/total-paiement?ech_code=${ech_code}`
          : `${API_URL}/total-paiement`;

        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatAmount = (a: number) =>
          Number(a).toLocaleString("fr-FR") + " F CFA";
        const formatPercent = (p: number) => p.toFixed(2) + " %";

        setStats([
          {
            title: "Montant Total Gain",
            value: formatAmount(data.total_gain),
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            title: "Montant Total Retenu",
            value: formatAmount(data.total_retenu),
            // description: "Total des retenues",
            icon: DollarSign,
            color: "text-red-600",
            bgColor: "bg-red-50",
          },
          {
            title: "Montant Total Net à Payer",
            value: formatAmount(data.total_net),
            // description: "Somme à payer",
            icon: DollarSign,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          // {
          //   title: "Taux de Paiement",
          //   value: formatPercent(data.taux_paiement),
          //   description: "Pourcentage déjà payé",
          //   icon: CheckCheck,
          //   color: "text-purple-600",
          //   bgColor: "bg-purple-50",
          // },
        ]);
      } catch (error) {
        console.error("Erreur API:", error);
      }
    };

    // On déclenche le fetch quand selectedEcheance change
    fetchTotals(selectedEcheance ? selectedEcheance.ECH_CODE : null);
  }, [selectedEcheance]);

  //  Colonnes du tableau
  const columns: Column[] = [
    {
        key: "PAI_BENEFICIAIRE",
        title: "BENEFICIAIRE",
        render: (value) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "BNQ_LIBELLE",
      title: "BANQUE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "GUI_NOM",
      title: "GUICHET",
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {record.GUI_CODE ? `${record.GUI_CODE} - ` : ''}{record.GUI_NOM || '—'}
          </span>
        </div>
      ),
    },
    {
        key: "NUMERO_DE_COMPTE",
        title: "N° COMPTE",
        render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
        key: "CLE_RIB",
        title: "CLE RIB",
        render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "MONTANT_NET",
      title: "MONTANT NET",
      render: (value) => (
        <div className="text-right">
          <span className="font-medium">
            {value != null ? Number(value).toLocaleString("fr-FR") : "—"}
          </span>
        </div>
      ),
    },
    {
      key: "PAI_STATUT",
      title: "STATUT",
      render: (value: number) => {
        const isPaid = value !== 0;
        return (
          <Badge
            variant={isPaid ? "default" : "secondary"}
            className={
              isPaid
                ? "bg-green-500/20 text-green-700 flex items-center gap-1"
                : "bg-red-500/20 text-red-700"
            }
          >
            {isPaid && <CheckCheck className="w-4 h-4" />}
            {isPaid ? "Payé" : "Non payé"}
          </Badge>
        );
      },
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
            Gestion de paiements des quôtes-parts</h1>
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
              onFinish={() => {
                // Close dialog and refresh table when wizard is finished
                setOpenModal(false);
                fetchPaiements();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-right">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {/* {stat.description} */}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Liste des paiements */}
      <Card>
        {/* <CardHeader>
          <CardTitle>Liste des paiements</CardTitle>
        </CardHeader> */}
        <CardContent>

          {/* Table */}
          <DataTable
            title={`Effectif (${displayedPaiements.length})`}
            columns={columns}
            data={displayedPaiements}
            onAdd={can.onAdd ? handleAdd : undefined}
            onView={(b) => {
              setSelectedPaiement(b);
              setOpenPreview(true);
            }}
            onValidateVirement={can.onValidateVirement ? handleValidateVirement : undefined}
            onStatusUpdate={can.onStatusUpdate ? handleStatusUpdate : undefined}
            rowKey="PAI_CODE"
            filterItems={echeances.map((e) => ({
              ...e,
              label: `Échéance : ${e.ECH_LIBELLE}`
            }))}
            filterDisplay={(it: any) => it.label || it.ECH_LIBELLE}
            onFilterSelect={(it) => setSelectedEcheance(it)}
            onEdit={can.onEdit ? handleEdit : undefined}
            onDelete={can.onDelete ? handleDelete : undefined}
            addButtonText="Nouveau"
            onDeleteAll={can.onDeleteAll ? handleDeleteVirement : undefined}
            searchPlaceholder="Rechercher un bénéficiaire..."
            onSearchChange={(value: string) => setSearchTerm(value)}
            filterPlaceholder="Filtrer par échéance..."
          />
        </CardContent>
      </Card>

      {/* Confirmation suppression */}
        <ConfirmDeleteDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={paiementToDelete ? `paiement de quôte-part du bénéficiaire ${paiementToDelete.PAI_BENEFICIAIRE}` : ""}
        />

        {/* Confirmation suppression multiple */}
        <ConfirmDeleteDialog
          open={isDeleteAllDialogOpen}
          onClose={() => setIsDeleteAllDialogOpen(false)}
          onConfirm={handleConfirmDeleteAll}
          itemName={selectedRowsToDelete.length > 0 ? `${selectedRowsToDelete.length} paiement(s) sélectionné(s)` : ""}
        />

        {/* Confirmation validation virement */}
        <ConfirmValidateDialog
          open={isValidateVirementDialogOpen}
          onClose={() => setIsValidateVirementDialogOpen(false)}
          onConfirm={handleConfirmValidateVirement}
          itemName={selectedRowsForVirement.length > 0 ? `${selectedRowsForVirement.length} virement(s) sélectionné(s)` : ""}
        />

        {/* Confirmation validation statut */}
        <ConfirmValidateDialog
          open={isValidateStatusDialogOpen}
          onClose={() => setIsValidateStatusDialogOpen(false)}
          onConfirm={handleConfirmValidateStatus}
          itemName={selectedRowsForStatus.length > 0 ? `${selectedRowsForStatus.length} statut(s) sélectionné(s)` : ""}
        />

      <PaiementPreviewModal
        open={openPreview}
        onClose={() => {
          setOpenPreview(false);
          fetchPaiements();
        }}
        paiement={selectedPaiement}
      />
    </div>
  );
}