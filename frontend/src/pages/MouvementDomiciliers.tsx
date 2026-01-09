import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import DomicilierPreviewModal from "./DomicilierPreviewModal";
import ConfirmValidateDialog from "@/components/common/ConfirmValidateDialog";
import ConfirmRejetDialog from "@/components/common/ConfirmRejetDialog";
import { useToast } from "@/hooks/use-toast";

export default function MouvementDomiciliers() {
  const [domiciliers, setDomiciliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedDomicilier, setSelectedDomicilier] = useState<{
    beneficiaire: any;
    domiciliations: any[];
    } | null>(null);
  const [selectedRowsForStatus, setSelectedRowsForStatus] = useState<any[]>([]);
  const [isValidateStatusDialogOpen, setIsValidateStatusDialogOpen] = useState(false);
  const [isRejetStatusDialogOpen, setIsRejetStatusDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchDomiciliers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/mouvements/domiciliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDomiciliers(data.data ?? []);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description:"Erreur lors du chargement des mouvements des domiciliations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDomiciliers();
  }, []);

  // Mettre à jour le statut pour les lignes sélectionnées (appelée depuis DataTable)
const handleStatusUpdate = (rows: any[]) => {
    if (!rows || rows.length === 0) {
    toast({
        title: "Erreur",
        description: "Aucun RIB sélectionné !",
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

    let url = `${API_URL}/domiciliers/approuver`;
    let body = {};

    if (selectedRowsForStatus.length === 1) {
        url += `/${selectedRowsForStatus[0].DOM_CODE}`; // route single
    } else {
        body = { ids: selectedRowsForStatus.map(r => r.DOM_CODE) }; // route multiple
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
        const failedMessages = data.failed.map((f: any) => `${f.DOM_CODE}: ${f.reason}`).join(', ');
        toast({
        title: "Erreur",
        description: (`Échecs d'approbation: ${failedMessages}`),
        variant: "destructive",
        });
    }

    fetchDomiciliers();
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
        description: "Aucun RIB sélectionné !",
        variant: "destructive",
    });
    return;
    }

    setSelectedRowsForStatus(rows);
    setIsRejetStatusDialogOpen(true);
};

const handleConfirmRejetStatus = async () => {
    if (!selectedRowsForStatus || selectedRowsForStatus.length === 0) return;

    try {
    const token = localStorage.getItem("token");

    let url = `${API_URL}/domiciliers/rejeter`;
    let body = {};

    if (selectedRowsForStatus.length === 1) {
        url += `/${selectedRowsForStatus[0].DOM_CODE}`; // route single
    } else {
        body = { ids: selectedRowsForStatus.map(r => r.DOM_CODE) }; // route multiple
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
        const failedMessages = data.failed.map((f: any) => `${f.DOM_CODE}: ${f.reason}`).join(', ');
        toast({
        title: "Erreur",
        description: (`Échecs du rejet: ${failedMessages}`),
        variant: "destructive",
        });
    }

    fetchDomiciliers();
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
      key: "MVT_BEN_NOM_PRE",
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
      key: "BANQUE",
      title: "BANQUE",
        render: (value: string) => (
            <span className="font-medium text-gray-800">{value || "_"}</span>
        ),
    },
    {
      key: "GUICHET",
      title: "GUICHET",
      render: (value: string) => (
        <span className="font-medium text-gray-800">{value || "_"}</span>
      ),
    },
    {
      key: "NUMCPT",
      title: "N° COMPTE",
      render: (value: string) => (
        <span className="font-medium text-gray-800">{value || "_"}</span>
      ),
    },
    {
      key: "RIB",
      title: "CLE RIB",
      render: (value: string) => (
        <span className="font-medium text-gray-800">{value || "_"}</span>
      ),
    },
    {
      key: "MVT_DATE",
      title: "DATE MOUVEMENT",
      render: (value: string) => (
        <span className="font-medium text-gray-800">{value || "_"}</span>
      ),
    },
    {
      key: "MVT_HEURE",
      title: "HEURE MOUVEMENT",
      render: (value: string) => (
        <span className="font-semibold text-gray-700">{value || "—"}</span>
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
          Liste  des RIB des bénéficiaires en attente d'approbaton
        </h1>
      </div>
    </div>

    {/* Liste des bénéficiaires */}
    <Card > 
      <DataTable
        title={`Effectif (${domiciliers.length})`}
        columns={columns}
        data={domiciliers ?? []}
        onView={(row) => {
        setSelectedDomicilier({
            beneficiaire: row,
            domiciliations: [row], // pour l’instant un seul RIB
        });
        }}
        onValidate2={handleStatusUpdate}
        onRejet={handleRejetStatusUpdate}
        searchPlaceholder="Rechercher un bénéficiaire (Nom et Prénom...)"
      />
    </Card>
   {selectedDomicilier && (
    <DomicilierPreviewModal
        open={true}
        onClose={() => {
        setSelectedDomicilier(null);
        fetchDomiciliers();
        }}
        beneficiaire={selectedDomicilier.beneficiaire}
        domiciliations={selectedDomicilier.domiciliations}
    />
    )}

    <ConfirmValidateDialog
        open={isValidateStatusDialogOpen}
        onClose={() => setIsValidateStatusDialogOpen(false)}
        onConfirm={handleConfirmValidateStatus}
        itemName={selectedRowsForStatus.length > 0 ? `${selectedRowsForStatus.length} RIB(s) sélectionné(s)` : ""}
    />

    <ConfirmRejetDialog
        open={isRejetStatusDialogOpen}
        onClose={() => setIsRejetStatusDialogOpen(false)}
        onConfirm={handleConfirmRejetStatus}
        itemName={selectedRowsForStatus.length > 0 ? `${selectedRowsForStatus.length} RIB(s) sélectionné(s)` : ""}
    />
  </div>
);
}