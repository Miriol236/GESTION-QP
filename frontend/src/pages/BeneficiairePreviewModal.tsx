import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, X } from "lucide-react";
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

useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_URL}/typeBeneficiaires-public`, { headers }),
      axios.get(`${API_URL}/fonctions-public`, { headers }),
      axios.get(`${API_URL}/grades-public`, { headers }),
    ])
      .then(([t, f, g,]) => {
        setTypes(t.data);
        setFonctions(f.data);
        setGrades(g.data);
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
            Aperçu du bénéficiaire
          </h2>
          <Button variant="ghost" className="text-white hover:bg-white/20" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300">
          {/* Informations du bénéficiaire */}
          <div>
            <h3 className="text-blue-600 font-semibold mb-3 border-b pb-1">Informations personnelles</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Info label="Matricule solde :" value={beneficiaire.BEN_MATRICULE} />
              <Info label="Nom(s) et Prénom(s) :" value={`${beneficiaire.BEN_NOM} ${beneficiaire.BEN_PRENOM}`} />
              <Info label="Sexe :" value={beneficiaire.BEN_SEXE === "M" ? "Masculin" : beneficiaire.BEN_SEXE === "F" ? "Féminin" : "_"} />
              <Info label="Type :" value={getTypesInfo(beneficiaire.TYP_CODE || "—")} />
              <Info label="Fonction :" value={getFonctionsInfo(beneficiaire.FON_CODE || "—")} />
              <Info label="Grade :" value={getGradesInfo(beneficiaire.GRD_CODE || "—")} />
            </div>
          </div>

          {/* Domiciliations bancaires */}
          <div>
            <h3 className="text-blue-600 font-semibold mb-3 border-b pb-1">RIB</h3>
            {loading ? (
              <p className="text-center text-muted-foreground py-6">Chargement des domiciliations...</p>
            ) : domiciliations.length === 0 ? (
              <p className="text-center text-gray-500">Aucune domiciliation enregistrée.</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Banque</th>
                      <th className="px-4 py-2 text-left">Guichet</th>
                      <th className="px-4 py-2 text-left">N° Compte</th>
                      <th className="px-4 py-2 text-left">Clé RIB</th>
                      <th className="px-4 py-2 text-left">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domiciliations.map((d: any, i: number) => (
                      <tr key={i} className="odd:bg-gray-50 border-t">
                        <td className="px-4 py-2 font-semibold"> {[d.BNQ_LIBELLE].filter(Boolean).join(" - ") || "—"}</td>
                        <td className="px-4 py-2 font-semibold"> {[d.GUI_CODE, d.GUI_NOM].filter(Boolean).join(" - ") || "—"}</td>

                        <td className="font-semibold px-4 py-2">{d.DOM_NUMCPT || "_"}</td>
                        <td className="px-4 py-2 font-semibold text-blue-600">{d.DOM_RIB || "—"}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              d.DOM_STATUT ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {d.DOM_STATUT ? "Actif" : "Inactif"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-blue-600 font-semibold mb-3 border-b pb-1"></h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Info label="Date de saisie :" value={beneficiaire.BEN_DATE_CREER ? new Date(beneficiaire.BEN_DATE_CREER).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
              : "_"
            }
              />
            <Info label="Saisir par :" value={beneficiaire.BEN_CREER_PAR} />
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
