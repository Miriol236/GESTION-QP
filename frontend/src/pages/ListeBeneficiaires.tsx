import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import BeneficiairePreviewModal2 from "./BeneficiairePreviewModal2";

export default function Beneficiaires() {
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState<any>(null);

  // Charger les bénéficiaires depuis l’API
  const fetchBeneficiaires = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/liste-beneficiaires`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBeneficiaires(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des bénéficiaires.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print(); // Simple impression du contenu
  };


  useEffect(() => {
    fetchBeneficiaires();
  }, []);

  // Colonnes du tableau
  const columns: Column[] = [
    {
      key: "CODE",
      title: "CODE",
      render: (value: string) => (
        <span className="bg-primary/10 font-semibold text-primary">{value}</span>
      ),
    },
    // {
    //   key: "MATRICULE",
    //   title: "MATRICULE SOLDE",
    //   render: (value: string) => (
    //     <span className="bg-primary/10 font-semibold text-primary">{value}</span>
    //   ),
    // },
    {
      key: "BENEFICIAIRE",
      title: "BÉNÉFICIAIRE",
      render: (value: string) => (
        <span className="font-medium text-gray-800">{value}</span>
      ),
    },
    {
      key: "REGIE",
      title: "REGIE",
      render: (value: string) => (
        <span className="font-medium text-gray-800">{value}</span>
      ),
    },
    {
      key: "BANQUE",
      title: "BANQUE",
      render: (value: string) => (
        <span className="font-semibold text-gray-700">{value || "—"}</span>
      ),
    },
    {
      key: "GUICHET",
      title: "GUICHET",
      render: (value: string) => (
        <span className="font-semibold text-gray-700">{value || "—"}</span>
      ),
    },
    {
      key: "NUMERO_DE_COMPTE",
      title: "N° COMPTE",
      render: (value: string) => (
        <span className="font-semibold">{value || "—"}</span>
      ),
    },
    {
      key: "CLE_RIB",
      title: "CLÉ RIB",
      render: (value: string) => (
        <span className="font-semibold text-blue-600">{value || "—"}</span>
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
          Liste des bénéficiaires avec RIB actifs
        </h1>
      </div>
    </div>

    {/* Liste des bénéficiaires */}
    <Card > 
      <CardContent >
          <DataTable
            title={`Enregistrements (${beneficiaires.length})`}
            columns={columns}
            data={beneficiaires}
            onView={(b) => {
              setSelectedBeneficiaire(b);
              setTimeout(() => setOpenPreview(true), 0); // laisse le temps à selectedBeneficiaire d'être défini
            }}
            searchPlaceholder="Rechercher un bénéficiaire..."
            onPrint={handlePrint}
          />
      </CardContent>
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
  </div>
);
}