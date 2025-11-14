import { useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BeneficiairePreviewModal({ open, onClose, beneficiaire }: any) {
  if (!open || !beneficiaire) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      // Empêcher le clic hors modal de fermer
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
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" /> Aperçu du bénéficiaire
          </h2>
          <Button variant="ghost" className="text-white hover:bg-white/20" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300">
          {/* Informations personnelles */}
          <div>
            <h3 className="text-blue-600 font-semibold mb-3 border-b pb-1">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-4">
              <Info label="Code" value={beneficiaire.CODE} />
              <Info label="Matricule solde" value={beneficiaire.MATRICULE} />
              <Info label="Nom et Prénom" value={beneficiaire.BENEFICIAIRE} />
              <Info label="Sexe" value={beneficiaire.SEXE} />
              <Info label="Régie" value={beneficiaire.REGIE} />
              <Info label="Type de bénéficiaire" value={beneficiaire.TYPE_BENEFICIAIRE} />
              <Info label="Fonction" value={beneficiaire.FONCTION} />
              <Info label="Grade" value={beneficiaire.GRADE} />
            </div>
          </div>

          {/* RIB */}
          <div>
            <h3 className="text-blue-600 font-semibold mb-3 border-b pb-1">RIB</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Banque</th>
                    <th className="px-4 py-2 text-left">Guichet</th>
                    <th className="px-4 py-2 text-left">N° Compte</th>
                    <th className="px-4 py-2 text-left">Clé RIB</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2">{beneficiaire.BANQUE || "—"}</td>
                    <td className="px-4 py-2">{beneficiaire.GUICHET || "—"}</td>
                    <td className="font-semibold px-4 py-2">{beneficiaire.NUMERO_DE_COMPTE || "_"}</td>
                    <td className="px-4 py-2 font-semibold text-blue-600">{beneficiaire.CLE_RIB || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t text-right bg-gray-50">
          <Button variant="default" onClick={onClose}>
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
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || "—"}</p>
    </div>
  );
}