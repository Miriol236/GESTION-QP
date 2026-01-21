import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config/api";
import axios from "axios";
import { toast } from "sonner";

export default function BeneficiairePreviewModal2({ open, onClose, beneficiaire }: any) {
  const [loading, setLoading] = useState(false);

  // Bloquer la fermeture via la touche Échap lorsqu'on affiche le modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    if (open) {
      window.addEventListener("keydown", handler, true);
    }

    return () => window.removeEventListener("keydown", handler, true);
  }, [open]);

  if (!open) return null;

  const getStatutBadge = (statut: number) => {
    switch (statut) {
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
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      // Empêcher tout comportement par défaut sur le backdrop (clic hors modal)
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        // Empêcher la propagation des events vers le backdrop
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-1 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Informations du bénéficiaire
          </h2>
          <Button variant="ghost" className="text-white hover:bg-white/20" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300">
          {/* Informations du bénéficiaire */}
          <div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Info label="Code :" value={beneficiaire.BEN_CODE} />
              <Info label="Matricule solde :" value={beneficiaire.BEN_MATRICULE} />
              <Info label="Nom(s) et Prénom(s) :" value={`${beneficiaire.MVT_BEN_NOM_PRE}`} />
              <Info label="Sexe :" value={beneficiaire.BEN_SEXE === "M" ? "Masculin" : beneficiaire.BEN_SEXE === "F" ? "Féminin" : "_"} />
              <Info label="Type bénéficiaire :" value={beneficiaire.TYPE_BENEFICIAIRE} />
              <Info label="Fonction :" value={beneficiaire.FONCTION} />
              <Info label="Grade :" value={beneficiaire.GRADE} />
              <Info label="Position :" value={beneficiaire.POSITION} />
              <Info label="Statut :" value={getStatutBadge(beneficiaire.BEN_STATUT)} />
            </div>
          </div>

          <div>
            <h3 className="text-blue-600 font-semibold mb-3 border-b pb-1"></h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Info label="Date de Transmission :" value={beneficiaire.MVT_DATE ? new Date(beneficiaire.MVT_DATE).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                })
                : "_"
              }
              />
              <Info label="Heure de Transmission :" value={beneficiaire.MVT_HEURE} />
              <Info label="Gestionnaire :" value={beneficiaire.MVT_CREER_PAR} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-1 border-t text-right bg-gray-50">
          <Button variant="default" onClick={onClose}>
            <X className="w-4 h-4" />
            Fermer
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || "—"}</p>
    </div>
  );
}
