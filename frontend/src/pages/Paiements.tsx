import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import ConfirmValidateDialog from "@/components/common/ConfirmValidateDialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PaiementWizard from "./PaiementWizard";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { User, DollarSign, CheckCheck, Banknote } from "lucide-react";
import PaiementPreviewModal from "./PaiementPreviewModal";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Paiements() {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [echeances, setEcheances] = useState<any[]>([]);
  const [regies, setRegies] = useState<any[]>([]);
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
  const [selectedRegie, setSelectedRegie] = useState<any | null>(null);
  const [selectedStatut, setSelectedStatut] = useState<boolean | null>(null); 
  const { toast } = useToast();

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
    // onValidateVirement: grpCode === "0001",
    // onStatusUpdate: grpCode === "0001",
  };

  const showRegieFilter = grpCode === "0001" || grpCode === "0002";

  const statutOptions = [
    { label: "Statut : Tous", value: null },
    { label: "Statut : Payé", value: true },
    { label: "Statut : Non payé", value: false },
  ];

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
  const fetchPaiements = async (ech_code: string | null = null) => {
    // setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Ajoute le paramètre ech_code si une échéance est sélectionnée
      const url = ech_code
        ? `${API_URL}/paiements?ech_code=${ech_code}`
        : `${API_URL}/paiements`;

        // console.log("Fetching paiements from URL:", url);

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // console.log("Paiements reçus:", data);


      setPaiements(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des paiements.",
        variant: "destructive",
      });
    } 
    finally {
      setIsLoading(false);
    }
  };

  // Initial
  useEffect(() => {
    fetchPaiements();
    fetchTotals(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_URL}/info-beneficiaires`, { headers }),
      axios.get(`${API_URL}/echeances-publique`, { headers }),
      axios.get(`${API_URL}/regies-publiques`, { headers }),
    ])
      .then(([b, e, r]) => {
        setBeneficiaires(b.data);
        setEcheances(e.data);
        setRegies(r.data);
      })
      .catch(() => toast({
        title: "Erreur",
        description: "Erreur lors du chargement des listes.",
        variant: "destructive",
      }));
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

  // const displayedPaiements = paiements.filter((p) =>
  //   !searchTerm ||
  //   String(p.PAI_BENEFICIAIRE).toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   String(p.PAI_CODE).toLowerCase().includes(searchTerm.toLowerCase())
  // );

  const displayedPaiements = paiements.filter((p) => {
    // Recherche
    const matchesSearch =
      !searchTerm ||
      String(p.PAI_BENEFICIAIRE).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.PAI_CODE).toLowerCase().includes(searchTerm.toLowerCase());

    // Filtre échéance
    const matchesEcheance = !selectedEcheance || p.ECH_CODE === selectedEcheance.ECH_CODE;

    // Filtre régie
    const matchesRegie = !selectedRegie || p.REG_CODE === selectedRegie.REG_CODE;

    // Filtre statut
    const matchesStatut =
      selectedStatut === null || (selectedStatut ? p.PAI_STATUT !== 0 : p.PAI_STATUT === 0);

    return matchesSearch && matchesEcheance && matchesRegie && matchesStatut;
  });

  // Suppression
    const handleConfirmDelete = async () => {
      if (!paiementToDelete) return;
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/paiements/${paiementToDelete.PAI_CODE}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({
          title: "Succès",
          description: "Paiement supprimé avec succès !",
          variant: "success",
        });
        fetchPaiements();
        window.dispatchEvent(new Event("totalUpdated"));
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

  // Valider virement pour les lignes sélectionnées (appelée depuis DataTable)
  // const handleValidateVirement = (rows: any[]) => {
  //     if (!rows || rows.length === 0) {
  //         toast({
  //           title: "Erreur",
  //           description: "Aucun paiement sélectionné.",
  //           variant: "destructive",
  //         });
  //         return;
  //     }

  //     setSelectedRowsForVirement(rows);
  //     setIsValidateVirementDialogOpen(true);
  // };

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

          // console.log("envoie", {url, body});

          const { data } = await axios.put(url, body, {
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
              }
          });

          if (selectedRowsForVirement.length === 1) {
              // Single validation
              if (data.message && data.message.includes("Virement validé")) {
                  toast({
                    title: "Succès",
                    description: data?.message || "Virement validé avec succès",
                    variant: "success",
                  });
                  fetchPaiements();
                  window.dispatchEvent(new Event("totalUpdated"));
              } else {
                  toast({
                    title: "Erreur",
                    description: data?.message || "Erreur lors de validation du virement.",
                    variant: "destructive",
                  });
              }
          } else {
              // Bulk validation
              if (data.updated > 0) {
                  toast({
                    title: "Succès",
                    description: (`${data.updated} virement(s) validé(s) avec succès.`),
                    variant: "success",
                  });
                  fetchPaiements();
                  window.dispatchEvent(new Event("totalUpdated"));
              }

              if (data.failed && data.failed.length > 0) {
                  const failedMessages = data.failed.map((f: any) => `${f.PAI_CODE}: ${f.reason}`).join(', ');
                  toast({
                    title: "Erreur",
                    description: (`Échecs de validation: ${failedMessages}`),
                    variant: "destructive",
                  });
              }
          }
      } catch (err: any) {
          toast({
            title: "Erreur",
            description: err?.response?.data?.message || "Erreur lors de la validation des virements.",
            variant: "destructive",
          });
      } finally {
          setIsValidateVirementDialogOpen(false);
          setSelectedRowsForVirement([]);
      }
  };

  // Mettre à jour le statut pour les lignes sélectionnées (appelée depuis DataTable)
  // const handleStatusUpdate = (rows: any[]) => {
  //   if (!rows || rows.length === 0) {
  //     toast({
  //       title: "Erreur",
  //       description: "Aucun paiement sélectionné !",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setSelectedRowsForStatus(rows);
  //   setIsValidateStatusDialogOpen(true);
  // };

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
        toast({
          title: "Succès",
          description: (`Statut du paiement ${selectedRowsForStatus[0].PAI_CODE} mis à jour avec succès.`),
          variant: "success",
        });
      } else if (data.updated > 0) {
        toast({
          title: "Succès",
          description: (`${data.updated} statut(s) mis à jour avec succès.`),
          variant: "success",
        });
      }

      // Gestion des échecs
      if (data.failed && data.failed.length > 0) {
        const failedMessages = data.failed.map((f: any) => `${f.PAI_CODE}: ${f.reason}`).join(', ');
        toast({
          title: "Erreur",
          description: (`Échecs de mise à jour: ${failedMessages}`),
          variant: "destructive",
        });
      }

      fetchPaiements();
      window.dispatchEvent(new Event("totalUpdated"));
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Erreur lors de la mise à jour du statut.",
        variant: "destructive",
      });
    } finally {
      setIsValidateStatusDialogOpen(false);
      setSelectedRowsForStatus([]);
    }
  };

  const handleDeleteVirement = (rows: any[]) => {
      if (!rows || rows.length === 0) {
          toast({
            title: "Erreur",
            description: "Aucun paiement sélectionné !",
            variant: "destructive",
          });
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

          // console.log("envoie", {url: `${API_URL}/paiements/supprimer-virements`, body});

          const { data } = await axios.delete(`${API_URL}/paiements/supprimer-virements`, {
              data: body,
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
              }
          });

          if (data.deleted > 0) {
              toast({
                title: "Succès",
                description: (`${data.deleted} paiement(s) supprimé(s) avec succès.`),
                variant: "success",
              });
              fetchPaiements();
              window.dispatchEvent(new Event("totalUpdated"));
          }

          if (data.failed && data.failed.length > 0) {
              const failedMessages = data.failed.map((f: any) => `${f.PAI_CODE}: ${f.reason}`).join(', ');
              toast({
                title: "Erreur",
                description: (`Échecs de suppression: ${failedMessages}`),
                variant: "destructive",
              });
          }
      } catch (err: any) {
          // console.error(err);
          toast({
            title: "Erreur",
            description: err?.response?.data?.message || "Erreur lors de la suppression des virements.",
            variant: "destructive",
          });
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
    taux: string;
  }

  const [stats, setStats] = useState<Stat[]>([]);

  const fetchTotals = async (ech_code: string | null = null, reg_code: string | null = null) => {
    try {
      const token = localStorage.getItem("token");

      let url = `${API_URL}/total-paiement`;
      const params: any = {};
      if (ech_code) params.ech_code = ech_code;
      if (reg_code) params.reg_code = reg_code;

      // console.log("Fetching paiements from URL:", url);

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params, // <-- ici
      });

      // console.log("Totaux reçus:", data);

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
          taux:""
        },
        {
          title: "Montant Total Retenu",
          value: formatAmount(data.total_retenu),
          // description: "Total des retenues",
          icon: DollarSign,
          color: "text-red-600",
          bgColor: "bg-red-50",
          taux:""
        },
        {
          title: "Montant Total Net à Payer",
          value: formatAmount(data.total_net),
          // description: "Somme à payer",
          icon: DollarSign,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          taux:""
        },
        {
          title: "Montant déjà Payé",
          value: formatAmount(data.total_paye),
          icon: CheckCheck,
          color: "text-green-600",
          bgColor: "bg-green-50",
          taux: formatPercent(data.taux_paiement),
        },
      ]);
    } catch (error) {
      console.error("Erreur API:", error);
    }
  };

  // les totaux lorsque l'échéance change
  useEffect(() => {
    const echCode = selectedEcheance ? selectedEcheance.ECH_CODE : null;
    const regCode = selectedRegie ? selectedRegie.REG_CODE : null;
    fetchTotals(echCode, regCode);
    fetchPaiements(echCode); 
  }, [selectedEcheance, selectedRegie]);

  useEffect(() => {
    const handleTotalUpdated = () => {
      fetchTotals(selectedEcheance ? selectedEcheance.ECH_CODE : null);
    };

    window.addEventListener("totalUpdated", handleTotalUpdated);

    return () => {
      window.removeEventListener("totalUpdated", handleTotalUpdated);
    };
  }, [selectedEcheance]);

  //  Colonnes du tableau
  const columns: Column[] = [
    {
      key: "PAI_CODE",
      title: "CODE",
      render: (value: string) => {
        const ben = paiements.find(b => b.PAI_CODE === value);
        return (
          <div  className="bg-primary/10 font-semibold text-primary">
            {ben ? ben.PAI_CODE : "—"}
          </div>
        );
      },
    },
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
          {/* <Banknote className="h-4 w-4 text-primary" /> */}
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
            {record.GUI_CODE ? `${record.GUI_CODE}` : ''}
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
        key: "VIREMENT",
        title: "VIREMENT",
        render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
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
            // When dialog is closed (either by X button or programmatically), refresh the list and stats
            if (!open) {
              fetchPaiements();
              fetchTotals(selectedEcheance ? selectedEcheance.ECH_CODE : null);
            }
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
                // Close dialog and refresh table and stats when wizard is finished
                setOpenModal(false);
                fetchPaiements();
                fetchTotals(selectedEcheance ? selectedEcheance.ECH_CODE : null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-2 
                grid-cols-1 
                sm:grid-cols-2 
                md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">

        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="hover:shadow-sm transition-shadow rounded-xl"
            >
              <CardHeader className="p-2 pb-0">
                <div className="flex flex-row items-start justify-between">
                  
                  {/* Icône + taux */}
                  <div className="flex items-center gap-2">
                    <div className={`${stat.bgColor} p-1.5 rounded-md`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>

                    {stat.taux && (
                      <span className="text-[14px] font-semibold text-gray-600">
                        {stat.taux}
                      </span>
                    )}
                  </div>

                  {/* Titre */}
                  <CardTitle className="text-xs font-semibold text-right">
                    {stat.title}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="px-2 pb-2"> 
                <div className="text-lg font-bold text-right leading-tight">                  
                    {stat.value} 
                </div> 
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
            // onValidateVirement={can.onValidateVirement ? handleValidateVirement : undefined}
            // onStatusUpdate={can.onStatusUpdate ? handleStatusUpdate : undefined}
            rowKey="PAI_CODE"
            filterItems={echeances.map((e) => ({
              ...e,
              label: `Échéance : ${e.ECH_LIBELLE}`
            }))}
            rowKey2="PAI_CODE"
              filterItems2={showRegieFilter ? regies.map((e) => ({
              ...e,
              label: `Régie : ${e.REG_SIGLE}`
            })) : undefined}
            rowKey3="PAI_CODE"
            filterItems3={statutOptions}
            filterDisplay={(it: any) => it.label || it.ECH_LIBELLE}
            filterDisplay2={showRegieFilter ? ((it) => it.label || it.REG_SIGLE) : undefined}
            filterDisplay3={(it: any) => it.label || it.PAI_STATUT}
            onFilterSelect={(it) => setSelectedEcheance(it)}
            onFilterSelect2={showRegieFilter ? (it) => setSelectedRegie(it) : undefined}
            onFilterSelect3={(it) => setSelectedStatut(it.value)}
            onEdit={can.onEdit ? handleEdit : undefined}
            onDelete={can.onDelete ? handleDelete : undefined}
            addButtonText="Nouveau"
            // onDeleteAll={can.onDeleteAll ? handleDeleteVirement : undefined}
            searchPlaceholder="Rechercher un bénéficiaire..."
            onSearchChange={(value: string) => setSearchTerm(value)}
            filterPlaceholder="Filtrer par échéance..."
            onSearchChange2={(value: string) => setSearchTerm(value)}            
            filterPlaceholder2={showRegieFilter ? "Filtrer par régie..." : undefined}
            onSearchChange3={(value: string) => setSearchTerm(value)}
            filterPlaceholder3="Filtrer par statut..."
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
          // fetchPaiements();
        }}
        paiement={selectedPaiement}
      />
    </div>
  );
}