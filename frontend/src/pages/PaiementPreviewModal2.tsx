import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config/api";
import axios from "axios";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  beneficiaire: any;
  paiement: any[];
};

export default function PaiementPreviewModal({
  open,
  onClose,
  beneficiaire,
  paiement = [],
}: Props) {

  const [echeances, setEcheances] = useState<any[]>([]);
  
  // Bloquer ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    if (open) window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open]);

  const getEcheancesInfo = (code: string) => {
    const e = echeances.find((ech) => String(ech.ECH_CODE).trim() === String(code).trim());
    return e ? `${e.ECH_LIBELLE || "—"}` : code;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_URL}/echeances-publique`, { headers }),
    ])
      .then(([e]) => {
        setEcheances(e.data);
      })
      .catch(() => toast.error("Erreur lors du chargement des listes."));
  }, []);

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
            Aperçu du paiement du {getEcheancesInfo(beneficiaire.ECH_CODE || "—")}
          </h2>
          <Button variant="ghost" className="text-white hover:bg-white/20" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300">
          {/* INFOS BÉNÉFICIAIRE */}
          <h3 className="font-semibold text-blue-600 mb-2">
              Information du bénéficiaire
            </h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <Info label="Matricule solde :" value={beneficiaire.BEN_MATRICULE} />
            <Info label="Nom & Prénom :" value={beneficiaire.BENEFICIAIRE} />
            <Info
              label="Sexe :"
              value={
                beneficiaire.BEN_SEXE === "M"
                  ? "Masculin"
                  : beneficiaire.BEN_SEXE === "F"
                  ? "Féminin"
                  : "—"
              }
            />
            <Info
              label="Type bénéficiaire :"
              value={beneficiaire.TYPE_BENEFICIAIRE}
            />
            <Info label="Fonction :" value={beneficiaire.FONCTION} />
            <Info label="Grade :" value={beneficiaire.GRADE} />
            <Info label="Position :" value={beneficiaire.POSITION} />
            <Info
              label="Statut :"
              value={getStatutBadge(beneficiaire.BEN_STATUT)}
            />
          </div>

          <div>
            <h3 className="text-blue-600 font-semibold mb-3 border-b pb-1">
              Informations du RIB
            </h3>

            <div className="grid grid-cols-5 gap-5 text-sm">
              {/* Titres */}
              <div className="font-semibold text-gray-600">Banque :</div>
              <div className="font-semibold text-gray-600">Guichet :</div>
              <div className="font-semibold text-gray-600">N° Compte :</div>
              <div className="font-semibold text-gray-600">Clé RIB :</div>
              <div className="font-semibold text-gray-600">Statut :</div>

              {/* Valeurs */}
              <div className="text-[12px] font-semibold">{beneficiaire.BANQUE || "—"}</div>
              <div className="text-[12px] font-semibold">{beneficiaire.GUICHET || "—"}</div>
              <div className="text-[12px] font-semibold">{beneficiaire.NUMCPT || "—"}</div>
              <div className="text-[12px] font-semibold">{beneficiaire.RIB || "—"}</div>
              <td className="text-[12px] px-3 py-2">
                {getStatutBadge(beneficiaire.DOM_STATUT)}
              </td>
            </div>
          </div>   

          <div>
            <h3 className="font-semibold text-blue-600 mb-2">
              Détails du paiement
            </h3>

            {paiement.length === 0 ? (
              <p className="text-center text-gray-500">
                Aucun enregistré.
              </p>
            ) : (
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Elément</th>
                    <th className="px-3 py-2 text-left">Sens</th>
                    <th className="px-3 py-2 text-left">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {paiement.map((d, i) =>
                    Array.isArray(d.details) && d.details.length > 0 ? (
                      d.details.map((det: any, j: number) => (
                        <tr key={`${i}-${j}`} className="border-t">
                          <td className="px-4 py-2 text-[12px] font-semibold">
                            {det.ELT_LIBELLE || "—"}
                          </td>

                          <td className="px-4 py-2">
                            {det.ELT_SENS === 1 ? (
                              <span className="px-2 py-1 text-[12px] font-semibold rounded bg-green-100 text-green-800">
                                + Gain
                              </span>
                            ) : det.ELT_SENS === 2 ? (
                              <span className="px-2 py-1 text-[12px] font-semibold rounded bg-red-100 text-red-800">
                                - Retenue
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="px-4 py-2 text-[12px] font-semibold text-right">
                            {det.ELT_MONTANT != null
                              ? Number(det.ELT_MONTANT).toLocaleString("fr-FR")
                              : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key={i}>
                        <td colSpan={3} className="text-center py-4 text-gray-400">
                          Aucun détail disponible
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Totaux */}
          <div className="mt-4 space-y-1 text-sm text-right">
            <div className="text-[12px] font-medium text-right">
              <span className="font-semibold text-gray-600">Total gain :</span>{" "}
              {beneficiaire.TOTAL_GAIN != null
                ? Number(beneficiaire.TOTAL_GAIN).toLocaleString("fr-FR") : "—"}
            </div>
            <div className="text-[12px] font-medium text-right">
              <span className="font-semibold text-gray-600">Total retenu :</span>{" "}
              {beneficiaire.TOTAL_RETENU != null
                ? Number(beneficiaire.TOTAL_RETENU).toLocaleString("fr-FR") : "—"}
            </div>
            <div className="text-[12px] font-medium text-right">
              <span className="font-semibold text-gray-600">Total Net à payer :</span>{" "}
              {beneficiaire.MONTANT_NET != null
                ? Number(beneficiaire.MONTANT_NET).toLocaleString("fr-FR") : "—"}
            </div>
            <div>
              <span className="text-[12px] font-semibold text-gray-600">Statut :</span>{" "}
              {getStatutBadge(beneficiaire.PAI_STATUT)}
            </div>
          </div>

          {/* META */}
          <div>
            <h3 className="text-blue-600 font-semibold mb-3 border-b pb-1"></h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Info label="Date de soumission :" value={beneficiaire.MVT_DATE ? new Date(beneficiaire.MVT_DATE).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                })
                : "_"
              }
              />
              <Info label="Gestionnaire :" value={beneficiaire.MVT_CREER_PAR} />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t text-right bg-gray-50">
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </motion.div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-gray-500 text-xs font-semibold">{label}</p>
      <p className="text-[12px] font-medium">{value || "—"}</p>
    </div>
  );
}