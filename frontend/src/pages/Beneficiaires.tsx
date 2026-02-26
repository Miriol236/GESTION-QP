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
import { User, ChartColumnIncreasing, CheckCheck, Search, X } from "lucide-react";
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

  const { toast } = useToast();

  const { user } = useAuth();
  const grpCodeUser = user?.GRP_CODE || null; 

  // Récupérer NIV_CODE du groupe
  const nivCode = user?.groupe?.NIV_CODE || null;


  // Permissions par groupe (si besoin on peut externaliser)
  const can = {
    onAdd: grpCodeUser === "0003",       // seuls les bénéficiaire peuvent ajouter
    onEdit: grpCodeUser === "0003",      // idem pour éditer
    onDelete: grpCodeUser === "0003",    // idem pour supprimer
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

  // Fonction à passer au dialog
  const handleApplyFilter = ({ type }: { type: any | null }) => {
    setSelectedType(type);
    // ici tu peux filtrer tes données selon le type si besoin
  };

  //  Charger les bénéficiaires depuis l’API
  const fetchBeneficiaires = async () => {
    // setIsLoading(true);
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

    return (
      matchesSearch &&
      matchesTypeBen &&
      matchesFonction &&
      matchesPosition
    );
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

  // Mettre à jour le statut pour les lignes sélectionnées (appelée depuis DataTable)
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
        url += `/${selectedRowsForStatus[0].BEN_CODE}`; // route single
      } else {
        body = { ids: selectedRowsForStatus.map(r => r.BEN_CODE) }; // route multiple
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

      // Gestion des échecs
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

  //  Colonnes du tableau
  const columns: Column[] = [
    {
      key: "BEN_CODE",
      title: "CODE",
      render: (value: string) => {
        const ben = beneficiaires.find(b => b.BEN_CODE === value);
        return (
          <div  className="bg-primary/10">
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
            <span>{row.BEN_NOM} {row.BEN_PRENOM}</span>
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
            <div>
              Non défini
            </div>
          );
        }

        const isMale = value === "M";

        return (
          <div>
            {isMale ? "Masculin" : "Féminin"}
          </div>
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
        const pos = positions.find(p => p.POS_CODE === value);
        return (
          <div>
            {pos ? pos.POS_LIBELLE : "—"}
          </div>
        );
      },
    },
    {
      key: "BEN_STATUT",
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
              <Badge className="bg-green-500/20 text-green-700">
                Approuvé
              </Badge>
            );          

          default:
            return (
              <Badge className="bg-gray-500/20 text-gray-700">
                Statut inconnu
              </Badge>
            );
        }
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

            <div className="flex gap-2">
              <BeneficiaireExportModal
                selectedTypeBen={selectedTypeBen} // filtre parent
                open={openExportModal}           // contrôle ouverture
                onOpenChange={setOpenExportModal} // Radix Dialog appelle ça à la fermeture ou ouverture
              />
            </div>
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

      {/* Barre de recherche */}
      <div className="flex gap-4 mb-4 bg-sky-100 p-3 rounded-lg shadow-sm">
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
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Rechercher (Code, Matricule solde, Nom et Prénom)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500"
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
              <div className="flex items-center gap-2 flex-wrap">

                {/* Compteur */}
                <span className="text-xs font-semibold text-gray-600 mr-1">
                  Filtres ({activeCount})
                </span>

                {/* Type */}
                {selectedTypeBen && (
                  <span className="flex items-center gap-1 text-xs font-medium text-black bg-sky-100 px-2 py-0.5 rounded-full">
                    {selectedTypeBen.TYP_LIBELLE}
                    <button
                      type="button"
                      title={`Supprimer le filtre ${selectedTypeBen.TYP_LIBELLE}`}
                      className="ml-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-md p-1 transition-colors"
                      onClick={() => setSelectedTypeBen(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}

                {/* Fonction */}
                {selectedFonction && (
                  <span className="flex items-center gap-1 text-xs font-medium text-black bg-sky-100 px-2 py-0.5 rounded-full">
                    {selectedFonction.FON_LIBELLE}
                    <button
                      type="button"
                      title={`Supprimer le filtre ${selectedFonction.FON_LIBELLE}`}
                      className="ml-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-md p-1 transition-colors"
                      onClick={() => setSelectedFonction(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}

                {/* Position */}
                {selectedPosition && (
                  <span className="flex items-center gap-1 text-xs font-medium text-black bg-sky-100 px-2 py-0.5 rounded-full">
                    {selectedPosition.POS_LIBELLE}
                    <button
                      type="button"
                      title={`Supprimer le filtre ${selectedPosition.POS_LIBELLE}`}
                      className="ml-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-md p-1 transition-colors"
                      onClick={() => setSelectedPosition(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}

                {/* Tout effacer → seulement si ≥ 2 */}
                {activeCount >= 2 && (
                  <button
                    type="button"
                    className="ml-2 text-xs text-red-600 hover:text-red-700 underline"
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
        // onDeleteAll={(rows) => (rows)}
        searchable={false}
        // onPrint={handlePrint}
      />

      {/* Confirmation suppression */}
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={beneficiaireToDelete ? `bénéficiaire ${beneficiaireToDelete.BEN_NOM}  ${beneficiaireToDelete.BEN_PRENOM}` : ""}
      />

      {/* Confirmation validation statut */}
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
          // fetchBeneficiaires();
        }}
        beneficiaire={selectedBeneficiaire}
      />
    </div>
  );
}