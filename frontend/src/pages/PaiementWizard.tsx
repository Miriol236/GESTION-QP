import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronDown, Edit, Trash2, ArrowRight, ArrowLeft, Power, Plus, X, Save } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { API_URL } from "@/config/api";

export default function PaiementWizard({ onSuccess, paiementData }: { onSuccess?: () => void; paiementData?: any; }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [fonctions, setFonctions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [echeances, setEcheances] = useState<any[]>([]);
  const [elements, setElements] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [dataReady, setDataReady] = useState(true); // true par défaut
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDetailsPaiement, setSelectedDetailsPaiement] = useState<any>(null);

  const [paiement, setPaiement] = useState({
    ECH_CODE: "",
    BEN_CODE: "",
  });

  const [detailsPaiement, setDetailsPaiements] = useState<any[]>([]);
  const [currentDetailsPaiements, setCurrentDetailsPaiements] = useState({
    DET_CODE: "",
    ELT_CODE: "",
    PAI_MONTANT: "",
  });

  const [paieCode, setPaieCode] = useState<string | null>(null);
  const [selectedBenef, setSelectedBenef] = useState<any | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState<number>(2);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const loadPaiementData = async () => {
      // Mode édition uniquement
      if (paiementData) {
        setDataReady(false); // Active le chargement uniquement ici

        if (!listsLoaded) return;

        setPaiement({
          ECH_CODE: paiementData.ECH_CODE || "",
          BEN_CODE: paiementData.BEN_CODE || "",
        });

        setPaieCode(paiementData.PAI_CODE);

        try {
          const token = localStorage.getItem("token");
          const headers = { Authorization: `Bearer ${token}` };
          const res = await axios.get(`${API_URL}/details-paiement/${paiementData.PAI_CODE}`, { headers });
          setDetailsPaiements(res.data);
        } catch {
          toast.error("Erreur lors du chargement des détails de paiement.");
        }

        // Une fois tout prêt — enlever délai artificiel pour accélérer l'affichage
        setDataReady(true);
      }
    };

    loadPaiementData();
  }, [paiementData, listsLoaded]);

  // Charger les listes initiales
  useEffect(() => {
    const loadData = async () => {
      setDataReady(false);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // Charger les listes (bénéficiaires + éléments + échéances + labels utiles)
        const [b, l, e, t, f, g] = await Promise.all([
          axios.get(`${API_URL}/beneficiaires`, { headers }),
          axios.get(`${API_URL}/elements-publics`, { headers }),
          axios.get(`${API_URL}/echeances-publique`, { headers }),
          axios.get(`${API_URL}/typeBeneficiaires-public`, { headers }),
          axios.get(`${API_URL}/fonctions-public`, { headers }),
          axios.get(`${API_URL}/grades-public`, { headers }),
        ]);
        setBeneficiaires(b.data);
        setElements(l.data);
        setEcheances(e.data);
        setTypes(t.data);
        setFonctions(f.data);
        setGrades(g.data);
        // Indiquer que les listes sont chargées pour permettre le remplissage en mode édition
        setListsLoaded(true);

        // Si mode édition
        if (paiementData) {
          setPaiement({
            ECH_CODE: paiementData.ECH_CODE || "",
            BEN_CODE: paiementData.BEN_CODE || "",
          });
          setPaieCode(paiementData.PAI_CODE);

          const domRes = await axios.get(`${API_URL}/details-paiement/${paiementData.PAI_CODE}`, { headers });
          setDetailsPaiements(domRes.data);
        }
      } catch (err) {
        toast.error("Erreur lors du chargement des données.");
      } finally {
        setDataReady(true);
      }
    };

    loadData();
  }, [paiementData]);

  // Charger les détails après création du paiement
  useEffect(() => {
    if (paieCode) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      axios
        .get(`${API_URL}/details-paiement/${paieCode}`, { headers })
        .then((res) => setDetailsPaiements(res.data))
        .catch(() => toast.error("Erreur lors du chargement des détails."));
    }
  }, [paieCode]);

  // Remplir les infos du bénéficiaire sélectionné (sexe / type / fonction / grade)
  useEffect(() => {
    if (!paiement.BEN_CODE) {
      setSelectedBenef(null);
      return;
    }

    const found = beneficiaires.find((b) => String(b.BEN_CODE) === String(paiement.BEN_CODE));
    if (found) {
      setSelectedBenef(found);
    } else {
      setSelectedBenef(null);
    }
  }, [paiement.BEN_CODE, beneficiaires]);

  // Utilitaires d'affichage
  const getElementInfo = (code: string) => {
    const e = elements.find((ech) => String(ech.ELT_CODE).trim() === String(code).trim());
    return e ? `${e.ELT_LIBELLE || "_"}` : code;
  };

  // Enregistrement bénéficiaire (étape 1)
  const handleNext = async () => {
    if (!paiement.ECH_CODE || !paiement.BEN_CODE) {
      toast.warning("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (paiementData) {
        // Mode modification
        await axios.put(`${API_URL}/paiements/${paiementData.PAI_CODE}`, paiement, { headers });
        toast.success("Paiement mis à jour !");
        setStep(2);
      } else {
        // Mode création
        const { data } = await axios.post(`${API_URL}/paiements`, paiement, { headers });
        toast.success("Paiement enregistré !");
        setPaieCode(data.PAI_CODE);
        setStep(2);

        const res = await axios.get(`${API_URL}/details-paiement/${data.PAI_CODE}`, { headers });
        setDetailsPaiements(res.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l’enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  // Met à jour le paiement avant de passer à l'étape 2
  const handleNextWithUpdate = async () => {
    if (!paieCode) return toast.error("Aucun paiement sélectionné !");
    if (!paiement.ECH_CODE || !paiement.BEN_CODE) {
      toast.warning("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.put(`${API_URL}/paiements/${paieCode}`, paiement, { headers });
      toast.success("Paiement mis à jour !");
      setStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };


  // Ajouter ou modifier un paiement
  const handleAddDetailsPaiement = async () => {
    if (!paieCode) return toast.error("Aucun paiement lié !");
    if (!currentDetailsPaiements.ELT_CODE || !currentDetailsPaiements.PAI_MONTANT) {
      return toast.error("Veuillez remplir tous les champs.");
    }

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.post(
        `${API_URL}/details-paiement`,
        {
          ...currentDetailsPaiements,
          PAI_CODE: paieCode,
        },
        { headers }
      );

      // Rafraîchir la liste
      const list = await axios.get(`${API_URL}/details-paiement/${paieCode}`, { headers });
      setDetailsPaiements(list.data);

      // Réinitialiser le formulaire
      setCurrentDetailsPaiements({
        DET_CODE: "",
        ELT_CODE: "",
        PAI_MONTANT: "",
      });

      toast.success(data.message || "Détails ajoutés !");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de l’ajout.");
    }
  };

  // Modifier un détail de paiement
  const handleEdit = (d: any) => {
    if (!d || !d.ELT_CODE) {
      toast.error("Impossible de charger les détails sélectionnés.");
      return;
    }

    setCurrentDetailsPaiements({
        DET_CODE: d.DET_CODE,
        ELT_CODE: d.ELT_CODE,
        PAI_MONTANT: d.PAI_MONTANT,
    });

    setIsEditing(true);
    setEditId(d.DET_CODE);
    toast.info("Vous pouvez maintenant modifier les détails du paiement.");
  };

  // Supprimer un détail de paiement
  const handleDelete = async () => {
    if (!selectedDetailsPaiement) return;

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/details-paiement/${selectedDetailsPaiement.DET_CODE}`, { headers });

      setDetailsPaiements((prev) =>
        prev.filter((item) => item.DET_CODE !== selectedDetailsPaiement.DET_CODE)
      );

        toast.success("Détail de paiement supprimé !");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedDetailsPaiement(null);
    }
  };

  const handleUpdateDetailsPaiement = async () => {
    if (!editId) return toast.error("Aucun détail sélectionné !");
    if (!currentDetailsPaiements.ELT_CODE || !currentDetailsPaiements.PAI_MONTANT) {
      return toast.warning("Veuillez remplir tous les champs.");
    }

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.put(
        `${API_URL}/details-paiement/${editId}`,
        {
            ELT_CODE: currentDetailsPaiements.ELT_CODE,
            PAI_MONTANT: currentDetailsPaiements.PAI_MONTANT,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(data.message || "Détails mis à jour !");
        setIsEditing(false);
        setEditId(null);

      // Rafraîchir la liste
      const res = await axios.get(`${API_URL}/details-paiement/${paieCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update local list with fresh data
      setDetailsPaiements(res.data);

      // Réinitialiser le formulaire
      setCurrentDetailsPaiements({
        DET_CODE: "",
        ELT_CODE: "",
        PAI_MONTANT: "",
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de la mise à jour.");
    }
  };

  const handleFinish = () => {
    toast.success("Paiement finalisé avec succès !");
    if (onSuccess) onSuccess();
  };

  // ComboBox réutilisable
  const ComboBox = ({ label, items, value, onSelect, display, disabled = false }: any) => {
    const [open, setOpen] = useState(false);
    const selected = items.find(
      (i: any) =>
        i.ECH_CODE === value ||
        i.BEN_CODE === value ||
        i.ELT_CODE === value
    );

    return (
      <div>
        <Label>{label}</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between truncate text-left" disabled={disabled}>
              {selected ? (
                <span className="truncate max-w-[230px]">{display(selected)}</span>
              ) : (
                <span className="text-muted-foreground">-- Sélectionner --</span>
              )}
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
            </Button>
          </PopoverTrigger>
          {!disabled && (
            // Popover responsive : full width on very small screens, constrained on larger
            <PopoverContent className="p-0 w-full sm:w-[300px]">
              <Command>
                <CommandInput placeholder={`Rechercher ${label.toLowerCase()}...`} />
                <CommandList>
                  <CommandEmpty>Aucun résultat</CommandEmpty>
                  <CommandGroup>
                    {items.map((item: any) => (
                      <CommandItem
                        key={
                          item.ECH_CODE ||
                          item.BEN_CODE ||
                          item.ELT_CODE
                        }
                        onSelect={() => {
                          onSelect(
                            item.ELT_CODE ??
                            item.ECH_CODE ??
                            item.BEN_CODE
                          );
                          setTimeout(() => setOpen(false), 100);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${value ===
                            (item.ECH_CODE ||
                              item.BEN_CODE ||
                              item.ELT_CODE)
                            ? "opacity-100 text-blue-600"
                            : "opacity-0"
                            }`}
                        />
                        {display(item)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>
      </div>
    );
  };

  const stepTitles = ["Informations du paiement d'un bénéficiaire", "Détails du paiement"];

  return (
    // Structure principale moderne et responsive
    <div className="w-full max-w-4xl lg:max-w-6xl mx-auto p-0 sm:p-8 bg-white rounded-xl shadow-lg ring-1 ring-gray-100">
      {/* Wrapper full-height on mobile so header/footer can be sticky */}
      <div className="flex flex-col h-screen md:h-auto">
        <div className="p-4 sm:p-8">

          {/* Entête dynamique */}
          <div className="relative mb-4 md:mb-10 sticky top-0 bg-white z-30 py-2">
            {/* Barre de progression */}
            <div className="absolute top-5 left-0 w-full h-2 bg-gray-100 rounded-full">
              <motion.div
                className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(step / stepTitles.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Étapes avec icônes et textes */}
            <div className="flex justify-between items-center relative z-10 gap-2 px-1">
              {stepTitles.map((title, index) => {
                const isActive = step === index + 1;
                const isCompleted = step > index + 1;
                return (
                  <div key={index} className="flex flex-col items-center w-full px-1">
                    <motion.div
                      className={`flex items-center justify-center min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border-2 transition-all
                        ${isActive
                          ? "border-blue-600 bg-blue-600 text-white scale-105 shadow-lg"
                          : isCompleted
                          ? "border-blue-600 bg-blue-100 text-blue-600"
                          : "border-gray-300 bg-white text-gray-400"
                        }`}
                      whileHover={{ scale: isActive ? 1.05 : 1 }}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </motion.div>
                    <span className={`mt-3 text-xs sm:text-sm font-medium text-center ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Contenu scrollable (évite de perdre l'entête et le footer sur mobile) */}
        <div className="flex-1 overflow-auto px-4 sm:px-8 pb-28">

          {/* Étape 1 */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Top: selectors (Echéance + Bénéficiaire) */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ComboBox
                    label="Echéance *"
                    items={echeances}
                    value={paiement.ECH_CODE}
                    onSelect={(v: any) => setPaiement({ ...paiement, ECH_CODE: v })}
                    display={(f: any) => f.ECH_LIBELLE}
                  />

                  <ComboBox
                    label="Bénéficiaire *"
                    items={beneficiaires}
                    value={paiement.BEN_CODE}
                    onSelect={(v: any) => setPaiement({ ...paiement, BEN_CODE: v })}
                    display={(t: any) => `${t.BEN_NOM} ${t.BEN_PRENOM || " "}`}
                  />
                </div>

                {/* Info inputs: hidden until a beneficiary is selected */}
                <div className={`transition-all duration-200 ${selectedBenef ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Sexe</Label>
                      <Input
                        value={selectedBenef ? (selectedBenef.BEN_SEXE === 'M' ? 'Masculin' : selectedBenef.BEN_SEXE === 'F' ? 'Féminin' : '') : ''}
                        readOnly
                        disabled
                        className="bg-gray-100 text-gray-700 h-9"
                      />
                    </div>

                    <div>
                      <Label>Type</Label>
                      <Input
                        value={selectedBenef ? (types.find(t => t.TYP_CODE === selectedBenef.TYP_CODE)?.TYP_LIBELLE || selectedBenef.TYP_CODE || '') : ''}
                        readOnly
                        disabled
                        className="bg-gray-100 text-gray-700 h-9"
                      />
                    </div>

                    <div>
                      <Label>Fonction</Label>
                      <Input
                        value={selectedBenef ? (fonctions.find(f => f.FON_CODE === selectedBenef.FON_CODE)?.FON_LIBELLE || selectedBenef.FON_CODE || '') : ''}
                        readOnly
                        disabled
                        className="bg-gray-100 text-gray-700 h-9"
                      />
                    </div>

                    <div>
                      <Label>Grade</Label>
                      <Input
                        value={selectedBenef ? (grades.find(g => g.GRD_CODE === selectedBenef.GRD_CODE)?.GRD_LIBELLE || selectedBenef.GRD_CODE || '') : ''}
                        readOnly
                        disabled
                        className="bg-gray-100 text-gray-700 h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons placed at the bottom of the block */}
                <div className="mt-6 flex justify-end">
                  {paiementData ? (
                    <Button onClick={handleNextWithUpdate} disabled={loading} className="px-4">
                      {loading ? 'Mise à jour...' : (
                        <>
                          Suivant
                          <motion.div animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="ml-2">
                            <ArrowRight className="w-4 h-4" />
                          </motion.div>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleNext} disabled={loading} className="px-4">
                      {loading ? 'Enregistrement...' : (
                        <>
                          Suivant
                          <motion.div animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="ml-2">
                            <ArrowRight className="w-4 h-4" />
                          </motion.div>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Étape 2 */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Formulaire d'ajout/modification : responsive (1 / 2 / 3 colonnes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">

                <ComboBox
                  label="Elément *"
                  items={elements}
                  value={currentDetailsPaiements.ELT_CODE}
                  onSelect={(v: any) => setCurrentDetailsPaiements({ ...currentDetailsPaiements, ELT_CODE: v})}
                  display={(b: any) => `${b.ELT_LIBELLE}`}
                />

                <div>
                  <Label>Montant</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    step={1}
                    value={currentDetailsPaiements.PAI_MONTANT}
                    onChange={(e) => {
                      // keep only digits (integers in F CFA). Store as string to avoid controlled/uncontrolled issues
                      const raw = e.target.value;
                      const sanitized = raw.replace(/[^0-9.-]/g, "");
                      setCurrentDetailsPaiements({ ...currentDetailsPaiements, PAI_MONTANT: sanitized });
                    }}
                    placeholder="Montant en F CFA"
                    className="h-9 w-full"
                  />
                </div>

                {/* actions */}
                <div className="md:col-span-3 mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">

                  <div className="flex-1" />

                  <div className="w-full sm:w-auto flex gap-2">
                    <Button
                      onClick={isEditing ? handleUpdateDetailsPaiement : handleAddDetailsPaiement}
                      disabled={!isEditing && !currentDetailsPaiements.ELT_CODE}
                      className={`px-3 py-1.5 rounded-md text-sm
                        ${isEditing
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : currentDetailsPaiements.ELT_CODE
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }
                      `}
                    >
                      {isEditing ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Mettre à jour
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter
                        </>
                      )}
                    </Button>

                    {isEditing && (
                      <Button
                        className="px-3 py-1.5 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => {
                          setIsEditing(false);
                          setEditId(null);
                          setCurrentDetailsPaiements({
                            DET_CODE: "",
                            PAI_MONTANT: "",
                            ELT_CODE: "",
                          });
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable details container: only this area scrolls so header and buttons stay visible */}
              <div className="overflow-auto max-h-[48vh] md:max-h-[36vh] mb-3 touch-pan-y">
                {/* Controls: rows per page + simple pagination */}
                <div className="flex items-center justify-between mb-2">
                  <div />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Lignes / page</span>
                      <select
                        className="border rounded px-2 py-1 bg-white"
                        value={rowsPerPage}
                        onChange={(e) => {
                          const v = Number(e.target.value) || 5;
                          setRowsPerPage(v);
                          setPage(1);
                        }}
                      >
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 rounded border bg-white disabled:opacity-50"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        Prev
                      </button>
                      <span className="text-sm">{page} / {Math.max(1, Math.ceil(detailsPaiement.length / rowsPerPage))}</span>
                      <button
                        className="px-2 py-1 rounded border bg-white disabled:opacity-50"
                        onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(detailsPaiement.length / rowsPerPage)), p + 1))}
                        disabled={page >= Math.max(1, Math.ceil(detailsPaiement.length / rowsPerPage))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
                {/* Vue mobile (cards) */}
                <div className="flex flex-col gap-2 md:hidden">
                  {detailsPaiement.length === 0 ? (
                      <div className="p-4 bg-gray-50 rounded-md text-center text-gray-500">Aucun détail ajouté.</div>
                    ) : (
                      // simple paging for mobile cards
                      detailsPaiement
                        .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                        .map((d, i) => (
                      <div key={i} className="p-2 bg-white rounded-lg shadow-sm border flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-medium">{getElementInfo(d.ELT_CODE)}</div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(d)}>
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedDetailsPaiement(d);
                            setIsDeleteDialogOpen(true);
                          }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Tableau desktop */}
                <div className="hidden md:block rounded-xl border bg-white shadow-sm">
                  <div className="overflow-auto max-h-[36vh]">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left">Elémet</th>
                          <th className="px-3 py-2 text-left">Montant F CFA</th>
                          <th className="px-3 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {detailsPaiement.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center text-gray-500 py-4">Aucun détail ajouté.</td>
                          </tr>
                        ) : (
                          // simple paging for desktop table
                          detailsPaiement
                            .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                            .map((d, i) => (
                              <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-2 align-top">{getElementInfo(d.ELT_CODE)}</td>
                                <td className="px-3 py-2 font-medium align-top">{Number(d.PAI_MONTANT).toLocaleString("fr-FR")}</td>
                                <td className="px-3 py-2 text-right align-top space-x-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(d)}>
                                    <Edit className="w-4 h-4 text-blue-500" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setSelectedDetailsPaiement(d);
                                    setIsDeleteDialogOpen(true);
                                  }}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Boutons de navigation (desktop) */}
              <div className="flex flex-col md:flex-row justify-between mt-6 gap-2">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto"
                  onClick={() => setStep(1)}
                >
                  <motion.div
                    animate={{ x: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="mr-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </motion.div>
                  Précédent
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  {loading ? (
                    "Enregistrement..."
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Terminer
                    </>
                  )}
                </Button>
              </div>

            </motion.div>
          )}

        </div>

        <ConfirmDeleteDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          itemName={
            selectedDetailsPaiement
              ? `Le détail du paiement : ${getElementInfo(selectedDetailsPaiement.ELT_CODE)} - Montant = ${selectedDetailsPaiement.PAI_MONTANT || "0"} F CFA`
              : ""
          }
        />
      </div>
    </div>
  );
}