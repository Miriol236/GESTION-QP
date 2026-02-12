import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config/api";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { FileText, FileSpreadsheet } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  selectedTypeBen: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BeneficiaireExportModal({ selectedTypeBen, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0); // pourcentage de téléchargement

  useEffect(() => {
    let interval: number | undefined;

    if (isLoading) {
      interval = window.setInterval(() => {
        setProgress((p) => Math.min(p + Math.floor(Math.random() * 5), 95));
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const handleExport = async (format: "pdf" | "excel") => {
    setIsLoading(true);
    setProgress(0);

    const typCode = selectedTypeBen?.TYP_CODE;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/beneficiaires-export`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...(typCode ? { TYP_CODE: typCode } : {}),
          format: format,
        },
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        },
      });

      const blob = new Blob([response.data], {
        type:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `beneficiaires.${format === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le fichier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 500); // reset après un petit délai
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg space-y-4">
        <h2 className="text-lg font-bold">Exporter les bénéficiaires</h2>

        {selectedTypeBen ? (
          <p className="text-sm text-gray-700">
            Type sélectionné : <span className="font-medium">{selectedTypeBen.TYP_LIBELLE}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500">Tous les types seront exportés</p>
        )}

        {/* Progress Bar */}
        {isLoading && (
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mt-2">
            <div
              className="h-4 bg-blue-500 text-white text-xs font-medium text-center"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={() => handleExport("pdf")}
            className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            disabled={isLoading}
          >
            <FileText className="w-4 h-4" />
            PDF
          </Button>
          <Button
            onClick={() => handleExport("excel")}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            disabled={isLoading}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}