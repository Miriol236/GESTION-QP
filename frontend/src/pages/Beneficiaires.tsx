import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import BeneficiaireWizard from "./BeneficiaireWizard";
import ConfirmValidateDialog from "@/components/common/ConfirmValidateDialog";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import BeneficiairePreviewModal from "./BeneficiairePreviewModal";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { User, ChartColumnIncreasing, CheckCheck, Search, X, Filter, Users } from "lucide-react";
import BeneficiaireExportModal from "./BeneficiaireExportModal";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import BeneficiaireFiltersDialog from "@/components/common/BeneficiaireFiltersDialog";

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
  const [selectedRowsForStatus, setSelectedRowsForStatus] = useState<any[]>([]);
  const [isValidateStatusDialogOpen, setIsValidateStatusDialogOpen] = useState(false);
  const [selectedTypeBen, setSelectedTypeBen] = useState<any | null>(null);
  const [selectedFonction, setSelectedFonction] = useState<any | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<any | null>(null);
  const [openExportModal, setOpenExportModal] = useState(false);
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();
  const { user } = useAuth();
  const grpCodeUser = user?.GRP_CODE || null; 
  const nivCode = user?.groupe?.NIV_CODE || null;

  const can = {
    onAdd: grpCodeUser === "0003",
    onEdit: grpCodeUser === "0003",
    onDelete: grpCodeUser === "0003",
    onViews: true,
  };

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

  const handleApplyFilter = ({ type }: { type: any | null }) => {
    setSelectedType(type);
  };

  const fetchBeneficiaires = async () => {
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

  const normalize = (s: any) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const displayed = beneficiaires.filter((p) => {
    const search = normalize(searchTerm);
    const words = search.split(" ").filter(Boolean);
    const full = normalize(`${p.BEN_NOM} ${p.BEN_PRENOM}`);

    const matchesSearch =
      !search ||
      normalize(p.BEN_CODE).includes(search) ||
      normalize(p.BEN_MATRICULE).includes(search) ||
      words.every((w) => full.includes(w));

    const matchesTypeBen =
      !selectedTypeBen || p.TYP_CODE === selectedTypeBen.TYP_CODE;
    const matchesFonction =
      !selectedFonction || p.FON_CODE === selectedFonction.FON_CODE;
    const matchesPosition =
      !selectedPosition || p.POS_CODE === selectedPosition.POS_CODE;

    return matchesSearch && matchesTypeBen && matchesFonction && matchesPosition;
  });

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

  const handleStatusUpdate = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun bénéficiaire sélectionné !",
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

      let url = `${API_URL}/beneficiaires/valider`;
      let body = {};

      if (selectedRowsForStatus.length === 1) {
        url += `/${selectedRowsForStatus[0].BEN_CODE}`;
      } else {
        body = { ids: selectedRowsForStatus.map(r => r.BEN_CODE) };
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
          description: (`Soumission du bénéficiaire à l'approbation effectuée avec succès.`),
          variant: "success",
        });
      } else if (data.updated > 0) {
        toast({
          title: "Succès",
          description: (`${data.updated} Soumission(s) effectuée(s) avec succès.`),
          variant: "success",
        });
      }

      if (data.failed && data.failed.length > 0) {
        const failedMessages = data.failed.map((f: any) => `${f.BEN_CODE}: ${f.reason}`).join(', ');
        toast({
          title: "Erreur",
          description: (`Échecs de soumission: ${failedMessages}`),
          variant: "destructive",
        });
      }

      fetchBeneficiaires();
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

  const columns: Column[] = [
    {
      key: "BEN_CODE",
      title: "CODE",
      render: (value: string) => {
        const ben = beneficiaires.find(b => b.BEN_CODE === value);
        return (
          <div className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light px-2 py-1 rounded-md font-mono text-xs">
            {ben ? ben.BEN_CODE : "—"}
          </div>
        );
      },
    },
    {
      key: "BEN_NOM",
      title: "BÉNÉFICIAIRE",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
              {row.BEN_NOM} {row.BEN_PRENOM}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {row.BEN_MATRICULE || "Sans matricule"}
            </span>
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
            <span className="text-gray-500 dark:text-gray-400 text-sm">Non défini</span>
          );
        }
        const isMale = value === "M";
        return (
          <span className={`text-sm ${isMale ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400"}`}>
            {isMale ? "Masculin" : "Féminin"}
          </span>
        );
      },
    },
    {
      key: "TYP_CODE",
      title: "TYPE DE BENEFICIARE",
      render: (value: string) => {
        const typ = types.find(t => t.TYP_CODE === value);
        return (
          <span className="text-gray-700 dark:text-gray-300 text-sm">
            {typ ? typ.TYP_LIBELLE : "—"}
          </span>
        );
      },
    },
    {
      key: "POS_CODE",
      title: "POSITION",
      render: (value: string) => {
        const pos = positions.find(p => p.POS_CODE === value);
        return (
          <span className="text-gray-700 dark:text-gray-300 text-sm">
            {pos ? pos.POS_LIBELLE : "—"}
          </span>
        );
      },
    },
    {
      key: "BEN_STATUT",
      title: "STATUT",
      render: (value) => {
        const statusConfig = {
          0: { label: "Rejeté", className: "bg-red-500/20 dark:bg-red-500/30 text-red-700 dark:text-red-300" },
          1: { label: "Non approuvé", className: "bg-blue-500/20 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300" },
          2: { label: "En cours d’approbation…", className: "bg-orange-500/20 dark:bg-orange-500/30 text-orange-700 dark:text-orange-300" },
          3: { label: "Approuvé", className: "bg-green-500/20 dark:bg-green-500/30 text-green-700 dark:text-green-300" },
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        
        if (!config) {
          return (
            <Badge className="bg-gray-500/20 dark:bg-gray-500/30 text-gray-700 dark:text-gray-300">
              Statut inconnu
            </Badge>
          );
        }

        return (
          <Badge className={config.className}>
            {config.label}
          </Badge>
        );
      },
    }
  ];

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in bg-background dark:bg-background text-foreground dark:text-foreground">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <div className="space-y-1 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 bg-primary rounded-full"></div>
              <h1 className="text-2xl font-family tracking-wide text-foreground dark:text-foreground">
                Gestion des bénéficiaires des quotes-parts
              </h1>
            </div>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground pl-4">
              Informations personnelles et bancaires
            </p>
          </div>

          <div className="flex gap-2">
            <BeneficiaireExportModal
              selectedTypeBen={selectedTypeBen}
              open={openExportModal}
              onOpenChange={setOpenExportModal}
            />
          </div>
        </div>
        <Dialog
          open={openModal}
          onOpenChange={(open) => {
            setOpenModal(open);
            if (!open) fetchBeneficiaires();
          }}
        >
          <DialogContent
            className="max-w-4xl bg-card dark:bg-card border-border dark:border-border"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <BeneficiaireWizard
              beneficiaireData={isEditing ? editBeneficiaire : null}
              onSuccess={() => setOpenModal(false)}
              onFinish={() => fetchBeneficiaires()}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Barre de recherche */}
      <div className="flex gap-4 mb-4 bg-primary-light dark:bg-primary-light/10 p-3 rounded-lg shadow-sm border border-border dark:border-border">
        <BeneficiaireFiltersDialog
          types={types}
          fonctions={fonctions}
          positions={positions}
          selectedType={selectedTypeBen}
          selectedFonction={selectedFonction}
          selectedPosition={selectedPosition}
          onApply={({ type, fonction, position }) => {
            setSelectedTypeBen(type);
            setSelectedFonction(fonction);
            setSelectedPosition(position);
          }}
          onReset={() => {
            setSelectedTypeBen(null);
            setSelectedFonction(null);
            setSelectedPosition(null);
          }}
        />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
          <Input
            placeholder="Rechercher (Code, Matricule solde, Nom et Prénom)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card dark:bg-card border-border dark:border-border focus:ring-2 focus:ring-primary dark:focus:ring-primary"
          />
        </div>        
      </div>

      {/* Table */}
      <DataTable
        title={`Effectif (${displayed.length})`}
        appliedFilter={
          (selectedTypeBen || selectedFonction || selectedPosition) && (() => {
            const activeCount = [selectedTypeBen, selectedFonction, selectedPosition].filter(Boolean).length;

            return (
              <div className="flex items-center gap-2 flex-wrap bg-muted/50 dark:bg-muted/20 p-2 rounded-lg border border-border dark:border-border">
                <span className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground mr-1">
                  <Filter className="inline h-3 w-3 mr-1" />
                  Filtres ({activeCount})
                </span>

                {selectedTypeBen && (
                  <span className="flex items-center gap-1 text-xs font-medium bg-primary-light dark:bg-primary/20 text-primary dark:text-primary-light px-2 py-1 rounded-full border border-primary/20">
                    {selectedTypeBen.TYP_LIBELLE}
                    <button
                      type="button"
                      className="ml-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md p-1 transition-colors"
                      onClick={() => setSelectedTypeBen(null)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {selectedFonction && (
                  <span className="flex items-center gap-1 text-xs font-medium bg-primary-light dark:bg-primary/20 text-primary dark:text-primary-light px-2 py-1 rounded-full border border-primary/20">
                    {selectedFonction.FON_LIBELLE}
                    <button
                      type="button"
                      className="ml-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md p-1 transition-colors"
                      onClick={() => setSelectedFonction(null)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {selectedPosition && (
                  <span className="flex items-center gap-1 text-xs font-medium bg-primary-light dark:bg-primary/20 text-primary dark:text-primary-light px-2 py-1 rounded-full border border-primary/20">
                    {selectedPosition.POS_LIBELLE}
                    <button
                      type="button"
                      className="ml-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md p-1 transition-colors"
                      onClick={() => setSelectedPosition(null)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {activeCount >= 2 && (
                  <button
                    type="button"
                    className="ml-2 text-xs text-destructive hover:text-destructive/80 underline"
                    onClick={() => {
                      setSelectedTypeBen(null);
                      setSelectedFonction(null);
                      setSelectedPosition(null);
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
        data={displayed}
        onPrint={() => setOpenExportModal(true)}
        onAdd={can.onAdd ? handleAdd : undefined}
        onValidate={nivCode === '01' ? handleStatusUpdate : undefined}
        rowKey="BEN_CODE"
        onView={(b) => {
          setSelectedBeneficiaire(b);
          setOpenPreview(true);
        }}
        onEdit={can.onEdit ? handleEdit : undefined}
        onDelete={can.onDelete ? handleDelete : undefined}
        addButtonText="Nouveau"
        searchable={false}
      />

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={beneficiaireToDelete ? `bénéficiaire ${beneficiaireToDelete.BEN_NOM} ${beneficiaireToDelete.BEN_PRENOM}` : ""}
      />

      <ConfirmValidateDialog
        open={isValidateStatusDialogOpen}
        onClose={() => setIsValidateStatusDialogOpen(false)}
        onConfirm={handleConfirmValidateStatus}
        itemName={selectedRowsForStatus.length > 0 ? `${selectedRowsForStatus.length} bénéficiaire(s) sélectionné(s)` : ""}
      />
      
      <BeneficiairePreviewModal
        open={openPreview}
        onClose={() => {
          setOpenPreview(false);
        }}
        beneficiaire={selectedBeneficiaire}
      />
    </div>
  );
}