import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import EditDomiciliationModal from "@/pages/EditDomiciliationModal";
import ConfirmValidateDialog2 from "@/components/common/ConfirmValidateDialog2";
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
import { Check, ChevronDown, Edit, Trash2, ArrowRight, ArrowLeft, Power, Plus, X, Save, Loader2, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { API_URL } from "@/config/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { TableSkeletonWizard } from "@/components/loaders/TableSkeletonWizard";
import BeneficiaireWizard from "@/pages/BeneficiaireWizard";
import { useToast } from "@/hooks/use-toast";

export default function PaiementWizard({ onSuccess, paiementData, onFinish }: { onSuccess?: () => void; paiementData?: any; onFinish?: () => void; }): JSX.Element {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [fonctions, setFonctions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [elements, setElements] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [dataReady, setDataReady] = useState(true); // true par défaut
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDetailsPaiement, setSelectedDetailsPaiement] = useState<any>(null);
  const [selectedRib, setSelectedRib] = useState<any | null>(null);
  const [openValidateDialog, setOpenValidateDialog] = useState(false);
  const [validateMessage, setValidateMessage] = useState("");
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [eltSens, setEltSens] = useState<number | null>(null);
  const [openWizard, setOpenWizard] = useState(false);
  const [selectedBenefCode, setSelectedBenefCode] = useState<string | null>(null);
  const { toast } = useToast();

  const [paiement, setPaiement] = useState({
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
  const [ribList, setRibList] = useState<any[]>([]);
  const [editableRib, setEditableRib] = useState<any | null>(null);
  const [ribModalOpen, setRibModalOpen] = useState(false);

  useEffect(() => {
    const loadPaiementData = async () => {
      // Mode édition uniquement
      if (paiementData) {
        setDataReady(false); // Active le chargement uniquement ici

        if (!listsLoaded) return;

        setPaiement({
          BEN_CODE: paiementData.BEN_CODE || "",
        });

        setPaieCode(paiementData.PAI_CODE);

        try {
          const token = localStorage.getItem("token");
          const headers = { Authorization: `Bearer ${token}` };
          const res = await axios.get(`${API_URL}/details-paiement/${paiementData.PAI_CODE}`, { headers });
          setDetailsPaiements(res.data);
        } catch (err: any) {
          toast({
            title: "Erreur",
            description:"Erreur lors du chargement des détails de paiement.",
            variant: "destructive",
          });
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
        const [b, l, t, f, g] = await Promise.all([
          axios.get(`${API_URL}/beneficiaires-rib`, { headers }),
          axios.get(`${API_URL}/elements-publics`, { headers }),
          axios.get(`${API_URL}/typeBeneficiaires-public`, { headers }),
          axios.get(`${API_URL}/fonctions-public`, { headers }),
          axios.get(`${API_URL}/grades-public`, { headers }),
        ]);
        setBeneficiaires(b.data);
        setElements(l.data);
        setTypes(t.data);
        setFonctions(f.data);
        setGrades(g.data);
        setRibList(b.data); 
        // Indiquer que les listes sont chargées pour permettre le remplissage en mode édition
        setListsLoaded(true);

        // Si mode édition
        if (paiementData) {
          setPaiement({
            BEN_CODE: paiementData.BEN_CODE || "",
          });
          setPaieCode(paiementData.PAI_CODE);

          const domRes = await axios.get(`${API_URL}/details-paiement/${paiementData.PAI_CODE}`, { headers });
          setDetailsPaiements(domRes.data);
        }
      } catch (err: any) {
        toast({
          title: "Erreur",
          description:"Erreur lors du chargement des données.",
          variant: "destructive",
        });
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
        .catch(() => toast({
          title: "Erreur",
          description: "Erreur lors du chargement des détails.",
          variant: "destructive",
        }));
    }
  }, [paieCode]);

  // Remplir les infos du bénéficiaire sélectionné (sexe / type / fonction / grade)
  useEffect(() => {
      if (!paiement.BEN_CODE) {
        setSelectedBenef(null);
        setSelectedRib(null);
        return;
      }

      // Trouver le bénéficiaire sélectionné
      const foundBenef = beneficiaires.find(
          (b) => String(b.BEN_CODE) === String(paiement.BEN_CODE)
      );

      // Prendre le premier RIB actif (DOM_STATUT = 2)
      const rib = foundBenef?.domiciliations?.find(d => d.DOM_STATUT) || null;

      setSelectedBenef(foundBenef || null);
      setSelectedRib(rib);
  }, [paiement.BEN_CODE, beneficiaires]);

  // Utilitaires d'affichage
  const getElementInfo = (code: string) => {
    const e = elements.find((ech) => String(ech.ELT_CODE).trim() === String(code).trim());
    return e ? `${e.ELT_LIBELLE || "_"}` : code;
  };

  // Enregistrement bénéficiaire (étape 1)
  const handleNext = async () => {
    if (!paiement.BEN_CODE) {
      toast({
        title: "Avertissement",
        description: "Veuillez choisir un bénéficiaire.",
        variant: "warning",
      });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (paiementData) {
        // Mode modification
        await axios.put(`${API_URL}/paiements/${paiementData.PAI_CODE}`, paiement, { headers });
        toast({
          title: "Succès",
          description: "Paiement mis à jour !",
          variant: "success",
        });
        window.dispatchEvent(new Event("totalUpdated"));
        setStep(2);
      } else {
        // Mode création
        const { data } = await axios.post(`${API_URL}/paiements`, paiement, { headers });
        toast({
          title: "Succès",
          description: "Paiement enregistré !",
          variant: "success",
        });
        window.dispatchEvent(new Event("totalUpdated"));
        setPaieCode(data.PAI_CODE);
        setStep(2);

        const res = await axios.get(`${API_URL}/details-paiement/${data.PAI_CODE}`, { headers });
        setDetailsPaiements(res.data);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l’enregistrement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Met à jour le paiement avant de passer à l'étape 2
  const handleNextWithUpdate = async () => {
    if (!paieCode) 
      return toast({
                title: "Erreur",
                description: "Aucun paiement sélectionné !",
                variant: "destructive",
              });
    if (!paiement.BEN_CODE) {
      toast({
        title: "Avertissement",
        description: "Veuillez choisir un bénéficiaire obligatoire.",
        variant: "warning",
      });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.put(`${API_URL}/paiements/${paieCode}`, paiement, { headers });
      toast({
        title: "Succès",
        description: "Paiement mis à jour !",
        variant: "success",
      });
      setStep(2);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la mise à jour.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  // Ajouter ou modifier un paiement
  const handleAddDetailsPaiement = async () => {
    if (!paieCode) 
      return toast({
                title: "Erreur",
                description: "Aucun paiement lié !",
                variant: "destructive",
              });
    if (!currentDetailsPaiements.ELT_CODE || !currentDetailsPaiements.PAI_MONTANT) {
      return toast({
                title: "Avertissement",
                description:"Veuillez remplir tous les champs.",
                variant: "warning",
              });      
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
      setEltSens(null);

      toast({
        title: "Succès",
        description: data.message || "Détails ajoutés !",
        variant: "success",
      });
      window.dispatchEvent(new Event("totalUpdated"));
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Erreur lors de l’ajout.",
        variant: "destructive",
      });
    }
  };

  // Modifier un détail de paiement
  const handleEdit = (d: any) => {
    if (!d || !d.ELT_CODE) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails sélectionnés.",
        variant: "destructive",
      });
      return;
    }

    setCurrentDetailsPaiements({
        DET_CODE: d.DET_CODE,
        ELT_CODE: d.ELT_CODE,
        PAI_MONTANT: d.PAI_MONTANT,
    });

    const elt = elements.find(
      (e) => String(e.ELT_CODE) === String(d.ELT_CODE)
    );

    setEltSens(elt ? Number(elt.ELT_SENS) : null);

    setIsEditing(true);
    setEditId(d.DET_CODE);
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

        toast({
          title: "Succès",
          description: "Détail de paiement supprimé !",
          variant: "success",
        });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Erreur lors de la suppression.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedDetailsPaiement(null);
    }
  };

  const handleUpdateDetailsPaiement = async () => {
    if (!editId) 
      return toast({
                title: "Erreur",
                description: "Aucun détail sélectionné !",
                variant: "destructive",
              });
    if (!currentDetailsPaiements.ELT_CODE || !currentDetailsPaiements.PAI_MONTANT) {
      return toast({
                title: "Avertissement",
                description: "Veuillez remplir tous les champs.",
                variant: "warning",
              });
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

      toast({
        title: "Succès",
        description: data.message || "Détails mis à jour !",
        variant: "success",
      });
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
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Erreur lors de la mise à jour.",
        variant: "destructive",
      });
    }
  };

  const handleFinish = () => {
    toast({
      title: "Succès",
      description: "Paiement finalisé avec succès !",
      variant: "success",
    });
    if (onFinish) onFinish();
  };

  const handleFinishValidation = async () => {
      if (!paieCode) {
        toast({
          title: "Erreur",
          description: "Paiement introuvable.",
          variant: "destructive",
        });
        return;
      }
  
      try {
        setLoadingValidation(true);
        const token = localStorage.getItem("token");
  
        const { data } = await axios.put(
          `${API_URL}/paiements/valider-terminer/${paieCode}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
  
        //  Le backend demande confirmation
        if (data?.requiresConfirmation) {
          setValidateMessage(data.message);
          setOpenValidateDialog(true);
          return;
        }
  
        //  Succès direct
        toast({
          title: "Succès",
          description: data.message,
          variant: "success",
        });
  
        //  on laisse ton handleFinish EXISTANT gérer la suite
        handleFinish();
  
      } catch (err: any) {
        toast({
          title: "Erreur",
          description: err?.response?.data?.message || "Erreur lors de la validation.",
          variant: "destructive",
        });
      } finally {
        setLoadingValidation(false);
      }
    };
  
    const handleConfirmFinishValidation = async () => {
      if (!paieCode) return;
  
      try {
        setLoadingValidation(true);
        const token = localStorage.getItem("token");
  
        const { data } = await axios.put(
          `${API_URL}/paiements/valider-terminer/${paieCode}`,
          { confirm: true },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
  
        toast({
          title: "Succès",
          description: data.message,
          variant: "success",
        });
  
        setOpenValidateDialog(false);
  
        //  on appelle ton handleFinish existant
        handleFinish();
  
      } catch (err: any) {
        toast({
          title: "Erreur",
          description: err?.response?.data?.message || "Erreur lors de la confirmation.",
          variant: "destructive",
        });
      } finally {
        setLoadingValidation(false);
      }
    };

  // ComboBox réutilisable
  const ComboBox = ({ label, items, value, onSelect, display, disabled = false }: any) => {
    const [open, setOpen] = useState(false);
    const selected = items.find(
      (i: any) =>
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
                          item.BEN_CODE ||
                          item.ELT_CODE
                        }
                        onSelect={() => {
                          onSelect(
                            item.ELT_CODE ??
                            item.BEN_CODE
                          );
                          setTimeout(() => setOpen(false), 100);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${value ===
                            (
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

  if (!dataReady && paiementData) {
    return <TableSkeletonWizard />;
  }

  function Skeleton({ height = 12 }: { height?: number }) {
    return <div className={`h-${height} w-full bg-gray-200 animate-pulse rounded-md`}></div>;
  }

  return (
    // Structure principale moderne et responsive
    <div className="w-full max-w-4xl lg:max-w-6xl mx-auto p-0 sm:p-8 bg-white rounded-xl shadow-lg ring-1 ring-gray-100">
      {/* Wrapper full-height on mobile so header/footer can be sticky */}
      <div className="flex flex-col h-screen md:h-auto">
        <div className="p-1 sm:p-1">
          {/* Titre principal */}
          <div className="text-center mb-3">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide">
              {paiementData
                ? "MODIFICATION D'UN PAIEMENT D’UN BÉNÉFICIAIRE"
                : "MISE EN PAIEMENT D’UN BÉNÉFICIAIRE"}
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {paiementData
                ? "Mise à jour des informations du paiement d'un bénéficiaire"
                : "Saisie et enregistrement d’un nouveau paiement d'un bénéficiaire"}
            </p>
          </div>

          {/* Entête dynamique */}
          <div className="relative mb-1 md:mb-2 sticky top-0 bg-white z-30 py-1">
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
        <div className="flex-1 overflow-auto px-1 sm:px-2 pb-1">

          {/* Étape 1 */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Top: selectors (Bénéficiaire) */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listsLoaded ? (
                    <ComboBox
                      label="Bénéficiaire *"
                      items={beneficiaires}
                      value={paiement.BEN_CODE}
                      onSelect={(v: any) => setPaiement({ ...paiement, BEN_CODE: v })}
                      display={(t: any) => `${t.BEN_NOM} ${t.BEN_PRENOM || " "}`}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-12 w-full space-x-2">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                      <span className="text-gray-500 font-medium">Veuillez patienter...</span>
                    </div>
                  )}
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
                        className="bg-gray-100 font-bold text-black h-9"
                      />
                    </div>

                    <div>
                      <Label>Type</Label>
                      <Input
                        value={selectedBenef ? (types.find(t => t.TYP_CODE === selectedBenef.TYP_CODE)?.TYP_LIBELLE || selectedBenef.TYP_CODE || '') : ''}
                        readOnly
                        disabled
                        className="bg-gray-100 font-bold text-black h-9"
                      />
                    </div>

                    <div>
                      <Label>Fonction</Label>
                      <Input
                        value={selectedBenef ? (fonctions.find(f => f.FON_CODE === selectedBenef.FON_CODE)?.FON_LIBELLE || selectedBenef.FON_CODE || '') : ''}
                        readOnly
                        disabled
                        className="bg-gray-100 font-bold text-black h-9"
                      />
                    </div>

                    <div>
                      <Label>Grade</Label>
                      <Input
                        value={selectedBenef ? (grades.find(g => g.GRD_CODE === selectedBenef.GRD_CODE)?.GRD_LIBELLE || selectedBenef.GRD_CODE || '') : ''}
                        readOnly
                        disabled
                        className="bg-gray-100 font-bold text-black h-9"
                      />
                    </div>
                  </div>
                    {selectedBenef && (
                      <div className="mt-4 rounded-lg border bg-gray-50 p-4">
                        <div className="flex flex-wrap items-start justify-start gap-10 text-sm">

                          {/* Banque */}
                          <div className="flex flex-col items-start min-w-[100px]">
                            <span className="font-semibold text-gray-500">Banque</span>
                            <span className="mt-2 font-medium">
                              {selectedRib?.BNQ_LIBELLE || "_"}
                            </span>
                          </div>

                          {/* Guichet */}
                          <div className="flex flex-col items-start min-w-[100px]">
                            <span className="font-semibold text-gray-500">Guichet</span>
                            <span className="mt-2 font-medium">
                              {selectedRib?.GUI_CODE || "_"}
                            </span>
                          </div>

                          {/* N° Compte */}
                          <div className="flex flex-col items-start min-w-[120px]">
                            <span className="font-semibold text-gray-500">N° Compte</span>
                            <span className="mt-2 font-medium">
                              {selectedRib?.DOM_NUMCPT || "_"}
                            </span>
                          </div>

                          {/* Clé RIB */}
                          <div className="flex flex-col items-start min-w-[80px]">
                            <span className="font-semibold text-gray-500">Clé RIB</span>
                            <span className="mt-2 font-medium">
                              {selectedRib?.DOM_RIB || "_"}
                            </span>
                          </div>

                          {/* Bouton ajouter / modifier RIB (TOUJOURS visible) */}
                          <div className="ml-auto mt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="
                                rounded-full
                                text-blue-600
                                hover:bg-blue-100 hover:text-blue-700
                                transition
                              "
                              onClick={() => {
                                setSelectedBenefCode(selectedBenef.BEN_CODE);
                                setOpenWizard(true);
                              }}
                              title={selectedRib ? "Modifier le RIB" : "Ajouter un RIB"}
                            >
                              <PlusCircle className="w-5 h-5" />
                            </Button>
                          </div>

                        </div>

                        {/* Message informatif si aucun RIB */}
                        {!selectedRib && (
                          <div className="mt-3 text-xs text-orange-600 italic">
                            Aucun RIB enregistré pour ce bénéficiaire.
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {/* Buttons placed at the bottom of the block */}
                <div className="mt-6 flex justify-end">
                  {paiementData ? (
                    <Button 
                        onClick={handleNextWithUpdate}
                        disabled={!dataReady || loading} 
                        className="px-4"
                    >
                        {loading ? "Mise à jour..." : (
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
                  onSelect={(v: any) => {
                    const selectedElt = elements.find(
                      (e) => String(e.ELT_CODE) === String(v)
                    );

                    setCurrentDetailsPaiements({
                      ...currentDetailsPaiements,
                      ELT_CODE: v,
                    });

                    setEltSens(selectedElt ? Number(selectedElt.ELT_SENS) : null);
                  }}
                  display={(b: any) => `${b.ELT_LIBELLE}`}
                />

                <div>
                  <Label>Montant en F CFA</Label>
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
                    placeholder="Veuillez saisir le montant"
                    className="h-10 w-full"
                  />
                </div>

                {eltSens !== null && (
                  <div className="mt-1">
                    {eltSens === 1 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        + Gain
                      </span>
                    )}

                    {eltSens === 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        − Retenue
                      </span>
                    )}
                  </div>
                )}

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
                          setEltSens(null);
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
                          <th className="px-3 py-2 text-left">Montant en F CFA</th>
                          <th className="px-3 py-2 text-left">Sens</th>
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
                                <td className="px-3 py-2 align-top">
                                  {d.ELT_SENS === 1 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                      + Gain
                                    </span>
                                  )}

                                  {d.ELT_SENS === 2 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                      − Retenue
                                    </span>
                                  )}
                                </td>
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
                  onClick={handleFinishValidation}
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

        <ConfirmValidateDialog2
          open={openValidateDialog}
          onClose={() => setOpenValidateDialog(false)}
          onConfirm={handleConfirmFinishValidation}
          itemName={validateMessage}
        />

        {/* {openWizard && (
          <BeneficiaireWizard
            startStep={2}
            forcedBenefCode={selectedBenefCode}
            onFinish={() => setOpenWizard(false)}
          />
        )} */}

      </div>
    </div>
  );
}