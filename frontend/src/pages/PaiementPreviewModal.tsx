import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config/api";
import axios from "axios";
import { toast } from "sonner";

export default function PaiementPreviewModal({ open, onClose, paiement }: any) {
  const [detailsPaiement, setDetailsPaiement] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [echeances, setEcheances] = useState<any[]>([]);

  const getBeneficiairesInfo = (code: string) => {
    const b = beneficiaires.find((ben) => String(ben.CODE) === String(code));
    if (!b) return null;

    return {
      code: b.CODE,
      matricule: b.MATRICULE,
      nomComplet: b.BENEFICIAIRE,
      sexe: b.SEXE === "M" ? "Masculin" : "Féminin",
      benefStatut: b.BEN_STATUT,
      type: b.TYPE_BENEFICIAIRE,
      fonction: b.FONCTION,
      grade: b.GRADE,
      regie: b.REGIE,
      banque: b.BANQUE,
      guichet: b.GUICHET,
      numeroCompte: b.NUMERO_DE_COMPTE,
      rib: b.CLE_RIB,
      domStatut: b.DOM_STATUT,
      total_gain : b.TOTAL_GAIN,
      total_retenu: b.TOTAL_RETENU,
      montant_net: b.MONTANT_NET,
      statut : b.STATUT,
    };
  };

  const getEcheancesInfo = (code: string) => {
    const e = echeances.find((ech) => String(ech.ECH_CODE).trim() === String(code).trim());
    return e ? `${e.ECH_LIBELLE || "—"}` : code;
  };

useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_URL}/info-beneficiaires`, { headers }),
      axios.get(`${API_URL}/echeances-publique`, { headers }),
    ])
      .then(([b, e]) => {
        setBeneficiaires(b.data);
        setEcheances(e.data);
      })
      .catch(() => toast.error("Erreur lors du chargement des listes."));
  }, []);

  useEffect(() => {
    if (open && paiement) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      setLoading(true);
      axios
        .get(`${API_URL}/details-paiement/${paiement.PAI_CODE}`, { headers })
        .then((res) => setDetailsPaiement(res.data))
        .catch(() => toast.error("Erreur lors du chargement des détails du paiement"))
        .finally(() => setLoading(false));
    }
  }, [open, paiement]);

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

  if (!open || !paiement) return null;

  const getPaiementBadge = (statut: number) => {
    switch (statut) {
      case 0:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive">
            Rejeté
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
            Non approuvé
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400">
            En cours d’approbation...
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
            Non payé
          </span>
        );
        case 4:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600 dark:text-green-400">
            Payé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
            Inconnu
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center"
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
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-2 border-b border-border bg-gradient-to-r from-primary to-primary-dark text-primary-foreground">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Aperçu du paiement du {getEcheancesInfo(paiement.ECH_CODE || "—")}
          </h2>
          <Button variant="ghost" className="text-primary-foreground hover:bg-white/20 dark:hover:bg-white/10" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {/* Informations du bénéficiaire */}
          <div>
            <h3 className="text-primary font-semibold mb-3 border-b border-border pb-1">Informations du bénéficiaire</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Info label="Matricule solde :" value={getBeneficiairesInfo(paiement.BEN_CODE)?.matricule} />
              <Info label="Bénéficiaire :" value={getBeneficiairesInfo(paiement.BEN_CODE)?.nomComplet} />
              <Info label="Sexe :" value={paiement.BEN_SEXE === "M" ? "Masculin" : paiement.BEN_SEXE === "F" ? "Féminin" : "_"} />
              <Info label="Type bénéficiaire :" value={getBeneficiairesInfo(paiement.BEN_CODE)?.type} />
              <Info label="Fonction :" value={getBeneficiairesInfo(paiement.BEN_CODE)?.fonction} />
              <Info label="Grade :" value={getBeneficiairesInfo(paiement.BEN_CODE)?.grade} />
              <Info label="Régie :" value={getBeneficiairesInfo(paiement.BEN_CODE)?.regie} />
              <Info
                label="Statut :"
                value={
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      (() => {
                        const stat = getBeneficiairesInfo(paiement.BEN_CODE)?.benefStatut;
                        if (stat === 2) return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
                        if (stat === 3) return "bg-green-500/10 text-green-600 dark:text-green-400";
                        return "bg-muted text-muted-foreground";
                      })()
                    }`}
                  >
                    {(() => {
                      const stat = getBeneficiairesInfo(paiement.BEN_CODE)?.benefStatut;
                      if (stat === 2) return "En cours d'approbation";
                      if (stat === 3) return "Approuvé";
                      return "_";
                    })()}
                  </span>
                }
              />
            </div>
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
              <div className="text-[12px] font-semibold text-foreground">{getBeneficiairesInfo(paiement.BEN_CODE)?.banque || "—"}</div>
              <div className="text-[12px] font-semibold text-foreground">{getBeneficiairesInfo(paiement.BEN_CODE)?.guichet || "—"}</div>
              <div className="text-[12px] font-semibold text-foreground">{getBeneficiairesInfo(paiement.BEN_CODE)?.numeroCompte || "—"}</div>
              <div className="text-[12px] font-semibold text-foreground">{getBeneficiairesInfo(paiement.BEN_CODE)?.rib || "—"}</div>
              <div className="text-[12px] font-semibold">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                    (() => {
                      const stat = getBeneficiairesInfo(paiement.BEN_CODE)?.domStatut;
                      if (stat === 2) return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
                      if (stat === 3) return "bg-green-500/10 text-green-600 dark:text-green-400";
                      return "bg-muted text-muted-foreground";
                    })()
                  }`}
                >
                  {(() => {
                    const stat = getBeneficiairesInfo(paiement.BEN_CODE)?.domStatut;
                    if (stat === 2) return "En cours...";
                    if (stat === 3) return "Approuvé";
                    return "—";
                  })()}
                </span>
              </div>
            </div>
          </div>         

          {/* Domiciliations bancaires */}
          <div>
            <h3 className="text-primary font-semibold mb-3 border-b border-border pb-1">Détails du paiement</h3>
            {loading ? (
              <p className="text-center text-muted-foreground py-6">Chargement des détails du paiement...</p>
            ) : detailsPaiement.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucun détail enregistré.</p>
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-muted-foreground">Elément</th>
                      <th className="px-4 py-2 text-left text-muted-foreground">Sens</th>
                      <th className="px-4 py-2 text-right text-muted-foreground">Montant en F CFA</th>
                    </tr>
                  </thead>

                  <tbody>
                    {detailsPaiement.map((d: any, i: number) => (
                      <tr key={i} className="odd:bg-muted/30 border-t border-border">
                        <td className="px-4 py-2 text-[12px] font-semibold text-foreground">{d.ELT_LIBELLE || "—"}</td>

                        <td className="px-4 py-2">
                          {d.ELT_SENS === 1 ? (
                            <span className="px-2 py-1 text-[12px] font-semibold rounded bg-green-500/10 text-green-600 dark:text-green-400">
                              + Gain
                            </span>
                          ) : d.ELT_SENS === 2 ? (
                            <span className="px-2 py-1 text-[12px] font-semibold rounded bg-red-500/10 text-red-600 dark:text-red-400">
                              - Retenue
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-2 text-[12px] font-semibold text-right text-foreground">
                          {d.PAI_MONTANT != null
                            ? Number(d.PAI_MONTANT).toLocaleString("fr-FR")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {detailsPaiement.length > 0 && (
            <div className="space-y-1">
              <div className="text-[12px] font-medium text-right text-foreground"> 
                <span className="font-semibold text-muted-foreground">Total gain :</span>{" "}
                {detailsPaiement[0].TOTAL_GAIN != null
                  ? Number(detailsPaiement[0].TOTAL_GAIN).toLocaleString("fr-FR") : "—"}
              </div>
              <div className="text-[12px] font-medium text-right text-foreground"> 
                <span className="font-semibold text-muted-foreground">Total retenu :</span>{" "}
                {detailsPaiement[0].TOTAL_RETENU != null
                  ? Number(detailsPaiement[0].TOTAL_RETENU).toLocaleString("fr-FR") : "—"}
              </div>
              <div className="text-[12px] font-medium text-right text-foreground"> 
                <span className="font-semibold text-muted-foreground">Total Net à payer :</span>{" "}
                {detailsPaiement[0].MONTANT_NET != null
                  ? Number(detailsPaiement[0].MONTANT_NET).toLocaleString("fr-FR") : "—"}
              </div>
              <div className="text-[12px] font-medium text-right text-foreground">
                <span className="font-semibold text-muted-foreground">Statut :</span>{" "}
                {getPaiementBadge(paiement.PAI_STATUT)}
              </div>
              {/* Affichage du motif si rejeté */}
              {paiement.PAI_STATUT === 0 && paiement.PAI_MOTIF_REJET && (
                <div className="text-[12px] font-medium text-destructive text-right">
                  <span className="font-semibold">Motif du rejet :</span> {paiement.PAI_MOTIF_REJET}
                </div>
              )}
            </div>
          )}
          <div>
            <h3 className="text-primary font-semibold mb-3 border-b border-border pb-1">Métadonnées</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Info label="Date de saisie :" value={paiement.PAI_DATE_CREER ? new Date(paiement.PAI_DATE_CREER).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })
                  : "_"
                }
              />
              <Info label="Saisi par :" value={paiement.PAI_CREER_PAR} />
              <Info label="Date de modification :" value={paiement.PAI_DATE_MODIFIER ? new Date(paiement.PAI_DATE_MODIFIER).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })
                  : "_"
                }
              />
              <Info label="Modifié par :" value={paiement.PAI_MODIFIER_PAR} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border text-right bg-muted/30">
          <Button variant="default" onClick={onClose} className="bg-primary hover:bg-primary-dark text-primary-foreground">
            <X className="w-4 h-4 mr-2" />
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
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="text-[12px] font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}