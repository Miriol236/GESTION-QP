import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config/api";
import axios from "axios";
import { toast } from "sonner";

export default function BeneficiairePreviewModal({ open, onClose, beneficiaire }: any) {
  const [domiciliations, setDomiciliations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [fonctions, setFonctions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  const getTypesInfo = (code: string) => {
    const t = types.find((typ) => String(typ.TYP_CODE).trim() === String(code).trim());
    return t ? `${t.TYP_LIBELLE || "—"}` : code;
  };

  const getFonctionsInfo = (code: string) => {
    const f = fonctions.find((fon) => String(fon.FON_CODE).trim() === String(code).trim());
    return f ? `${f.FON_LIBELLE || "—"}` : code;
  };

  const getGradesInfo = (code: string) => {
    const g = grades.find((grd) => String(grd.GRD_CODE).trim() === String(code).trim());
    return g ? `${g.GRD_LIBELLE || "—"}` : code;
  };

  const getPositionsInfo = (code: string) => {
    const g = positions.find((pst) => String(pst.POS_CODE).trim() === String(code).trim());
    return g ? `${g.POS_LIBELLE || "—"}` : code;
  };

useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_URL}/typeBeneficiaires-public`, { headers }),
      axios.get(`${API_URL}/fonctions-public`, { headers }),
      axios.get(`${API_URL}/grades-public`, { headers }),
      axios.get(`${API_URL}/positions-publiques`, { headers }),
    ])
      .then(([t, f, g, p,]) => {
        setTypes(t.data);
        setFonctions(f.data);
        setGrades(g.data);
        setPositions(p.data);
      })
      .catch(() => toast.error("Erreur lors du chargement des listes."));
  }, []);

  useEffect(() => {
    if (open && beneficiaire) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      setLoading(true);
      axios
        .get(`${API_URL}/domiciliations/${beneficiaire.BEN_CODE}`, { headers })
        .then((res) => setDomiciliations(res.data))
        .catch(() => toast.error("Erreur lors du chargement des domiciliations"))
        .finally(() => setLoading(false));
    }
  }, [open, beneficiaire]);

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
        return <Badge className="bg-destructive/10 text-destructive">Rejeté</Badge>;
      case 1:
        return <Badge className="bg-muted text-muted-foreground">Non approuvé</Badge>;
      case 2:
        return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400">En cours d’approbation</Badge>;
      case 3:
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Approuvé</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Inconnu</Badge>;
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
            Aperçu du bénéficiaire
          </h2>
          <Button 
            variant="ghost" 
            className="text-primary-foreground hover:bg-white/20 dark:hover:bg-white/10" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {/* Informations du bénéficiaire */}
          <div>
            <h3 className="text-primary font-semibold mb-3 border-b border-border pb-1">Informations personnelles</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Info label="Matricule solde :" value={beneficiaire.BEN_MATRICULE} />
              <Info label="Nom(s) et Prénom(s) :" value={`${beneficiaire.BEN_NOM} ${beneficiaire.BEN_PRENOM}`} />
              <Info label="Sexe :" value={beneficiaire.BEN_SEXE === "M" ? "Masculin" : beneficiaire.BEN_SEXE === "F" ? "Féminin" : "_"} />
              <Info label="Date de naissance :" value={beneficiaire.BEN_DATE_NAISSANCE ? new Date(beneficiaire.BEN_DATE_NAISSANCE).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                })
                : "_"
              }
              />
              <Info label="Type :" value={getTypesInfo(beneficiaire.TYP_CODE || "—")} />
              <Info label="Fonction :" value={getFonctionsInfo(beneficiaire.FON_CODE || "—")} />
              <Info label="Grade :" value={getGradesInfo(beneficiaire.GRD_CODE || "—")} />
              <Info label="Position :" value={getPositionsInfo(beneficiaire.POS_CODE || "—")} />
              <Info 
                label="Statut :" 
                value={
                  <div className="flex flex-col gap-1">
                    {getStatutBadge(beneficiaire.BEN_STATUT)}
                    {beneficiaire.BEN_STATUT === 0 && beneficiaire.BEN_MOTIF_REJET && (
                      <span className="text-xs text-destructive italic">
                        Motif : {beneficiaire.BEN_MOTIF_REJET}
                      </span>
                    )}
                  </div>
                } 
              />
            </div>
          </div>

          {/* Domiciliations bancaires */}
          <div>
            <h3 className="text-primary font-semibold mb-3 border-b border-border pb-1">RIB</h3>
            {loading ? (
              <p className="text-center text-muted-foreground py-6">Chargement des domiciliations...</p>
            ) : domiciliations.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucune domiciliation enregistrée.</p>
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-muted-foreground">Banque</th>
                      <th className="px-4 py-2 text-left text-muted-foreground">Guichet</th>
                      <th className="px-4 py-2 text-left text-muted-foreground">N° Compte</th>
                      <th className="px-4 py-2 text-left text-muted-foreground">Clé RIB</th>
                      <th className="px-4 py-2 text-left text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domiciliations.map((d: any, i: number) => (
                      <tr key={i} className="odd:bg-muted/30 border-t border-border">
                        <td className="px-4 py-2 text-[12px] font-semibold text-foreground"> 
                          {[d.BNQ_LIBELLE].filter(Boolean).join(" - ") || "—"}
                        </td>
                        <td className="px-4 py-2 text-[12px] font-semibold text-foreground"> 
                          {[d.GUI_CODE, d.GUI_NOM].filter(Boolean).join(" - ") || "—"}
                        </td>
                        <td className="text-[12px] font-semibold px-4 py-2 text-foreground">
                          {d.DOM_NUMCPT || "_"}
                        </td>
                        <td className="px-4 py-2 text-[12px] font-semibold text-primary">
                          {d.DOM_RIB || "—"}
                        </td>
                        <td className="px-3 py-2 text-[12px] align-top">
                          {(() => {
                            let bgColor = "";
                            let textColor = "";
                            let label = "";

                            switch (d.DOM_STATUT) {
                              case 0:
                                bgColor = "bg-destructive/10";
                                textColor = "text-destructive";
                                label = `Rejeté${d.DOM_MOTIF_REJET ? `: ${d.DOM_MOTIF_REJET}` : ""}`;
                                break;
                              case 1:
                                bgColor = "bg-muted";
                                textColor = "text-muted-foreground";
                                label = "Non approuvé";
                                break;
                              case 2:
                                bgColor = "bg-orange-500/10";
                                textColor = "text-orange-600 dark:text-orange-400";
                                label = "En cours d'approbation...";
                                break;
                              case 3:
                                bgColor = "bg-green-500/10";
                                textColor = "text-green-600 dark:text-green-400";
                                label = "Approuvé";
                                break;
                              default:
                                bgColor = "bg-muted";
                                textColor = "text-muted-foreground";
                                label = "Inconnu";
                            }

                            return (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${bgColor} ${textColor}`}>
                                {label}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-primary font-semibold mb-3 border-b border-border pb-1">Métadonnées</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Info label="Date de saisie :" value={beneficiaire.BEN_DATE_CREER ? new Date(beneficiaire.BEN_DATE_CREER).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                })
                : "_"
              }
              />
              <Info label="Saisi par :" value={beneficiaire.BEN_CREER_PAR} />
              <Info label="Date de modification :" value={beneficiaire.BEN_DATE_MODIFIER ? new Date(beneficiaire.BEN_DATE_MODIFIER).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                })
                : "_"
              }
              />
              <Info label="Modifié par :" value={beneficiaire.BEN_MODIFIER_PAR} />
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