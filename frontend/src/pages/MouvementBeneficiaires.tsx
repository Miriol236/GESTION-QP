import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import BeneficiairePreviewModal2 from "./BeneficiairePreviewModal2";
import ConfirmValidateDialog from "@/components/common/ConfirmValidateDialog";
import ConfirmRejetDialog from "@/components/common/ConfirmRejetDialog";
import { useToast } from "@/hooks/use-toast";

export default function MouvementBeneficiaires() {
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState<any>(null);
  const [selectedRowsForStatus, setSelectedRowsForStatus] = useState<any[]>([]);
  const [isValidateStatusDialogOpen, setIsValidateStatusDialogOpen] = useState(false);
  const [isRejetStatusDialogOpen, setIsRejetStatusDialogOpen] = useState(false);
  const { toast } = useToast();

  // Charger les bénéficiaires depuis l’API
  const fetchBeneficiaires = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/mouvements/beneficiaires`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBeneficiaires(data.data ?? []);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description:"Erreur lors du chargement des mouvements des bénéficiaires.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaires();
  }, []);

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

    let url = `${API_URL}/beneficiaires/approuver`;
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
        description: (`Approbation effectuée avec succès.`),
        variant: "success",
        });
    } else if (data.updated > 0) {
        toast({
        title: "Succès",
        description: (`${data.updated} Approbation(s) effectuée(s) avec succès.`),
        variant: "success",
        });
    }

    // Gestion des échecs
    if (data.failed && data.failed.length > 0) {
        const failedMessages = data.failed.map((f: any) => `${f.BEN_CODE}: ${f.reason}`).join(', ');
        toast({
        title: "Erreur",
        description: (`Échecs d'approbation: ${failedMessages}`),
        variant: "destructive",
        });
    }

    fetchBeneficiaires();
    window.dispatchEvent(new Event("totalUpdated"));
    } catch (err: any) {
    console.error(err);
    toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Erreur lors d\'approbation.",
        variant: "destructive",
    });
    } finally {
    setIsValidateStatusDialogOpen(false);
    setSelectedRowsForStatus([]);
    }
};

const handleRejetStatusUpdate = (rows: any[]) => {
    if (!rows || rows.length === 0) {
    toast({
        title: "Erreur",
        description: "Aucun bénéficiaire sélectionné !",
        variant: "destructive",
    });
    return;
    }

    setSelectedRowsForStatus(rows);
    setIsRejetStatusDialogOpen(true);
};

const handleConfirmRejetStatus = async (motif: string) => {
    if (!selectedRowsForStatus || selectedRowsForStatus.length === 0) return;

    if (!motif || !motif.trim()) {
        toast({
            title: "Erreur",
            description: "Veuillez saisir un motif de rejet.",
            variant: "destructive",
        });
        return;
    } 

    try {
    const token = localStorage.getItem("token");

    let url = `${API_URL}/beneficiaires/rejeter`;
    let body: any = {};

    if (selectedRowsForStatus.length === 1) {
        url += `/${selectedRowsForStatus[0].BEN_CODE}`; // route single
        body.BEN_MOTIF_REJET = motif; //  ajout du motif pour paiement unique
    } else {
        body = {
            ids: selectedRowsForStatus.map(r => r.BEN_CODE),
            BEN_MOTIF_REJET: motif //  ajout du motif pour paiement multiple
        };
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
        description: (`Rejet effectué avec succès.`),
        variant: "success",
        });
    } else if (data.updated > 0) {
        toast({
        title: "Succès",
        description: (`${data.updated} Rejet(s) effectué(s) avec succès.`),
        variant: "success",
        });
    }

    // Gestion des échecs
    if (data.failed && data.failed.length > 0) {
        const failedMessages = data.failed.map((f: any) => `${f.BEN_CODE}: ${f.reason}`).join(', ');
        toast({
        title: "Erreur",
        description: (`Échecs du rejet: ${failedMessages}`),
        variant: "destructive",
        });
    }

    fetchBeneficiaires();
    window.dispatchEvent(new Event("totalUpdated"));
    } catch (err: any) {
    console.error(err);
    toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Erreur lors du rejet.",
        variant: "destructive",
    });
    } finally {
    setIsRejetStatusDialogOpen(false);
    setSelectedRowsForStatus([]);
    }
};

  // Colonnes du tableau
  const columns: Column[] = [
    {
      key: "BENEFICIAIRE",
      title: "BÉNÉFICIAIRE",
      render: (value: string) => (
        <span className="font-medium text-gray-800">{value}</span>
      ),
    },
    {
      key: "BEN_SEXE",
      title: "SEXE",
      render: (value) => {
        if (value !== "M" && value !== "F") {
          return (
            <div className="bg-gray-500/20 text-gray-700">
              Non défini
            </div>
          );
        }

        const isMale = value === "M";

        return (
          <div
            // variant={isMale ? "default" : "secondary"}
            className={
              isMale
                ? "bg-blue-500/20 text-blue-700"
                : "bg-pink-500/20 text-pink-700"
            }
          >
            {isMale ? "Masculin" : "Féminin"}
          </div>
        );
      },
    },
    {
      key: "TYPE_BENEFICIAIRE",
      title: "TYPE DE BENEFICIARE",
        render: (value: string) => (
            <span className="font-medium text-gray-800">{value || "_"}</span>
        ),
    },
    {
      key: "POSITION",
      title: "POSITION",
      render: (value: string) => (
        <span className="font-medium text-gray-800">{value || "_"}</span>
      ),
    },
    {
      key: "BEN_STATUT",
      title: "STATUT",
      render: (value) => {
        switch (value) {

          case 2:
            return (
              <Badge className="bg-orange-500/20 text-orange-700">
                En attente d’approbation…
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
    },
    {
      key: "MVT_DATE",
      title: "DATE MOUVEMENT",
      render: (value: string) => (
        <span className="font-medium text-gray-800">{value || "_"}</span>
      ),
    },
    {
      key: "MVT_CREER_PAR",
      title: "GESTIONNAIRE",
      render: (value: string) => (
        <span className="font-semibold text-gray-700">{value || "—"}</span>
      ),
    },
  ];

  if (isLoading) return <TableSkeleton />;

  return (
  <div className="space-y-6 overflow-hidden h-full">
    {/* En-tête */}
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-xl font-bold text-primary">
          Liste des bénéficiaires en attente d'approbaton
        </h1>
      </div>
    </div>

    {/* Liste des bénéficiaires */}
    <Card > 
      <DataTable
        title={`Effectif (${beneficiaires.length})`}
        columns={columns}
        data={beneficiaires ?? []}
        onView={(b) => {
          setSelectedBeneficiaire(b);
          setTimeout(() => setOpenPreview(true), 0); // laisse le temps à selectedBeneficiaire d'être défini
        }}
        onValidate2={handleStatusUpdate}
        onRejet={handleRejetStatusUpdate}
        searchPlaceholder="Rechercher (Nom et Prénom...)"
      />
    </Card>
    {selectedBeneficiaire && (
      <BeneficiairePreviewModal2
        open={true}
        onClose={() => {
          setSelectedBeneficiaire(null);
          fetchBeneficiaires();
        }}
        beneficiaire={selectedBeneficiaire}
      />
    )}

    <ConfirmValidateDialog
        open={isValidateStatusDialogOpen}
        onClose={() => setIsValidateStatusDialogOpen(false)}
        onConfirm={handleConfirmValidateStatus}
        itemName={selectedRowsForStatus.length > 0 ? `${selectedRowsForStatus.length} bénéficiaire(s) sélectionné(s)` : ""}
    />

    <ConfirmRejetDialog
        open={isRejetStatusDialogOpen}
        onClose={() => setIsRejetStatusDialogOpen(false)}
        onConfirm={handleConfirmRejetStatus}
        itemName={selectedRowsForStatus.length > 0 ? `${selectedRowsForStatus.length} bénéficiaire(s) sélectionné(s)` : ""}
    />
  </div>
);
}