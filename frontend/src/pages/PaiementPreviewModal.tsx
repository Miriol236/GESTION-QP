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

  if (!open || !paiement) return null;

  const getPaiementBadge = (statut: number) => {
    switch (statut) {
      case 0:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
            Rejeté
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
            Non approuvé
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
            En cours d’approbation...
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
            Non payé
          </span>
        );
        case 4:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
            Payé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
            Inconnu
          </span>
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
            Aperçu du paiement du {getEcheancesInfo(paiement.ECH_CODE || "—")}
          </h2>
          <Button variant="ghost" className="text-white hover:bg-white/20" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300">
          {/* Informations du bénéficiaire */}
          <div>
            <h3 className="text-blue-600 font-semibold mb-3 border-b pb-1">Informations du bénéficiaire</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              {/* <Info label="Code paiement" value={paiement.PAI_CODE} />
              <Info label="Code bénéficiaire" value={getBeneficiairesInfo(paiement.BEN_CODE)?.code} /> */}
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
                    className={
                      (() => {
                        const stat = getBeneficiairesInfo(paiement.BEN_CODE)?.benefStatut;
                        if (stat === 2) return "text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full";
                        if (stat === 3) return "text-green-700 bg-green-100 px-2 py-0.5 rounded-full";
                        return "text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full";
                      })()
                    }
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
              <div className="font-semibold">{getBeneficiairesInfo(paiement.BEN_CODE)?.banque || "—"}</div>
              <div className="font-semibold">{getBeneficiairesInfo(paiement.BEN_CODE)?.guichet || "—"}</div>
              <div className="font-semibold">{getBeneficiairesInfo(paiement.BEN_CODE)?.numeroCompte || "—"}</div>
              <div className="font-semibold">{getBeneficiairesInfo(paiement.BEN_CODE)?.rib || "—"}</div>
              <div className="font-semibold">
                <span
                  className={
                    (() => {
                      const stat = getBeneficiairesInfo(paiement.BEN_CODE)?.domStatut;
                      if (stat === 2) return "text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full";
                      if (stat === 3) return "text-green-700 bg-green-100 px-2 py-0.5 rounded-full";
                      return "text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full";
                    })()
                  }
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
            <h3 className="text-blue-600 font-semibold mb-3 border-b pb-1">Détails du paiement</h3>
            {loading ? (
              <p className="text-center text-muted-foreground py-6">Chargement des détails du paiement...</p>
            ) : detailsPaiement.length === 0 ? (
              <p className="text-center text-gray-500">Aucun détail enregistré.</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Elément</th>
                      <th className="px-4 py-2 text-left">Sens</th>
                      <th className="px-4 py-2 text-right">Montant en F CFA</th>
                    </tr>
                  </thead>

                  <tbody>
                    {detailsPaiement.map((d: any, i: number) => (
                      <tr key={i} className="odd:bg-gray-50 border-t">
                        <td className="px-4 py-2 font-semibold">{d.ELT_LIBELLE || "—"}</td>

                        <td className="px-4 py-2">
                          {d.ELT_SENS === 1 ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                              + Gain
                            </span>
                          ) : d.ELT_SENS === 2 ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                              - Retenue
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-2 font-semibold text-right">
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
            <div>
              <div className="text-sm font-medium text-right"> 
                <span className="font-semibold text-gray-600">Total gain :</span>{" "}
                {detailsPaiement[0].TOTAL_GAIN != null
                  ? Number(detailsPaiement[0].TOTAL_GAIN).toLocaleString("fr-FR") + " FCFA "
                  : "—"}
              </div>
              <div className="text-sm font-medium text-right"> 
                <span className="font-semibold text-gray-600">Total retenu :</span>{" "}
                {detailsPaiement[0].TOTAL_RETENU != null
                  ? Number(detailsPaiement[0].TOTAL_RETENU).toLocaleString("fr-FR") + " FCFA "
                  : "—"}
              </div>
              <div className="text-sm font-medium text-right"> 
                <span className="font-semibold text-gray-600">Total Net à payer :</span>{" "}
                {detailsPaiement[0].MONTANT_NET != null
                  ? Number(detailsPaiement[0].MONTANT_NET).toLocaleString("fr-FR") + " FCFA "
                  : "—"}
              </div>
              <div className="text-sm font-medium text-right">
                <span className="font-semibold text-gray-600">Statut :</span>{" "}
                {getPaiementBadge(paiement.PAI_STATUT)}
              </div>
              {/* Affichage du motif si rejeté */}
              {paiement.PAI_STATUT === 0 && paiement.PAI_MOTIF_REJET && (
                <div className="text-sm font-medium text-red-600">
                  <span className="font-semibold">Motif du rejet :</span> {paiement.PAI_MOTIF_REJET}
                </div>
              )}
            </div>
          )}
          <div>
            <h3 className="text-blue-600 font-semibold mb-3 border-b pb-1"> </h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Info label="Date de saisie :" value={paiement.PAI_DATE_CREER ? new Date(paiement.PAI_DATE_CREER).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })
                  : "_"
                }
              />
              <Info label="Saisir par :" value={paiement.PAI_CREER_PAR} />
              <Info label="Date de modification :" value={paiement.PAI_DATE_MODIFIER ? new Date(paiement.PAI_DATE_MODIFIER).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })
                  : "_"
                }
              />
              <Info label="Modifier par :" value={paiement.PAI_MODIFIER_PAR} />
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
