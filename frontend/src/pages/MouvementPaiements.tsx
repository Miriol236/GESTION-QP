import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import PaiementPreviewModal2 from "./PaiementPreviewModal2";
import ConfirmValidateDialog from "@/components/common/ConfirmValidateDialog";
import ConfirmRejetDialog from "@/components/common/ConfirmRejetDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function MouvementPaiements() {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<{
    beneficiaire: any;
    paiement: any[];
    } | null>(null);
  const [selectedRowsForStatus, setSelectedRowsForStatus] = useState<any[]>([]);
  const [isValidateStatusDialogOpen, setIsValidateStatusDialogOpen] = useState(false);
  const [isRejetStatusDialogOpen, setIsRejetStatusDialogOpen] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [echeances, setEcheances] = useState<any[]>([]);
  const [regies, setRegies] = useState<any[]>([]);
  // const [selectedEcheance, setSelectedEcheance] = useState<any | null>(null);
  const [selectedRegie, setSelectedRegie] = useState<any | null>(null);
  const [selectedTypeBen, setSelectedTypeBen] = useState<any | null>(null);
  const { toast } = useToast();

  // Récupérer l'utilisateur courant pour déterminer les permissions
  const { user } = useAuth();
  const regCodeUser = user?.REG_CODE || null; // null si l'utilisateur n'est pas rattaché à une régie

  const showRegieFilter = regCodeUser === null;

  // Récupérer NIV_CODE du groupe
  const nivCode = user?.groupe?.NIV_CODE || null;

  const fetchPaiements = async (ech_code: string | null = null) => {
    // setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Ajoute le paramètre ech_code si une échéance est sélectionnée
      const url = ech_code
        ? `${API_URL}/mouvements/paiements?ech_code=${ech_code}`
        : `${API_URL}/mouvements/paiements`;

        // console.log("Fetching paiements from URL:", url);

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPaiements(data.data ?? []);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description:"Erreur lors du chargement des mouvements des paiements.",
        variant: "destructive",
      });
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
      axios.get(`${API_URL}/echeances-publique`, { headers }),
      axios.get(`${API_URL}/regies-publiques`, { headers }),
      axios.get(`${API_URL}/typeBeneficiaires-public`, { headers }),
    ])
      .then(([e, r, t]) => {
        setEcheances(e.data);
        setRegies(r.data);
        setTypes(t.data);
      })
      .catch(() => toast({
        title: "Erreur",
        description: "Erreur lors du chargement des listes.",
        variant: "destructive",
      }));
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

  const displayedPaiements = paiements.filter((p) => {
    // Recherche
    const matchesSearch =
      !searchTerm ||
      String(p.PAI_CODE).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.MVT_BEN_NOM_PRE).toLowerCase().includes(searchTerm.toLowerCase());

    // Filtre régie
    const matchesRegie = !selectedRegie || p.REG_CODE === selectedRegie.REG_CODE;

    // Filtre Type bénéficiaire
    const matchesTypeBen = !selectedTypeBen || p.TYP_CODE === selectedTypeBen.TYP_CODE;

    return matchesSearch && matchesRegie && matchesTypeBen;
  });

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

    let url = `${API_URL}/paiements/approuver`;
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
        const failedMessages = data.failed.map((f: any) => `${f.PAI_CODE}: ${f.reason}`).join(', ');
        toast({
        title: "Erreur",
        description: (`Échecs d'approbation: ${failedMessages}`),
        variant: "destructive",
        });
    }

    fetchPaiements();
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
        description: "Aucun paiement sélectionné !",
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

    let url = `${API_URL}/paiements/rejeter`;
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
        const failedMessages = data.failed.map((f: any) => `${f.PAI_CODE}: ${f.reason}`).join(', ');
        toast({
        title: "Erreur",
        description: (`Échecs du rejet: ${failedMessages}`),
        variant: "destructive",
        });
    }

    fetchPaiements();
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
      key: "MONTANT_NET",
      title: "NET A PAYER",
      render: (value) => (
        <div className="text-right">
          <span className="font-medium">
            {value != null ? Number(value).toLocaleString("fr-FR") : "—"}
          </span>
        </div>
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
          Liste  des paiements des bénéficiaires en attente d'approbaton
        </h1>
      </div>
    </div>

    {/* Liste des bénéficiaires */}
    <Card > 
      <DataTable
        title={`Effectif (${displayedPaiements.length ?? []})`}
        columns={columns}
        data={displayedPaiements ?? []}
        onView={(row) => {
        setSelectedPaiement({
            beneficiaire: row,
            paiement: [row], 
        });
        }}
        onValidate2={nivCode === '02' ? handleStatusUpdate : undefined} 

        rowKey2="PAI_CODE"
          filterItems2={showRegieFilter ? regies.map((e) => ({
          ...e,
          label: `${e.REG_SIGLE}`
        })) : undefined}
        filterItems4={types.map((e) => ({
          ...e,
          label: e.TYP_LIBELLE  // <-- ici, utiliser TYP_LIBELLE
        }))}
        filterDisplay2={showRegieFilter ? ((it) => it.label || it.REG_SIGLE) : undefined}
        filterDisplay4={(it: any) => it.label || it.TYP_LIBELLE}
        onFilterSelect2={showRegieFilter ? (it) => setSelectedRegie(it) : undefined}
        onFilterSelect4={(it) => setSelectedTypeBen(it)}
        filterPlaceholder2={showRegieFilter ? "Toutes les régies" : undefined}
        filterPlaceholder4="Tous les types"
        onRejet={nivCode === '02' ? handleRejetStatusUpdate : undefined}
        searchPlaceholder="Rechercher (Nom et Prénom...)"
      />
    </Card>
   {selectedPaiement && (
    <PaiementPreviewModal2
        open={true}
        onClose={() => {
        setSelectedPaiement(null);
        fetchPaiements();
        }}
        beneficiaire={selectedPaiement.beneficiaire}
        paiement={selectedPaiement.paiement}
    />
    )}

    <ConfirmValidateDialog
        open={isValidateStatusDialogOpen}
        onClose={() => setIsValidateStatusDialogOpen(false)}
        onConfirm={handleConfirmValidateStatus}
        itemName={selectedRowsForStatus.length > 0 ? `${selectedRowsForStatus.length} paiement(s) sélectionné(s)` : ""}
    />

    <ConfirmRejetDialog
        open={isRejetStatusDialogOpen}
        onClose={() => setIsRejetStatusDialogOpen(false)}
        onConfirm={handleConfirmRejetStatus}
        itemName={selectedRowsForStatus.length > 0 ? `${selectedRowsForStatus.length} paiement(s) sélectionné(s)` : ""}
    />
  </div>
);
}