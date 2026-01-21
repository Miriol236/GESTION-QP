import { useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  beneficiaire: any;
  domiciliations: any[];
};

export default function DomicilierPreviewModal({
  open,
  onClose,
  beneficiaire,
  domiciliations = [],
}: Props) {
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

  const statutBadge = (statut: number) =>
    statut === 2 ? (
      <Badge className="bg-orange-100 text-orange-700">
        En attente d’approbation
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-600">Inconnu</Badge>
    );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-3 bg-blue-600 text-white">
          <h2 className="flex items-center gap-2 font-semibold">
            <Eye className="w-5 h-5" />
            Aperçu domiciliation bancaire
          </h2>
          <Button variant="ghost" onClick={onClose}>
            <X />
          </Button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* INFOS BÉNÉFICIAIRE */}
          <h3 className="font-semibold text-blue-600 mb-2">
              Information du bénéficiaire
            </h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <Info label="Matricule solde :" value={beneficiaire.BEN_MATRICULE} />
            <Info label="Nom & Prénom :" value={beneficiaire.MVT_BEN_NOM_PRE} />
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

          {/* TABLE RIB */}
          <div>
            <h3 className="font-semibold text-blue-600 mb-2">
              Domiciliation bancaire (RIB)
            </h3>

            {domiciliations.length === 0 ? (
              <p className="text-center text-gray-500">
                Aucune domiciliation enregistrée.
              </p>
            ) : (
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Banque</th>
                    <th className="px-3 py-2 text-left">Guichet</th>
                    <th className="px-3 py-2 text-left">N° Compte</th>
                    <th className="px-3 py-2 text-left">Clé RIB</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {domiciliations.map((d, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{d.BANQUE ?? "—"}</td>
                      <td className="px-3 py-2">{d.GUICHET ?? "—"}</td>
                      <td className="px-3 py-2">{d.NUMCPT ?? "—"}</td>
                      <td className="px-3 py-2">{d.RIB ?? "—"}</td>
                      <td className="px-3 py-2">
                        {statutBadge(d.DOM_STATUT)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* META */}
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
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}