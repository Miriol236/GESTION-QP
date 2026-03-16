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
          <Badge className="bg-destructive/10 text-destructive">
            Rejeté
          </Badge>
        );

      case 1:
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
            Non approuvé
          </Badge>
        );

      case 2:
        return (
          <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400">
            En cours d’approbation…
          </Badge>
        );

      case 3:
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
            Approuvé
          </Badge>
        );          

      default:
        return (
          <Badge className="bg-muted text-muted-foreground">
            Statut inconnu
          </Badge>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center"
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
        className="bg-card dark:bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-border dark:border-border"
        // Empêcher la propagation des events vers le backdrop
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-2 border-b border-border bg-gradient-to-r from-primary to-primary-dark text-primary-foreground">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Aperçu du paiement du {getEcheancesInfo(beneficiaire.ECH_CODE || "—")}
          </h2>
          <Button variant="ghost" className="text-primary-foreground hover:bg-white/20 dark:hover:bg-white/10" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {/* INFOS BÉNÉFICIAIRE */}
          <h3 className="font-semibold text-primary mb-2">
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
            <h3 className="text-primary font-semibold mb-3 border-b border-border pb-1">
              Informations du RIB
            </h3>

            <div className="grid grid-cols-5 gap-5 text-sm">
              {/* Titres */}
              <div className="font-semibold text-muted-foreground">Banque :</div>
              <div className="font-semibold text-muted-foreground">Guichet :</div>
              <div className="font-semibold text-muted-foreground">N° Compte :</div>
              <div className="font-semibold text-muted-foreground">Clé RIB :</div>
              <div className="font-semibold text-muted-foreground">Statut :</div>

              {/* Valeurs */}
              <div className="text-[12px] font-semibold text-foreground">{beneficiaire.BANQUE || "—"}</div>
              <div className="text-[12px] font-semibold text-foreground">{beneficiaire.GUICHET || "—"}</div>
              <div className="text-[12px] font-semibold text-foreground">{beneficiaire.NUMCPT || "—"}</div>
              <div className="text-[12px] font-semibold text-foreground">{beneficiaire.RIB || "—"}</div>
              <td className="text-[12px] px-3 py-2">
                {getStatutBadge(beneficiaire.DOM_STATUT)}
              </td>
            </div>
          </div>   

          <div>
            <h3 className="font-semibold text-primary mb-2">
              Détails du paiement
            </h3>

            {paiement.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Aucun détail enregistré.
              </p>
            ) : (
              <table className="w-full text-sm border border-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left text-muted-foreground">Elément</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Sens</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {paiement.map((d, i) =>
                    Array.isArray(d.details) && d.details.length > 0 ? (
                      d.details.map((det: any, j: number) => (
                        <tr key={`${i}-${j}`} className="border-t border-border">
                          <td className="px-4 py-2 text-[12px] font-semibold text-foreground">
                            {det.ELT_LIBELLE || "—"}
                          </td>

                          <td className="px-4 py-2">
                            {det.ELT_SENS === 1 ? (
                              <span className="px-2 py-1 text-[12px] font-semibold rounded bg-green-500/10 text-green-600 dark:text-green-400">
                                + Gain
                              </span>
                            ) : det.ELT_SENS === 2 ? (
                              <span className="px-2 py-1 text-[12px] font-semibold rounded bg-red-500/10 text-red-600 dark:text-red-400">
                                - Retenue
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="px-4 py-2 text-[12px] font-semibold text-right text-foreground">
                            {det.ELT_MONTANT != null
                              ? Number(det.ELT_MONTANT).toLocaleString("fr-FR")
                              : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key={i}>
                        <td colSpan={3} className="text-center py-4 text-muted-foreground">
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
            <div className="text-[12px] font-medium text-right text-foreground">
              <span className="font-semibold text-muted-foreground">Total gain :</span>{" "}
              {beneficiaire.TOTAL_GAIN != null
                ? Number(beneficiaire.TOTAL_GAIN).toLocaleString("fr-FR") : "—"}
            </div>
            <div className="text-[12px] font-medium text-right text-foreground">
              <span className="font-semibold text-muted-foreground">Total retenu :</span>{" "}
              {beneficiaire.TOTAL_RETENU != null
                ? Number(beneficiaire.TOTAL_RETENU).toLocaleString("fr-FR") : "—"}
            </div>
            <div className="text-[12px] font-medium text-right text-foreground">
              <span className="font-semibold text-muted-foreground">Total Net à payer :</span>{" "}
              {beneficiaire.MONTANT_NET != null
                ? Number(beneficiaire.MONTANT_NET).toLocaleString("fr-FR") : "—"}
            </div>
            <div className="text-foreground">
              <span className="text-[12px] font-semibold text-muted-foreground">Statut :</span>{" "}
              {getStatutBadge(beneficiaire.PAI_STATUT)}
            </div>
          </div>

          {/* META */}
          <div>
            <h3 className="text-primary font-semibold mb-3 border-b border-border pb-1">Métadonnées</h3>
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
        <div className="p-2 border-t border-border text-right bg-muted/30">
          <Button onClick={onClose} className="bg-primary hover:bg-primary-dark text-primary-foreground">
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
      <p className="text-muted-foreground dark:text-muted-foreground text-xs font-semibold">{label}</p>
      <p className="text-[12px] font-medium text-foreground dark:text-foreground">{value || "—"}</p>
    </div>
  );
}