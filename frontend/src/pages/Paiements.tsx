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
import { User, DollarSign, CheckCheck, Banknote, Search, X, Filter, Square, SquareSigma, DollarSignIcon } from "lucide-react";
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

  const { user } = useAuth();
  const regCodeUser = user?.REG_CODE || null;
  const showRegie = !regCodeUser;
  const nivCode = user?.groupe?.NIV_CODE || null;
  const grpCodeUser = user?.GRP_CODE || null;

  const can = {
    onAdd: grpCodeUser === "0003",
    onGenerate: grpCodeUser === "0003",
    onEdit: grpCodeUser === "0003",
    onDelete: grpCodeUser === "0003",
    onViews: true,
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

  const fetchPaiements = async (ech_code: string | null = null) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = ech_code
        ? `${API_URL}/paiements?ech_code=${ech_code}`
        : `${API_URL}/paiements`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
    const matchesSearch =
      !searchTerm ||
      String(p.BEN_CODE).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.BEN_MATRICULE).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.PAI_BENEFICIAIRE).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEcheance = !selectedEcheance || p.ECH_CODE === selectedEcheance.ECH_CODE;
    const matchesRegie = !selectedRegie || p.REG_CODE === selectedRegie.REG_CODE;
    const matchesStatut = selectedStatut === null || p.PAI_STATUT === selectedStatut;
    const matchesTypeBen = !selectedTypeBen || p.TYP_CODE === selectedTypeBen.TYP_CODE;

    return matchesSearch && matchesEcheance && matchesRegie && matchesStatut && matchesTypeBen;
  });

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
        url += `/${selectedRowsForVirement[0].PAI_CODE}`;
      } else {
        body = { ids: selectedRowsForVirement.map(r => r.PAI_CODE) };
      }

      const { data } = await axios.put(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (selectedRowsForVirement.length === 1) {
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
        url += `/${selectedRowsForStatus[0].PAI_CODE}`;
      } else {
        body = { ids: selectedRowsForStatus.map(r => r.PAI_CODE) };
      }

      const { data } = await axios.put(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (selectedRowsForStatus.length === 1) {
        toast({
          title: "Succès",
          description: `Soumission du paiement à l'approbation effectuée avec succès.`,
          variant: "success",
        });
      } else if (data.updated > 0) {
        toast({
          title: "Succès",
          description: `${data.updated} Soumission(s) effectuée(s) avec succès.`,
          variant: "success",
        });
      }

      if (data.failed && data.failed.length > 0) {
        const failedMessages = data.failed.map((f: any) => `${f.PAI_CODE}: ${f.reason}`).join(', ');
        toast({
          title: "Erreur",
          description: `Échecs de soumission: ${failedMessages}`,
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
          description: `${data.deleted} paiement(s) supprimé(s) avec succès.`,
          variant: "success",
        });
        fetchPaiements();
        window.dispatchEvent(new Event("totalUpdated"));
      }

      if (data.failed && data.failed.length > 0) {
        const failedMessages = data.failed.map((f: any) => `${f.PAI_CODE}: ${f.reason}`).join(', ');
        toast({
          title: "Erreur",
          description: `Échecs de suppression: ${failedMessages}`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
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

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const formatAmount = (a: number) =>
        Number(a).toLocaleString("fr-FR") + " F CFA";
      const formatPercent = (p: number) => p.toFixed(2) + " %";

      setStats([
        {
          title: "Montant Total Gain",
          value: formatAmount(data.total_gain),
          icon: DollarSign,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-950/30",
          taux: "",
        },
        {
          title: "Montant Total Retenu",
          value: formatAmount(data.total_retenu),
          icon: DollarSign,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950/30",
          taux: "",
        },
        {
          title: "Montant Total Net à Payer",
          value: formatAmount(data.total_net),
          icon: DollarSign,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          taux: "",
        },
        {
          title: "Montant déjà Payé",
          value: formatAmount(data.total_paye),
          icon: CheckCheck,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-950/30",
          taux: formatPercent(data.taux_paiement),
        },
      ]);
    } catch (error) {
      console.error("Erreur API:", error);
    }
  };

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

  const columns: Column[] = [
    {
      key: "BEN_CODE",
      title: "CODE",
      render: (value: string) => {
        const ben = paiements.find(b => b.BEN_CODE === value);
        return (
          <div className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light px-2 py-1 rounded-md font-mono text-xs">
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
          <User className="h-4 w-4 text-primary dark:text-primary-light" />
          <span className="text-foreground dark:text-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: "BNQ_LIBELLE",
      title: "BANQUE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="text-foreground dark:text-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: "GUI_NOM",
      title: "GUICHET",
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <span className="text-foreground dark:text-foreground">
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
          <span className="text-foreground dark:text-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: "CLE_RIB",
      title: "CLE RIB",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="text-foreground dark:text-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: "VIREMENT",
      title: "VIREMENT",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="text-foreground dark:text-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: "PAI_STATUT",
      title: "STATUT",
      render: (value) => {
        const statusConfig = {
          0: { label: "Rejeté", className: "bg-destructive/10 text-destructive" },
          1: { label: "Non approuvé", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
          2: { label: "En cours d’approbation…", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
          3: { label: "Non payé", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
          4: { label: "Payé", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        
        if (!config) {
          return (
            <Badge className="bg-muted text-muted-foreground">
              Inconnu
            </Badge>
          );
        }

        return (
          <Badge className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "MONTANT_NET",
      title: "MONTANT NET",
      render: (value) => (
        <div className="text-right">
          <span className="text-foreground dark:text-foreground font-medium">
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
    <div className="space-y-6 animate-fade-in bg-background dark:bg-background text-foreground dark:text-foreground">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
              <DollarSignIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl text-foreground dark:text-foreground">
                  Gestion des paiements des quotes-parts
                </h1>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                Suivi et validation des paiements
              </p>
            </div>
          </div>

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
            if (!open) {
              fetchTotals(selectedEcheance ? selectedEcheance.ECH_CODE : null);
            }
          }}
        >
          <DialogContent
            className="max-w-4xl bg-card dark:bg-card border-border dark:border-border"
            onPointerDownOutside={(e: any) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onEscapeKeyDown={(e: any) => e.preventDefault()}
          >
            <PaiementWizard
              paiementData={isEditing ? editPaiement : null}
              onSuccess={() => {
                setOpenModal(false);
              }}
              onFinish={() => {
                setOpenModal(false);
                fetchPaiements(selectedEcheance?.ECH_CODE ?? null);
                fetchTotals(selectedEcheance ? selectedEcheance.ECH_CODE : null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="bg-card dark:bg-card hover:shadow-sm dark:hover:shadow-gray-900/30 transition-shadow rounded-xl border-border dark:border-border"
            >
              <CardHeader className="p-2 pb-0">
                <div className="flex flex-row items-start justify-between">
                  
                  <div className="flex items-center gap-2">
                    <div className={`${stat.bgColor} p-1.5 rounded-md`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>

                    {stat.taux && (
                      <span className="text-[14px] font-semibold text-muted-foreground dark:text-muted-foreground">
                        {stat.taux}
                      </span>
                    )}
                  </div>

                  <CardTitle className="text-xs font-semibold text-right text-muted-foreground dark:text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="px-2 pb-2"> 
                <div className="text-lg font-bold text-right leading-tight text-foreground dark:text-foreground">                  
                  {stat.value} 
                </div> 
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Barre de recherche */}
      <div className="flex gap-4 mb-4 bg-primary-light dark:bg-primary-light/10 p-3 rounded-lg shadow-sm border border-border dark:border-border">
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
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
          <Input
            placeholder="Rechercher (Code bénéficiaire, Matricule solde, Nom et prénom)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card dark:bg-card border-border dark:border-border focus:ring-2 focus:ring-primary dark:focus:ring-primary text-foreground dark:text-foreground"
          />
        </div>        
      </div>

      {/* Liste des paiements */}
      <DataTable
        title={`Effectif (${displayedPaiements.length})`}
        appliedFilter={
          appliedFilterPaiement && (() => {
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
              <div className="flex flex-wrap gap-2 mt-2 items-center bg-muted/50 dark:bg-muted/20 p-2 rounded-lg border border-border dark:border-border">
                <span className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground mr-1">
                  <Filter className="inline h-3 w-3 mr-1" />
                  Filtres ({activeCount})
                </span>

                {filters.map((f, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-primary-light dark:bg-primary/20 text-foreground dark:text-foreground px-2 py-1 rounded-full text-xs font-medium border border-primary/20"
                  >
                    {f.label}
                    <button
                      type="button"
                      title={`Supprimer le filtre ${f.label}`}
                      className="ml-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md p-1 transition-colors"
                      onClick={f.clear}
                    >
                      <X className="h-3.5 w-3.5"/>
                    </button>
                  </div>
                ))}

                {activeCount >= 2 && (
                  <button
                    type="button"
                    className="text-xs text-destructive hover:text-destructive/80 underline"
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
        searchable={false}
      />

      {/* Modals */}
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={paiementToDelete ? `paiement de quôte-part du bénéficiaire ${paiementToDelete.PAI_BENEFICIAIRE}` : ""}
      />

      <ConfirmDeleteDialog
        open={isDeleteAllDialogOpen}
        onClose={() => setIsDeleteAllDialogOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        itemName={selectedRowsToDelete.length > 0 ? `${selectedRowsToDelete.length} paiement(s) sélectionné(s)` : ""}
      />

      <ConfirmValidateDialog
        open={isValidateVirementDialogOpen}
        onClose={() => setIsValidateVirementDialogOpen(false)}
        onConfirm={handleConfirmValidateVirement}
        itemName={selectedRowsForVirement.length > 0 ? `${selectedRowsForVirement.length} virement(s) sélectionné(s)` : ""}
      />

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
          setIsGenerateConfirmOpen(true);
        }}
      />

      <Dialog
        open={showIgnoredModal}
        onOpenChange={(open) => {
          if (!open) return;
          setShowIgnoredModal(open);
        }}
      >
        <DialogContent
          className="sm:max-w-4xl w-11/12 max-h-[80vh] flex flex-col bg-card dark:bg-card border-border dark:border-border"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground dark:text-foreground text-lg font-semibold">
              Paiements ignorés
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 py-2 text-sm text-muted-foreground space-y-2">
            {ignoredDetails.length === 0 && (
              <p>Aucun paiement ignoré.</p>
            )}

            {ignoredDetails.some((g) => g.title === "Doublons") && (
              <p>
                <span className="font-semibold text-foreground">Doublons :</span> 
                le ou les bénéficiaires listés ci-dessous apparaissent déjà dans l'échéance active. 
                Lors de cette génération, un paiement a été enregistré pour chacun, et les doublons ont été ignorés.
              </p>
            )}

            {ignoredDetails.some((g) => g.title === "Inactifs") && (
              <p>
                <span className="font-semibold text-foreground">Inactifs :</span> 
                le ou les bénéficiaires listés ci-dessous sont actuellement inactifs. 
                Ils ne peuvent pas recevoir de paiement et ont donc été ignorés.
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2">
            <div className={`grid gap-6 ${ignoredDetails.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {ignoredDetails.map((group, idx) => (
                <div key={idx}>
                  <div className="font-bold text-foreground mb-2">
                    {group.title} ({group.items.length})
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 max-h-[60vh] pr-2">
                    {group.items.map((name: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-2 flex justify-end">
            <Button 
              onClick={() => setShowIgnoredModal(false)}
              className="bg-primary hover:bg-primary-dark text-primary-foreground"
            >
              <X className="h-4 w-4 mr-2" />
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

            const doublons: string[] = [];
            const inactifs: string[] = [];

            paiements_ignores.forEach((item: string) => {
              if (item.includes("(Inactif)")) inactifs.push(item.replace(" (Inactif)", ""));
              else if (item.includes("(Doublon)")) doublons.push(item.replace(" (Doublon)", ""));
              else doublons.push(item);
            });

            let toastTitle = "Génération terminée";
            let toastVariant: "success" | "warning" = "success";
            let toastMessage = `${paiements_copies.length} paiement(s) généré(s).`;

            if (paiements_ignores.length === total) {
              toastVariant = "warning";
              toastMessage = "Aucun paiement généré : tous sont déjà existants ou inactifs.";
            } else if (paiements_ignores.length > 0) {
              toastVariant = "success";
              toastMessage = `${paiements_copies.length} paiement(s) généré(s). ${paiements_ignores.length} ignoré(s).`;

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