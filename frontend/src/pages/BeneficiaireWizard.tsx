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

export default function BeneficiaireWizard({ onSuccess, beneficiaireData, onFinish }: { onSuccess?: () => void; beneficiaireData?: any; onFinish?: () => void; }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [types, setTypes] = useState<any[]>([]);
  const [fonctions, setFonctions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [banques, setBanques] = useState<any[]>([]);
  const [guichets, setGuichets] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [dataReady, setDataReady] = useState(true); // true par défaut
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDomiciliation, setSelectedDomiciliation] = useState<any>(null);

  const [beneficiaire, setBeneficiaire] = useState({
    BEN_MATRICULE: "",
    BEN_NOM: "",
    BEN_PRENOM: "",
    BEN_SEXE: "",
    TYP_CODE: "",
    FON_CODE: "",
    GRD_CODE: "",
  });

  const [domiciliations, setDomiciliations] = useState<any[]>([]);
  const [currentDomiciliation, setCurrentDomiciliation] = useState({
    DOM_CODE: "",
    DOM_NUMCPT: "",
    BNQ_CODE: "",
    GUI_ID: "",
    DOM_RIB: "",
  });

  const [benefCode, setBenefCode] = useState<string | null>(null);

  useEffect(() => {
    const loadBeneficiaireData = async () => {
      // Mode édition uniquement
      if (beneficiaireData) {
        setDataReady(false); // Active le chargement uniquement ici

        if (!listsLoaded) return;

        setBeneficiaire({
          BEN_MATRICULE: beneficiaireData.BEN_MATRICULE || "",
          BEN_NOM: beneficiaireData.BEN_NOM || "",
          BEN_PRENOM: beneficiaireData.BEN_PRENOM || "",
          BEN_SEXE: beneficiaireData.BEN_SEXE || "",
          TYP_CODE: beneficiaireData.TYP_CODE || "",
          FON_CODE: beneficiaireData.FON_CODE || "",
          GRD_CODE: beneficiaireData.GRD_CODE || "",
        });

        setBenefCode(beneficiaireData.BEN_CODE);

        try {
          const token = localStorage.getItem("token");
          const headers = { Authorization: `Bearer ${token}` };
          const res = await axios.get(`${API_URL}/domiciliations/${beneficiaireData.BEN_CODE}`, { headers });
          setDomiciliations(res.data);
        } catch {
          toast.error("Erreur lors du chargement des domiciliations.");
        }

        // Une fois tout prêt — enlever délai artificiel pour accélérer l'affichage
        setDataReady(true);
      }
    };

    loadBeneficiaireData();
  }, [beneficiaireData, listsLoaded]);

  // Charger les listes initiales
  useEffect(() => {
    const loadData = async () => {
      setDataReady(false);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // Charger les listes
        const [t, f, g, b, q] = await Promise.all([
          axios.get(`${API_URL}/typeBeneficiaires-public`, { headers }),
          axios.get(`${API_URL}/fonctions-public`, { headers }),
          axios.get(`${API_URL}/grades-public`, { headers }),
          axios.get(`${API_URL}/banques-public`, { headers }),
          axios.get(`${API_URL}/guichets-public`, { headers }),
        ]);
        setTypes(t.data);
        setFonctions(f.data);
        setGrades(g.data);
        setBanques(b.data);
        setGuichets(q.data);
        // Indiquer que les listes sont chargées pour permettre le remplissage en mode édition
        setListsLoaded(true);

        // Si mode édition
        if (beneficiaireData) {
          setBeneficiaire({
            BEN_MATRICULE: beneficiaireData.BEN_MATRICULE || "",
            BEN_NOM: beneficiaireData.BEN_NOM || "",
            BEN_PRENOM: beneficiaireData.BEN_PRENOM || "",
            BEN_SEXE: beneficiaireData.BEN_SEXE || "",
            TYP_CODE: beneficiaireData.TYP_CODE || "",
            FON_CODE: beneficiaireData.FON_CODE || "",
            GRD_CODE: beneficiaireData.GRD_CODE || "",
          });
          setBenefCode(beneficiaireData.BEN_CODE);

          const domRes = await axios.get(`${API_URL}/domiciliations/${beneficiaireData.BEN_CODE}`, { headers });
          setDomiciliations(domRes.data);
        }
      } catch (err) {
        toast.error("Erreur lors du chargement des données.");
      } finally {
        setDataReady(true);
      }
    };

    loadData();
  }, [beneficiaireData]);

  // Charger les domiciliations après création du bénéficiaire
  useEffect(() => {
    if (benefCode) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      axios
        .get(`${API_URL}/domiciliations/${benefCode}`, { headers })
        .then((res) => setDomiciliations(res.data))
        .catch(() => toast.error("Erreur lors du chargement des domiciliations."));
    }
  }, [benefCode]);

  // Utilitaires d'affichage
  const getBanqueInfo = (code: string) => {
    const b = banques.find((bnq) => String(bnq.BNQ_CODE).trim() === String(code).trim());
    return b ? `${b.BNQ_NUMERO} - ${b.BNQ_LIBELLE || "—"}` : code;
  };

  const getGuichetInfo = (id: string) => {
    const g = guichets.find((gui) => String(gui.GUI_ID).trim() === String(id).trim());
    return g ? `${g.GUI_CODE} - ${g.GUI_NOM || "—"}` : id;
  };

  const calculerCleRib = (BNQ_CODE: string, GUI_ID: string, DOM_NUMCPT: string) => {
    const banque = banques.find(b => String(b.BNQ_CODE).trim() === String(BNQ_CODE).trim());
    const guichet = guichets.find(g => String(g.GUI_ID).trim() === String(GUI_ID).trim());
    if (!banque || !guichet || !DOM_NUMCPT) return "";

    const codeBanque = String(banque.BNQ_NUMERO || "00000").padStart(5, "0");
    const codeGuichet = String(guichet.GUI_CODE || "00000").padStart(5, "0");

    const numCompte = DOM_NUMCPT.toUpperCase().trim();

    // Extrait uniquement les chiffres pour le calcul
    const onlyDigits = numCompte.replace(/\D/g, "");
    // Lettres détectées ?
    const containsLetters = /[A-Z]/.test(numCompte);

    // Conditions pour calcul de RIB
    if (onlyDigits.length < 11 || containsLetters) {
      return ""; // pas de clé
    }

    // Base RIB pour calcul
    const ribBase = codeBanque + codeGuichet + onlyDigits + "00";

    // Calcul mod 97
    let reste = 0;
    for (let i = 0; i < ribBase.length; i++) {
      reste = (reste * 10 + Number(ribBase[i])) % 97;
    }

    const cle = 97 - reste;
    return String(cle).padStart(2, "0");
  };

  // Enregistrement bénéficiaire (étape 1)
  const handleNext = async () => {
    if (!beneficiaire.BEN_NOM || !beneficiaire.BEN_PRENOM || !beneficiaire.TYP_CODE) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (beneficiaireData) {
        // Mode modification
        await axios.put(`${API_URL}/beneficiaires/${beneficiaireData.BEN_CODE}`, beneficiaire, { headers });
        toast.success("Bénéficiaire mis à jour !");
        setStep(2);
      } else {
        // Mode création
        const { data } = await axios.post(`${API_URL}/beneficiaires`, beneficiaire, { headers });
        toast.success("Bénéficiaire enregistré !");
        setBenefCode(data.BEN_CODE);
        setStep(2);

        const res = await axios.get(`${API_URL}/domiciliations/${data.BEN_CODE}`, { headers });
        setDomiciliations(res.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l’enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  // Met à jour le bénéficiaire avant de passer à l'étape 2
  const handleNextWithUpdate = async () => {
    if (!benefCode) return toast.error("Aucun bénéficiaire sélectionné !");
    if (!beneficiaire.BEN_NOM || !beneficiaire.BEN_PRENOM || !beneficiaire.TYP_CODE) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.put(`${API_URL}/beneficiaires/${benefCode}`, beneficiaire, { headers });
      toast.success("Bénéficiaire mis à jour !");
      setStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };


  // Ajouter ou modifier une domiciliation
  const handleAddDomiciliation = async () => {
    if (!benefCode) return toast.error("Aucun bénéficiaire lié !");
    if (!currentDomiciliation.BNQ_CODE || !currentDomiciliation.GUI_ID) {
      return toast.error("Veuillez remplir tous les champs.");
    }

    const ribKey = calculerCleRib(
      currentDomiciliation.BNQ_CODE,
      currentDomiciliation.GUI_ID,
      currentDomiciliation.DOM_NUMCPT
    );

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.post(
        `${API_URL}/domiciliations`,
        {
          ...currentDomiciliation,
          BEN_CODE: benefCode,
          DOM_RIB: ribKey,
        },
        { headers }
      );

      // Rafraîchir la liste
      const list = await axios.get(`${API_URL}/domiciliations/${benefCode}`, { headers });
      setDomiciliations(list.data);

      // Réinitialiser le formulaire
      setCurrentDomiciliation({
        DOM_CODE: "",
        DOM_NUMCPT: "",
        BNQ_CODE: "",
        GUI_ID: "",
        DOM_RIB: "",
      });

      toast.success(data.message || "Domiciliation ajoutée !");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de l’ajout.");
    }
  };

  // Modifier une domiciliation
  const handleEdit = (d: any) => {
    if (!d || !d.DOM_CODE) {
      toast.error("Impossible de charger la domiciliation sélectionnée.");
      return;
    }

    setCurrentDomiciliation({
      DOM_CODE: d.DOM_CODE,
      BNQ_CODE: d.BNQ_CODE,
      GUI_ID: d.GUI_ID,
      DOM_NUMCPT: d.DOM_NUMCPT,
      DOM_RIB: d.DOM_RIB,
    });

    setIsEditing(true);
    setEditId(d.DOM_CODE);
    toast.info("Domiciliation chargée pour modification !");
  };

  // Supprimer une domiciliation
  const handleDelete = async () => {
    if (!selectedDomiciliation) return;

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/domiciliations/${selectedDomiciliation.DOM_CODE}`, { headers });

      setDomiciliations((prev) =>
        prev.filter((item) => item.DOM_CODE !== selectedDomiciliation.DOM_CODE)
      );

      toast.success("Domiciliation supprimée avec succès !");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedDomiciliation(null);
    }
  };

  const handleUpdateDomiciliation = async () => {
    if (!editId) return toast.error("Aucune domiciliation sélectionnée !");
    if (!currentDomiciliation.BNQ_CODE || !currentDomiciliation.GUI_ID) {
      return toast.error("Veuillez remplir tous les champs.");
    }

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.put(
        `${API_URL}/domiciliations/${editId}`,
        {
          BNQ_CODE: currentDomiciliation.BNQ_CODE,
          GUI_ID: currentDomiciliation.GUI_ID,
          DOM_NUMCPT: currentDomiciliation.DOM_NUMCPT,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Domiciliation mise à jour !");
      setIsEditing(false);
      setEditId(null);

      // Rafraîchir la liste
      const res = await axios.get(`${API_URL}/domiciliations/${benefCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDomiciliations(res.data);

      // Réinitialiser le formulaire
      setCurrentDomiciliation({
        DOM_CODE: "",
        DOM_NUMCPT: "",
        BNQ_CODE: "",
        GUI_ID: "",
        DOM_RIB: "",
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de la mise à jour.");
    }
  };

  const handleToggleStatus = async (d: any) => {
    if (!d || !d.DOM_CODE) {
      return toast.error("Aucune domiciliation sélectionnée !");
    }

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Appel unique au backend pour activer/désactiver automatiquement
      const response = await axios.put(
        `${API_URL}/domiciliations/${d.DOM_CODE}/toggle`,
        {},
        { headers }
      );

      // Mettre à jour l’état local avec le résultat du backend
      setDomiciliations((prev) =>
        prev.map((item) =>
          item.DOM_CODE === d.DOM_CODE
            ? { ...item, DOM_STATUT: response.data.DOM_STATUT === "Active" }
            : // Si le backend a activé celle-ci, désactiver les autres
              response.data.DOM_STATUT === "Active"
              ? { ...item, DOM_STATUT: false }
              : item
        )
      );

      const res = await axios.get(`${API_URL}/domiciliations/${benefCode}`, { headers });
      setDomiciliations(res.data);

      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors du changement de statut.");
    }
  };

  const handleFinish = () => {
    toast.success("Bénéficiaire et domiciliations enregistrés !");
    if (onFinish) onFinish();
    if (onSuccess) onSuccess();
  };

  // ComboBox réutilisable
  const ComboBox = ({ label, items, value, onSelect, display, disabled = false }: any) => {
    const [open, setOpen] = useState(false);
    const selected = items.find(
      (i: any) =>
        i.TYP_CODE === value ||
        i.FON_CODE === value ||
        i.GRD_CODE === value ||
        i.BNQ_CODE === value ||
        i.GUI_ID === value
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
                          item.TYP_CODE ||
                          item.FON_CODE ||
                          item.GRD_CODE ||
                          item.BNQ_CODE ||
                          item.GUI_ID
                        }
                        onSelect={() => {
                          onSelect(
                            item.GUI_ID ??
                            item.BNQ_CODE ??
                            item.TYP_CODE ??
                            item.FON_CODE ??
                            item.GRD_CODE
                          );
                          setTimeout(() => setOpen(false), 100);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${value ===
                            (item.TYP_CODE ||
                              item.FON_CODE ||
                              item.GRD_CODE ||
                              item.BNQ_CODE ||
                              item.GUI_ID)
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

  const banquesPrimaires = ["20001", "20002", "20003", "20005"]; // numéros officiels des banques primaires

  const stepTitles = ["Informations du bénéficiaire", "RIB du bénéficiaire"];

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
              <div className="flex flex-col gap-4 md:gap-5">
                {/* Matricule en haut, pleine largeur sur mobile, 1/3 sur desktop */}
                <div className="w-full sm:w-1/2 md:w-1/3">
                  <Label>Matricule solde</Label>
                  <Input
                    value={beneficiaire.BEN_MATRICULE}
                    onChange={(e) =>
                      setBeneficiaire({
                        ...beneficiaire,
                        BEN_MATRICULE: e.target.value.toUpperCase(),
                      })
                    }
                    className="h-12 text-sm text-gray-900 caret-blue-600 w-full"
                  />
                </div>

                {/* Les autres champs en dessous, 1 colonne sur mobile, 2 sur small, 3 colonnes sur desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Nom <span className="text-red-500">*</span></Label>
                    <Input
                      value={beneficiaire.BEN_NOM}
                      onChange={(e) =>
                        setBeneficiaire({
                          ...beneficiaire,
                          BEN_NOM: e.target.value.toUpperCase(), // Conversion auto en MAJ
                        })
                      }
                      className="h-12 text-sm uppercase text-gray-900 caret-blue-600 w-full" // Affichage en MAJ
                    />
                  </div>

                  <div>
                    <Label>Prénom <span className="text-red-500">*</span></Label>
                    <Input
                      value={beneficiaire.BEN_PRENOM}
                      onChange={(e) =>
                        setBeneficiaire({
                          ...beneficiaire,
                          BEN_PRENOM: e.target.value.toUpperCase(), // Conversion auto en MAJ
                        })
                      }
                      className="h-12 text-sm uppercase text-gray-900 caret-blue-600 w-full" // Affichage en MAJ
                    />
                  </div>

                  {/* Sexe en pleine largeur sur mobile, compact sur desktop */}
                  <div className="col-span-1 md:col-span-1">
                    <Label>Sexe <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="sexe"
                          value="M"
                          checked={beneficiaire.BEN_SEXE === "M"}
                          onChange={(e) =>
                            setBeneficiaire({
                              ...beneficiaire,
                              BEN_SEXE: e.target.value,
                            })
                          }
                          className="accent-blue-600 w-4 h-4"
                        />
                        Masculin
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="sexe"
                          value="F"
                          checked={beneficiaire.BEN_SEXE === "F"}
                          onChange={(e) =>
                            setBeneficiaire({
                              ...beneficiaire,
                              BEN_SEXE: e.target.value,
                            })
                          }
                          className="accent-pink-500 w-4 h-4"
                        />
                        Féminin
                      </label>
                    </div>
                  </div>

                  <ComboBox
                    label="Type de bénéficiaire *"
                    items={types}
                    value={beneficiaire.TYP_CODE}
                    onSelect={(v: any) =>
                      setBeneficiaire({ ...beneficiaire, TYP_CODE: v })
                    }
                    display={(t: any) => t.TYP_LIBELLE}
                  />

                  <ComboBox
                    label="Fonction"
                    items={fonctions}
                    value={beneficiaire.FON_CODE}
                    onSelect={(v: any) =>
                      setBeneficiaire({ ...beneficiaire, FON_CODE: v })
                    }
                    display={(f: any) => f.FON_LIBELLE}
                  />

                  <ComboBox
                    label="Grade"
                    items={grades}
                    value={beneficiaire.GRD_CODE}
                    onSelect={(v: any) =>
                      setBeneficiaire({ ...beneficiaire, GRD_CODE: v })
                    }
                    display={(g: any) => g.GRD_LIBELLE}
                  />
                </div>

                {/* Boutons */}
                <div className="flex flex-col sm:flex-row justify-end mt-5 space-y-2 sm:space-y-0 sm:space-x-4">
                  {beneficiaireData ? (
                    <Button onClick={handleNextWithUpdate} disabled={!dataReady || loading}>
                      {loading ? (
                        "Mise à jour..."
                      ) : (
                        <>
                          Suivant
                          <motion.div
                            animate={{ x: [0, 3, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="ml-2"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </motion.div>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleNext} disabled={loading}>
                      {loading ? (
                        "Enregistrement..."
                      ) : (
                        <>
                          Suivant
                          <motion.div
                            animate={{ x: [0, 3, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="ml-2"
                          >
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

                {/* Banque */}
                <ComboBox
                  label="Banque *"
                  items={banques}
                  value={currentDomiciliation.BNQ_CODE}
                  onSelect={(v: any) => setCurrentDomiciliation({ ...currentDomiciliation, BNQ_CODE: v, GUI_ID: "" })}
                  display={(b: any) => `${b.BNQ_NUMERO} - ${b.BNQ_LIBELLE}`}
                />

                {/* Guichet */}
                <ComboBox
                  label="Guichet *"
                  items={guichets.filter((g) => String(g.BNQ_CODE).trim() === String(currentDomiciliation.BNQ_CODE).trim())}
                  value={currentDomiciliation.GUI_ID}
                  onSelect={(v: any) => setCurrentDomiciliation({ ...currentDomiciliation, GUI_ID: v })}
                  display={(g: any) => `${g.GUI_CODE} - ${g.GUI_NOM || "—"}`}
                  disabled={!currentDomiciliation.BNQ_CODE}
                />

                {/* Numéro de compte */}
                <div>
                  <Label>Numéro de compte</Label>
                  <Input
                    value={currentDomiciliation.DOM_NUMCPT}
                    onChange={(e) => {
                      let num = e.target.value;
                      const banque = banques.find(
                        (b) => String(b.BNQ_CODE).trim() === String(currentDomiciliation.BNQ_CODE).trim()
                      );
                      const isPrimaire = banque ? banquesPrimaires.includes(String(banque.BNQ_NUMERO)) : false;
                      if (isPrimaire) {
                        num = num.replace(/\D/g, "").slice(0, 11);
                      }
                      const rib = calculerCleRib(currentDomiciliation.BNQ_CODE, currentDomiciliation.GUI_ID, num);
                      setCurrentDomiciliation({ ...currentDomiciliation, DOM_NUMCPT: num, DOM_RIB: rib });
                    }}
                    placeholder={
                      currentDomiciliation.BNQ_CODE &&
                      banques.find((b) => String(b.BNQ_CODE).trim() === String(currentDomiciliation.BNQ_CODE).trim())?.BNQ_NUMERO &&
                      banquesPrimaires.includes(
                        banques.find((b) => String(b.BNQ_CODE).trim() === String(currentDomiciliation.BNQ_CODE).trim())?.BNQ_NUMERO
                      )
                        ? "11 chiffres uniquement"
                        : ""
                    }
                    className="h-9 w-full"
                  />
                </div>

                {/* Clé RIB et actions */}
                <div className="md:col-span-3 mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-sm text-muted-foreground">Clé RIB :</span>
                    <span className="font-semibold text-blue-600">{currentDomiciliation.DOM_RIB || "—"}</span>
                  </div>

                  <div className="flex-1" />

                  <div className="w-full sm:w-auto flex gap-2">
                    <Button
                      onClick={isEditing ? handleUpdateDomiciliation : handleAddDomiciliation}
                      disabled={!isEditing && !currentDomiciliation.BNQ_CODE}
                      className={`px-3 py-1.5 rounded-md text-sm
                        ${isEditing
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : currentDomiciliation.BNQ_CODE
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
                          setCurrentDomiciliation({
                            DOM_CODE: "",
                            DOM_NUMCPT: "",
                            BNQ_CODE: "",
                            GUI_ID: "",
                            DOM_RIB: "",
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

              {/* Vue mobile (cards) */}
              <div className="flex flex-col gap-2 md:hidden mb-3">
                {domiciliations.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-md text-center text-gray-500">Aucune domiciliation ajoutée.</div>
                ) : (
                  domiciliations.map((d, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg shadow-sm border flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="text-sm font-medium">{getBanqueInfo(d.BNQ_CODE)}</div>
                        <div className="text-xs">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${d.DOM_STATUT ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {d.DOM_STATUT ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">{getGuichetInfo(d.GUI_ID)}</div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-gray-500">N° Compte</div>
                          <div className="font-medium">{d.DOM_NUMCPT}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Clé RIB</div>
                          <div className="text-blue-600 font-medium">{d.DOM_RIB || "—"}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(d)} title={d.DOM_STATUT ? "Désactiver" : "Activer"}>
                          <Power className={`w-4 h-4 ${d.DOM_STATUT ? "text-gray-500" : "text-green-500"}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(d)}>
                          <Edit className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedDomiciliation(d);
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
              <div className="hidden md:block rounded-xl border bg-white overflow-auto max-h-[360px] shadow-sm">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left">Banque</th>
                      <th className="px-3 py-2 text-left">Guichet</th>
                      <th className="px-3 py-2 text-left">N° Compte</th>
                      <th className="px-3 py-2 text-left">Clé RIB</th>
                      <th className="px-3 py-2 text-left">Statut</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {domiciliations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-500 py-4">Aucune domiciliation ajoutée.</td>
                      </tr>
                    ) : (
                      domiciliations.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 align-top">{getBanqueInfo(d.BNQ_CODE)}</td>
                          <td className="px-3 py-2 align-top">{getGuichetInfo(d.GUI_ID)}</td>
                          <td className="px-3 py-2 font-medium align-top">{d.DOM_NUMCPT}</td>
                          <td className="px-3 py-2 text-blue-600 font-medium align-top">{d.DOM_RIB || "—"}</td>
                          <td className="px-3 py-2 align-top">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${d.DOM_STATUT ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                              {d.DOM_STATUT ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right align-top space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(d)} title={d.DOM_STATUT ? "Désactiver" : "Activer"}>
                              <Power className={`w-4 h-4 ${d.DOM_STATUT ? "text-gray-500" : "text-green-500"}`} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(d)}>
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedDomiciliation(d);
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
            selectedDomiciliation
              ? `Le RIB : ${getBanqueInfo(selectedDomiciliation.BNQ_CODE)} - ${selectedDomiciliation.DOM_NUMCPT || "_"}-${selectedDomiciliation.DOM_RIB}`
              : ""
          }
        />
      </div>
    </div>
  );
}