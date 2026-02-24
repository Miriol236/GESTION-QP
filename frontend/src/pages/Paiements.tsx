import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import ConfirmValidateDialog from "@/components/common/ConfirmValidateDialog";
import ConfirmGenerateDialog from "@/components/common/ConfirmGenerateDialog";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import PaiementWizard from "./PaiementWizard";
import GenerateFromOldEcheanceModal from "./GenerateFromOldEcheanceModal";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { User, DollarSign, CheckCheck, Banknote, Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import PaiementPreviewModal from "./PaiementPreviewModal";
import PaiementExportModal from "./PaiementExportModal";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { DialogTitle } from "@radix-ui/react-dialog";
import PaiementFiltersDialog from "@/components/common/PaiementFiltersDialog";

export default function Paiements() {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
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
  const [selectedStatut, setSelectedStatut] = useState<number | null>(null);
  const [selectedTypeBen, setSelectedTypeBen] = useState<any | null>(null);
  const [openGenerateModal, setOpenGenerateModal] = useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);
  const [selectedEcheanceToGenerate, setSelectedEcheanceToGenerate] = useState<string | null>(null);
  const [generateProgress, setGenerateProgress] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedEcheanceToGenerateLabel, setSelectedEcheanceToGenerateLabel] = useState<string | null>(null);
  const [activeEcheance, setActiveEcheance] = useState<any | null>(null);
  const [showIgnoredModal, setShowIgnoredModal] = useState(false);
  const [ignoredDetails, setIgnoredDetails] = useState<{ title: string; items: string[] }[]>([]);
  const [openExportModal, setOpenExportModal] = useState(false);
  const { toast } = useToast();

  // Récupérer l'utilisateur courant pour déterminer les permissions
  const { user } = useAuth();
  const regCodeUser = user?.REG_CODE || null; // null si l'utilisateur n'est pas rattaché à une régie
  const showRegie = !regCodeUser;
  // Récupérer NIV_CODE du groupe
  const nivCode = user?.groupe?.NIV_CODE || null;

  // Récupérer groupe
  const grpCodeUser = user?.GRP_CODE || null;

  // Permissions par groupe (si besoin on peut externaliser)
  const can = {
    onAdd: grpCodeUser === "0003",       // seuls les bénéficiaire peuvent ajouter
    onGenerate: grpCodeUser === "0003",      // idem pour générer
    onEdit: grpCodeUser === "0003",      // idem pour éditer
    onDelete: grpCodeUser === "0003",    // idem pour supprimer
    // onDeleteAll: regCodeUser != null, // idem pour suppression multiple
    onViews: true,                     // tous peuvent voir leurs paiements
  };

  const showRegieFilter = regCodeUser === null;

  const statutOptions = [
    { label: "Tous les statuts", value: null },
    { label: "Non approuvé", value: 1 },
    { label: "En cours d’approbation", value: 2 },
    { label: "Non payé", value: 3 },
    { label: "Payé", value: 4 },
    { label: "Rejeté", value: 0 },
  ];

  const appliedFilterPaiement = [
    selectedEcheance?.ECH_LIBELLE || null,
    selectedRegie?.REG_LIBELLE || null,
    selectedStatut !== null
      ? statutOptions.find(s => s.value === selectedStatut)?.label
      : null,
    selectedTypeBen?.TYP_LIBELLE || null
  ].filter(Boolean).join(" | ");

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

  useEffect(() => {
    const fetchActiveEcheance = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_URL}/echeance/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActiveEcheance(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchActiveEcheance();
  }, []);

  //  Charger les paiements depuis l’API
  const fetchPaiements = async (ech_code: string | null = null) => {
    setIsLoading(true);
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

    axios
      .get(`${API_URL}/paiements-filters`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setEcheances(res.data.echeances);
        setRegies(res.data.regies);
        setTypes(res.data.types);
      })
      .catch(() =>
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des filtres.",
          variant: "destructive",
        })
      );
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

  const displayedPaiements = paiements.filter((p) => {
    // Recherche
    const matchesSearch =
      !searchTerm ||
      String(p.BEN_CODE).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.BEN_MATRICULE).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.PAI_BENEFICIAIRE).toLowerCase().includes(searchTerm.toLowerCase());

    // Filtre échéance
    const matchesEcheance = !selectedEcheance || p.ECH_CODE === selectedEcheance.ECH_CODE;

    // Filtre régie
    const matchesRegie = !selectedRegie || p.REG_CODE === selectedRegie.REG_CODE;

    // Filtre statut
    const matchesStatut =
      selectedStatut === null || p.PAI_STATUT === selectedStatut;

    // Filtre Type bénéficiaire
    const matchesTypeBen = !selectedTypeBen || p.TYP_CODE === selectedTypeBen.TYP_CODE;

    return matchesSearch && matchesEcheance && matchesRegie && matchesStatut && matchesTypeBen;
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
  const handleStatusUpdate = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun paiement sélectionné !",
        variant: "destructive",
      });
      return;
    }

    setSelectedRowsForStatus(rows);
    setIsValidateStatusDialogOpen(true);
  };

  const handleConfirmValidateStatus = async () => {
    if (!selectedRowsForStatus || selectedRowsForStatus.length === 0) return;

    try {
      const token = localStorage.getItem("token");

      let url = `${API_URL}/paiements/valider`;
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
          description: (`Soumission du paiement à l'approbation effectuée avec succès.`),
          variant: "success",
        });
      } else if (data.updated > 0) {
        toast({
          title: "Succès",
          description: (`${data.updated} Soumission(s) effectuée(s) avec succès.`),
          variant: "success",
        });
      }

      // Gestion des échecs
      if (data.failed && data.failed.length > 0) {
        const failedMessages = data.failed.map((f: any) => `${f.PAI_CODE}: ${f.reason}`).join(', ');
        toast({
          title: "Erreur",
          description: (`Échecs de soumission: ${failedMessages}`),
          variant: "destructive",
        });
      }

      fetchPaiements();
      window.dispatchEvent(new Event("totalUpdated"));
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Erreur lors de la soumission.",
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
      key: "BEN_CODE",
      title: "CODE",
      render: (value: string) => {
        const ben = paiements.find(b => b.BEN_CODE === value);
        return (
          <div  className="bg-primary/10">
            {ben ? ben.BEN_CODE : "—"}
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
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "BNQ_LIBELLE",
      title: "BANQUE",
      render: (value) => (
        <div className="flex items-center gap-2">
          {/* <Banknote className="h-4 w-4 text-primary" /> */}
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "GUI_NOM",
      title: "GUICHET",
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <span>
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
          <span>{value}</span>
        </div>
      ),
    },
    {
        key: "CLE_RIB",
        title: "CLE RIB",
        render: (value) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
        </div>
      ),
    },
    {
        key: "VIREMENT",
        title: "VIREMENT",
        render: (value) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "PAI_STATUT",
      title: "STATUT",
      render: (value) => {
        switch (value) {
          case 0:
            return (
              <Badge className="bg-red-500/20 text-red-700">
                Rejeté
              </Badge>
            );

          case 1:
            return (
              <Badge className="bg-blue-500/20 text-blue-700">
                Non approuvé
              </Badge>
            );

          case 2:
            return (
              <Badge className="bg-orange-500/20 text-orange-700">
                En cours d’approbation…
              </Badge>
            );
          
          case 3:
            return (
              <Badge className="bg-gray-500/20 text-gray-700">
                Non payé
              </Badge>
            );

          case 4:
            return (
              <Badge className="bg-green-500/20 text-green-700">
                Payé
              </Badge>
            );

          default:
            return (
              <Badge className="bg-gray-500/20 text-gray-700">
                Inconnu
              </Badge>
            );
        }
      },
    },
    {
      key: "MONTANT_NET",
      title: "MONTANT NET",
      render: (value) => (
        <div className="text-right">
          <span>
            {value != null ? Number(value).toLocaleString("fr-FR") : "—"}
          </span>
        </div>
      ),
    },
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
            Gestion des paiements des quotes-parts</h1>

            <div className="flex gap-2">
              <PaiementExportModal
                open={openExportModal}
                onOpenChange={setOpenExportModal}
                selectedType={selectedTypeBen || null}
                selectedRegie={selectedRegie || null}
                echeances={echeances || []}
                regies={regies || []}
                userSansRegie={showRegie}
                onRegieChange={setSelectedRegie}
                selectedEcheance={selectedEcheance} 
                onEcheanceChange={setSelectedEcheance}
              />
            </div>
        </div>        
        <Dialog
          open={openModal}
          onOpenChange={(open) => {
            setOpenModal(open);
            // When dialog is closed (either by X button or programmatically), refresh the list and stats
            if (!open) {
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
                fetchPaiements(selectedEcheance?.ECH_CODE ?? null);
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
              className="bg-sky-100 hover:shadow-sm transition-shadow rounded-xl"
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

      {/* Barre de recherche */}
      <div className="flex gap-4 mb-4 bg-sky-100 p-3 rounded-lg shadow-sm">
        <PaiementFiltersDialog
          echeances={echeances}
          regies={regies}
          types={types}
          statuts={statutOptions}
          showRegie={showRegieFilter}

          selectedEcheance={selectedEcheance}
          selectedRegie={selectedRegie}
          selectedStatut={selectedStatut}
          selectedType={selectedTypeBen}

          onApply={({ echeance, regie, statut, type }) => {
            setSelectedEcheance(echeance);
            setSelectedRegie(regie);
            setSelectedStatut(statut);
            setSelectedTypeBen(type);
          }}

          onReset={() => {
            setSelectedEcheance(null);
            setSelectedRegie(null);
            setSelectedStatut(null);
            setSelectedTypeBen(null);
          }}
        />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Rechercher (Code bénéficiaire, Matricule solde, Nom et prénom)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>        
      </div>

      {/* Liste des paiements */}
      {/* Table */}
      <DataTable
        title={`Effectif (${displayedPaiements.length})`}
        appliedFilter={
          appliedFilterPaiement && (() => {
            // Crée un tableau des filtres actifs avec leur label et action de suppression
            const filters = [];

            if (selectedEcheance) filters.push({ label: selectedEcheance.ECH_LIBELLE, clear: () => setSelectedEcheance(null) });
            if (selectedRegie) filters.push({ label: selectedRegie.REG_LIBELLE, clear: () => setSelectedRegie(null) });
            if (selectedStatut !== null && selectedStatut !== undefined) {
              const statutLabel = statutOptions.find(s => s.value === selectedStatut)?.label;
              if (statutLabel) filters.push({ label: statutLabel, clear: () => setSelectedStatut(null) });
            }
            if (selectedTypeBen) filters.push({ label: selectedTypeBen.TYP_LIBELLE, clear: () => setSelectedTypeBen(null) });

            const activeCount = filters.length;

            return (
              <div className="flex flex-wrap gap-2 mt-2 items-center">
                {/* Compteur */}
                <span className="text-xs font-semibold text-gray-600 mr-1">
                  Filtres ({activeCount})
                </span>

                {/* Badges */}
                {filters.map((f, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-sky-100 text-black px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {f.label}
                    <button
                      type="button"
                      title={`Supprimer le filtre ${f.label}`}
                      className="ml-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-md p-1 transition-colors"
                      onClick={f.clear}
                    >
                      <X className="h-3.5 w-3.5"/>
                    </button>
                  </div>
                ))}

                {/* Tout effacer → seulement si ≥ 2 filtres */}
                {activeCount >= 2 && (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-700 underline"
                    onClick={() => {
                      setSelectedEcheance(null);
                      setSelectedRegie(null);
                      setSelectedStatut(null);
                      setSelectedTypeBen(null);
                    }}
                  >
                    Tout effacer
                  </button>
                )}
              </div>
            );
          })()
        }
        columns={columns}
        data={displayedPaiements}
        onAdd={can.onAdd ? handleAdd : undefined}
        onPrint={() => setOpenExportModal(true)}
        onGenerate={can.onGenerate ? () => setOpenGenerateModal(true) : undefined} 
        onView={(b) => {
          setSelectedPaiement(b);
          setOpenPreview(true);
        }}
        onValidate={nivCode === '01' ? handleStatusUpdate : undefined}
        onEdit={can.onEdit ? handleEdit : undefined}
        onDelete={can.onDelete ? handleDelete : undefined}
        addButtonText="Nouveau"
        // onDeleteAll={can.onDeleteAll ? handleDeleteVirement : undefined}
        // searchPlaceholder="Rechercher (Code, Nom et prénom)."
        // onSearchChange={(value: string) => setSearchTerm(value)}
        searchable={false}
      />
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

      <GenerateFromOldEcheanceModal
        open={openGenerateModal}
        onClose={() => setOpenGenerateModal(false)}
        onGenerate={(ech_code) => {
          const echeance = echeances.find(e => e.ECH_CODE === ech_code);
          setSelectedEcheanceToGenerate(ech_code);
          setSelectedEcheanceToGenerateLabel(echeance?.ECH_LIBELLE || "");
          setOpenGenerateModal(false);
          setIsGenerateConfirmOpen(true); // ouvrir le dialog
        }}
      />

      <Dialog
        open={showIgnoredModal}
        onOpenChange={(open) => {
          if (!open) return; // empêche fermeture externe
          setShowIgnoredModal(open);
        }}
      >
        <DialogContent
          className="sm:max-w-4xl w-11/12 max-h-[80vh] flex flex-col"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Paiements ignorés</DialogTitle>
          </DialogHeader>

          {/* Message explicatif dynamique */}
          <div className="px-4 py-2 text-sm text-gray-700 space-y-2">
            {ignoredDetails.length === 0 && (
              <p>Aucun paiement ignoré.</p>
            )}

            {ignoredDetails.some((g) => g.title === "Doublons") && (
              <p>
                <span className="font-semibold">Doublons :</span> 
                le ou les bénéficiaires listés ci-dessous apparaissent déjà dans l'échéance active. 
                Lors de cette génération, un paiement a été enregistré pour chacun, et les doublons ont été ignorés.
              </p>
            )}

            {ignoredDetails.some((g) => g.title === "Inactifs") && (
              <p>
                <span className="font-semibold">Inactifs :</span> 
                le ou les bénéficiaires listés ci-dessous sont actuellement inactifs. 
                Ils ne peuvent pas recevoir de paiement et ont donc été ignorés.
              </p>
            )}
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            <div className={`grid gap-6 ${ignoredDetails.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {ignoredDetails.map((group, idx) => (
                <div key={idx}>
                  <div className="font-bold text-gray-800 mb-2">
                    {group.title} ({group.items.length})
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 max-h-[60vh] pr-2">
                    {group.items.map((name: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700">
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-2 flex justify-end">
            <Button onClick={() => setShowIgnoredModal(false)}>
              <X />
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmGenerateDialog
        open={isGenerateConfirmOpen}
        onClose={() => setIsGenerateConfirmOpen(false)}
        echCode={selectedEcheanceToGenerate}
        echLibelle={selectedEcheanceToGenerateLabel}
        activeEcheance={activeEcheance} 
        onConfirm={async (ech_code, onProgress) => {
          if (!ech_code) return;

          try {
            setIsGenerating(true);
            setGenerateProgress(10);
            onProgress?.(10);

            const token = localStorage.getItem("token");

            // Progression visuelle
            let fakeProgress = 10;
            const interval = setInterval(() => {
              fakeProgress = Math.min(fakeProgress + 5, 90);
              setGenerateProgress(fakeProgress);
              onProgress?.(fakeProgress);
            }, 400);

            const response = await axios.post(
              `${API_URL}/paiements/generate`,
              { ECH_CODE_OLD: ech_code },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const { message, paiements_copies, paiements_ignores, total } = response.data;

            // Séparer les ignorés
            const doublons: string[] = [];
            const inactifs: string[] = [];

            paiements_ignores.forEach((item: string) => {
              if (item.includes("(Inactif)")) inactifs.push(item.replace(" (Inactif)", ""));
              else if (item.includes("(Doublon)")) doublons.push(item.replace(" (Doublon)", ""));
              else doublons.push(item);
            });

            // Préparer le toast
            let toastTitle = "Génération terminée";
            let toastVariant: "success" | "warning" = "success";
            let toastMessage = `${paiements_copies.length} paiement(s) généré(s).`;

            if (paiements_ignores.length === total) {
              toastVariant = "warning";
              toastMessage = "Aucun paiement généré : tous sont déjà existants ou inactifs.";
            } else if (paiements_ignores.length > 0) {
              toastVariant = "success";
              toastMessage = `${paiements_copies.length} paiement(s) généré(s). ${paiements_ignores.length} ignoré(s).`;

              // Préparer le modal
              const ignoredList: { title: string; items: string[] }[] = [];
              if (doublons.length > 0) ignoredList.push({ title: "Doublons", items: doublons });
              if (inactifs.length > 0) ignoredList.push({ title: "Inactifs", items: inactifs });

              setIgnoredDetails(ignoredList);
              setShowIgnoredModal(true);
            }

            toast({
              title: toastTitle,
              description: toastMessage,
              variant: toastVariant,
            });

            clearInterval(interval);
            setGenerateProgress(100);
            onProgress?.(100);

            fetchPaiements();
            fetchTotals(null);

          } catch (err: any) {
            toast({
              title: "Erreur",
              description: err?.response?.data?.message || "Erreur lors de la génération.",
              variant: "destructive",
            });
          } finally {
            setTimeout(() => {
              setIsGenerating(false);
              setGenerateProgress(0);
              setIsGenerateConfirmOpen(false);
              setSelectedEcheanceToGenerate(null);
            }, 500);
          }
        }}
      />
    </div>
  );
}