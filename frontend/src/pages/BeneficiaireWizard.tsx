import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import ConfirmValidateDialog from "@/components/common/ConfirmValidateDialog";
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
import { Check, ChevronDown, Edit, Trash2, ArrowRight, ArrowLeft, Power, Plus, X, Save, Send, Paperclip, Download, FileUp, FileDown, Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { API_URL } from "@/config/api";
import { TableSkeletonWizard } from "@/components/loaders/TableSkeletonWizard";
import { useToast } from "@/hooks/use-toast";
import { Item } from "@radix-ui/react-dropdown-menu";

export default function BeneficiaireWizard({ 
    onSuccess,
    beneficiaireData,
    onFinish,
    startStep = 1,
    forcedBenefCode,
  }: {
    onSuccess?: () => void;
    beneficiaireData?: any;
    onFinish?: () => void;
    startStep?: number;
    forcedBenefCode?: string;
  })
{
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [types, setTypes] = useState<any[]>([]);
  const [fonctions, setFonctions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [banques, setBanques] = useState<any[]>([]);
  const [guichets, setGuichets] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [dataReady, setDataReady] = useState(true); // true par défaut
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDomiciliation, setSelectedDomiciliation] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [ribFile, setRibFile] = useState<File | null>(null);
  const [ribFileError, setRibFileError] = useState(false);
  const [selectedRowsForStatus, setSelectedRowsForStatus] = useState<any[]>([]);
  const [isValidateStatusDialogOpen, setIsValidateStatusDialogOpen] = useState(false);
  const [openValidateDialog, setOpenValidateDialog] = useState(false);
  const [validateMessage, setValidateMessage] = useState("");
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [numCompteLength, setNumCompteLength] = useState(0);
  const [loadingDomiciliation, setLoadingDomiciliation] = useState(false);
  const { toast } = useToast();

  const [beneficiaire, setBeneficiaire] = useState({
    BEN_MATRICULE: "",
    BEN_NOM: "",
    BEN_PRENOM: "",
    BEN_SEXE: "",
    BEN_DATE_NAISSANCE: "",
    TYP_CODE: "",
    FON_CODE: "",
    GRD_CODE: "",
    POS_CODE: "",
  });

  const [domiciliations, setDomiciliations] = useState<any[]>([]);
  const [currentDomiciliation, setCurrentDomiciliation] = useState({
    DOM_CODE: "",
    DOM_NUMCPT: "",
    BNQ_CODE: "",
    GUI_ID: "",
    DOM_RIB: "",
    DOM_FICHIER: null,
  });

  const today = new Date().toISOString().split("T")[0];

  const [benefCode, setBenefCode] = useState<string | null>(null);

  const toggleRowSelection = (row: any) => {
    setSelectedRows((prev) =>
      prev.some(r => r.DOM_CODE === row.DOM_CODE) ? [] : [row]
    );
  };

  const isSelected = (row: any) => selectedRows.some(r => r.DOM_CODE === row.DOM_CODE);

  useEffect(() => {
    if (startStep === 2 && forcedBenefCode) {
      setStep(2);
      setBenefCode(forcedBenefCode);
    }
  }, [startStep, forcedBenefCode]);

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
          BEN_DATE_NAISSANCE: beneficiaireData.BEN_DATE_NAISSANCE || "",
          TYP_CODE: beneficiaireData.TYP_CODE || "",
          FON_CODE: beneficiaireData.FON_CODE || "",
          GRD_CODE: beneficiaireData.GRD_CODE || "",
          POS_CODE: beneficiaireData.POS_CODE || "",
        });

        setBenefCode(beneficiaireData.BEN_CODE);

        try {
          const token = localStorage.getItem("token");
          const headers = { Authorization: `Bearer ${token}` };
          const res = await axios.get(`${API_URL}/domiciliations/${beneficiaireData.BEN_CODE}`, { headers });
          setDomiciliations(res.data);
        } catch (err: any) {
          toast({
            title: "Erreur",
            description:"Erreur lors du chargement des domiciliations",
            variant: "destructive",
          });
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
        const [t, f, g, p, b, q] = await Promise.all([
          axios.get(`${API_URL}/typeBeneficiaires-public`, { headers }),
          axios.get(`${API_URL}/fonctions-public`, { headers }),
          axios.get(`${API_URL}/grades-public`, { headers }),
          axios.get(`${API_URL}/positions-publiques`, { headers }),
          axios.get(`${API_URL}/banques-public`, { headers }),
          axios.get(`${API_URL}/guichets-public`, { headers }),
        ]);
        setTypes(t.data);
        setFonctions(f.data);
        setGrades(g.data);
        setPositions(p.data);
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
            BEN_DATE_NAISSANCE: beneficiaireData.BEN_DATE_NAISSANCE || "",
            TYP_CODE: beneficiaireData.TYP_CODE || "",
            FON_CODE: beneficiaireData.FON_CODE || "",
            GRD_CODE: beneficiaireData.GRD_CODE || "",
            POS_CODE: beneficiaireData.POS_CODE || "",
          });
          setBenefCode(beneficiaireData.BEN_CODE);

          const domRes = await axios.get(`${API_URL}/domiciliations/${beneficiaireData.BEN_CODE}`, { headers });
          setDomiciliations(domRes.data);
        }
      } catch (err: any) {
        toast({
          title: "Erreur",
          description:"Erreur lors du chargement des données",
          variant: "destructive",
        });
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
        .catch(() => toast({
          title: "Erreur",
          description: "Erreur lors du chargement des domiciliations.",
          variant: "destructive",
        }));
    }
  }, [benefCode]);

  // Utilitaires d'affichage
  const getBanqueInfo = (code: string) => {
    const b = banques.find((bnq) => String(bnq.BNQ_CODE).trim() === String(code).trim());
    return b ? `${b.BNQ_LIBELLE || "—"}` : code;
  };

  const getGuichetInfo = (id: string) => {
    const g = guichets.find((gui) => String(gui.GUI_ID).trim() === String(id).trim());
    return g ? `${g.GUI_CODE} - ${g.GUI_NOM || "—"}` : id;
  };

  const calculerCleRib = (BNQ_CODE: string, GUI_ID: string, DOM_NUMCPT: string) => {
    const banque = banques.find(b => String(b.BNQ_CODE).trim() === String(BNQ_CODE).trim());
    const guichet = guichets.find(g => String(g.GUI_ID).trim() === String(GUI_ID).trim());
    if (!banque || !guichet || !DOM_NUMCPT) return "";

    const codeBanque = String(banque.BNQ_CODE || "00000").padStart(5, "0");
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
    if (!beneficiaire.BEN_NOM || !beneficiaire.BEN_PRENOM || !beneficiaire.BEN_SEXE || !beneficiaire.BEN_DATE_NAISSANCE || !beneficiaire.TYP_CODE || !beneficiaire.POS_CODE) {
      toast({
          title: "Avertissement",
          description: "Veuillez remplir tous les champs obligatoires.",
          variant: "warning",
        });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (beneficiaireData) {
        // Mode modification
        await axios.put(`${API_URL}/beneficiaires/${beneficiaireData.BEN_CODE}`, beneficiaire, { headers });
        toast({
          title: "Succès",
          description: "Bénéficiaire mis à jour !",
          variant: "success",
        });
        setStep(2);
      } else {
        // Mode création
        const { data } = await axios.post(`${API_URL}/beneficiaires`, beneficiaire, { headers });
        toast({
          title: "Succès",
          description: "Bénéficiaire enregistré !",
          variant: "success",
        });
        setBenefCode(data.BEN_CODE);
        setStep(2);

        const res = await axios.get(`${API_URL}/domiciliations/${data.BEN_CODE}`, { headers });
        setDomiciliations(res.data);
      }
    } catch (err: any) {
        toast({
          title: "Erreur",
          description: err?.response?.data?.message || "Erreur lors de l'enregistrement",
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  // Met à jour le bénéficiaire avant de passer à l'étape 2
  const handleNextWithUpdate = async () => {
    if (!benefCode) 
      return toast({
          title: "Erreur",
          description: "Aucun bénéficiaire sélectionné.",
          variant: "destructive",
        });
    if (!beneficiaire.BEN_NOM || !beneficiaire.BEN_PRENOM || !beneficiaire.TYP_CODE || !beneficiaire.POS_CODE) {
      toast({
          title: "Avertissement",
          description: "Veuillez remplir tous les champs obligatoires.",
          variant: "warning",
        });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.put(`${API_URL}/beneficiaires/${benefCode}`, beneficiaire, { headers });
      toast({
          title: "Succès",
          description: "Bénéficiaire mis à jour !",
          variant: "success",
        });
      setStep(2);
    } catch (error: any) {
        toast({
          title: "Erreur",
          description: "Erreur lors de la mise à jour",
          variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  // Ajouter ou modifier une domiciliation
  const handleAddDomiciliation = async () => {
    if (!benefCode) 
      return toast({
        title: "Erreur",
        description: "Aucun bénéficiaire lié",
        variant: "destructive",
      });

    if (!currentDomiciliation.BNQ_CODE || !currentDomiciliation.GUI_ID) {
      return toast({
        title: "Avertissement",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "warning",
      });
    }

    const ribKey = calculerCleRib(
      currentDomiciliation.BNQ_CODE,
      currentDomiciliation.GUI_ID,
      currentDomiciliation.DOM_NUMCPT
    );

    try {
      setLoadingDomiciliation(true)
      const token = localStorage.getItem("token");

      // Utilisation de FormData pour inclure le fichier
      const formData = new FormData();
      Object.entries(currentDomiciliation).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      formData.append("BEN_CODE", benefCode);
      formData.append("DOM_RIB", ribKey);

      const { data } = await axios.post(`${API_URL}/domiciliations`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Rafraîchir la liste
      const list = await axios.get(`${API_URL}/domiciliations/${benefCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDomiciliations(list.data);

      // Réinitialiser le formulaire
      setCurrentDomiciliation({
        DOM_CODE: "",
        DOM_NUMCPT: "",
        BNQ_CODE: "",
        GUI_ID: "",
        DOM_RIB: "",
        DOM_FICHIER: null, // penser à réinitialiser le fichier
      });

      toast({
        title: "Succès",
        description: "Domiciliation ajoutée",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Erreur lors de l'ajout.",
        variant: "destructive",
      });
    } finally {
      setLoadingDomiciliation(false)
    }
  };

  // Modifier une domiciliation
  const handleEdit = (d: any) => {
    setIsEditing(true);
    setEditId(d.DOM_CODE);
    
    // Charger toutes les infos dans le formulaire
    setCurrentDomiciliation({
      DOM_CODE: d.DOM_CODE,
      DOM_NUMCPT: d.DOM_NUMCPT,
      BNQ_CODE: d.BNQ_CODE,
      GUI_ID: d.GUI_ID,
      DOM_RIB: d.DOM_RIB,
      // Charger le fichier si existant
      DOM_FICHIER: d.DOM_FICHIER || null,
    });

    // Mettre à jour l’état local pour l’input file
    setRibFile(d.DOM_FICHIER || null);
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

      toast({
        title: "Succès",
        description: "Domiciliation supprimée avec succès !",
        variant: "success",
      });
    } catch (err: any) {
        toast({
          title: "Erreur",
          description: err?.response?.data?.message || "Erreur lors de suppression.",
          variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedDomiciliation(null);
    }
  };

  const handleUpdateDomiciliation = async () => {
    if (!editId) 
      return toast({
        title: "Erreur",
        description: "Aucune domiciliation sélectionnée.",
        variant: "destructive",
      });

    if (!currentDomiciliation.BNQ_CODE || !currentDomiciliation.GUI_ID) {
      return toast({
        title: "Avertissement",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "warning",
      });
    }

    try {
      setLoadingDomiciliation(true)

      const token = localStorage.getItem("token");

      // FormData pour gérer le fichier
      const formData = new FormData();
      formData.append("BNQ_CODE", currentDomiciliation.BNQ_CODE);
      formData.append("GUI_ID", currentDomiciliation.GUI_ID);
      formData.append("DOM_NUMCPT", currentDomiciliation.DOM_NUMCPT || "");
      if (currentDomiciliation.DOM_FICHIER instanceof File) {
        formData.append("DOM_FICHIER", currentDomiciliation.DOM_FICHIER);
      }
      // Astuce pour PUT avec FormData
      formData.append("_method", "PUT");

      const { data } = await axios.post(
        `${API_URL}/domiciliations/${editId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast({
        title: "Succès",
        description: "Domiciliation mise à jour !",
        variant: "success",
      });
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
        DOM_FICHIER: null,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Erreur lors de la mise à jour.",
        variant: "destructive",
      });
    } finally {
      setLoadingDomiciliation(false)
    }
  };

  const handlePreviewRib = async (DOM_CODE: string) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/rib/preview/${DOM_CODE}`, {
        responseType: "blob", // important pour récupérer le fichier
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Détecte automatiquement le type de fichier
      const contentType = response.headers["content-type"];
      const file = new Blob([response.data], { type: contentType });

      const fileURL = window.URL.createObjectURL(file);

      // Ouvre dans un nouvel onglet
      window.open(fileURL, "_blank");

      // Optionnel : libère l'objet après ouverture
      setTimeout(() => window.URL.revokeObjectURL(fileURL), 1000);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible d’ouvrir le fichier",
        variant: "destructive",
      });
    }
  };   

  const handleDownloadRib = async (domCode: string) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/domiciliations/${domCode}/telecharger-rib`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      //  Récupérer le nom depuis Content-Disposition
      const contentDisposition = response.headers["content-disposition"];
      let filename = "RIB";

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename; // vrai nom du fichier
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };

  const handleFinish = () => {
    toast({
      title: "Succès",
      description: "Bénéficiaire et domiciliations enregistrés !",
      variant: "success",
    });
    if (onFinish) onFinish();
    if (onSuccess) onSuccess();
  };

  const handleConfirmValidateStatus = async () => {
    if (!selectedRowsForStatus || selectedRowsForStatus.length === 0) return;

    try {
      const token = localStorage.getItem("token");
      const id = selectedRowsForStatus[0].DOM_CODE; // seule ligne
      const { data } = await axios.put(`${API_URL}/domiciliations/valider/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      toast({
        title: "Succès",
        description: "Transmission du RIB à l'approbation effectuée avec succès.",
        variant: "success",
      });

       // Rafraîchir la liste
      const list = await axios.get(`${API_URL}/domiciliations/${benefCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDomiciliations(list.data);

    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Erreur lors de la transmission.",
        variant: "destructive",
      });
    } finally {
      setIsValidateStatusDialogOpen(false);
      setSelectedRowsForStatus([]);
    }
  };

  const handleStatusUpdate = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun RIB sélectionné !",
        variant: "destructive",
      });
      return;
    }

    // On prend seulement la première ligne
    setSelectedRowsForStatus([rows[0]]);
    setIsValidateStatusDialogOpen(true);
  };

  const handleFinishValidation = async () => {
    if (!benefCode) {
      toast({
        title: "Erreur",
        description: "Bénéficiaire introuvable.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingValidation(true);
      const token = localStorage.getItem("token");

      const { data } = await axios.put(
        `${API_URL}/beneficiaires/valider-domicilier/${benefCode}`,
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
    if (!benefCode) return;

    try {
      setLoadingValidation(true);
      const token = localStorage.getItem("token");

      const { data } = await axios.put(
        `${API_URL}/beneficiaires/valider-domicilier/${benefCode}`,
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
        i.TYP_CODE === value ||
        i.FON_CODE === value ||
        i.GRD_CODE === value ||
        i.POS_CODE === value ||
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
                          item.POS_CODE ||
                          item.BNQ_CODE ||
                          item.GUI_ID
                        }
                        onSelect={() => {
                          onSelect(
                            item.GUI_ID ??
                            item.BNQ_CODE ??
                            item.TYP_CODE ??
                            item.FON_CODE ??
                            item.GRD_CODE ??
                            item.POS_CODE
                          );
                          setTimeout(() => setOpen(false), 100);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${value ===
                            (item.TYP_CODE ||
                              item.FON_CODE ||
                              item.GRD_CODE ||
                              item.POS_CODE ||
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

  const banqueSelectionnee = banques.find(
    (b) => String(b.BNQ_CODE).trim() === String(currentDomiciliation.BNQ_CODE).trim()
  );

  const isBanquePrimaire = banqueSelectionnee
    ? banquesPrimaires.includes(String(banqueSelectionnee.BNQ_CODE))
    : false;

  if (!dataReady && beneficiaireData) {
    return <TableSkeletonWizard />;
  }

  return (
    // Structure principale moderne et responsive
    <div className="w-full max-w-4xl lg:max-w-6xl mx-auto p-0 sm:p-8 bg-gray-100 rounded-xl shadow-lg ring-1 ring-gray-100">
      {/* Wrapper full-height on mobile so header/footer can be sticky */}
      <div className="flex flex-col h-screen md:h-auto">
        <div className="p-1 sm:p-1">
          {/* Titre principal */}
          <div className="text-center mb-3">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide">
              {beneficiaireData
                ? "MODIFICATION D'UN BÉNÉFICIAIRE"
                : "ENRÔLEMENT D'UN BÉNÉFICIAIRE"}
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {beneficiaireData
                ? "Mise à jour des informations du bénéficiaire"
                : "Saisie et enregistrement d’un nouveau bénéficiaire"}
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
              <div className="flex flex-col gap-4 md:gap-5">
                {/* Matricule, nom et prénom en haut, pleine largeur sur mobile, 1/3 sur desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {/* Matricule */}
                  <div>
                    <Label>Matricule solde</Label>
                    <Input
                      value={beneficiaire.BEN_MATRICULE}
                      onChange={(e) =>
                        setBeneficiaire({ ...beneficiaire, BEN_MATRICULE: e.target.value.toUpperCase() })
                      }
                      className="h-9 text-sm text-gray-900 caret-blue-600 w-full bg-white"
                    />
                  </div>

                  {/* Nom */}
                  <div>
                    <Label>Nom <span className="text-red-500">*</span></Label>
                    <Input
                      value={beneficiaire.BEN_NOM}
                      onChange={(e) =>
                        setBeneficiaire({ ...beneficiaire, BEN_NOM: e.target.value.toUpperCase() })
                      }
                      className="h-9 text-sm uppercase text-gray-900 caret-blue-600 w-full bg-white"
                    />
                  </div>

                  {/* Prénom */}
                  <div>
                    <Label>Prénom <span className="text-red-500">*</span></Label>
                    <Input
                      value={beneficiaire.BEN_PRENOM}
                      onChange={(e) =>
                        setBeneficiaire({ ...beneficiaire, BEN_PRENOM: e.target.value.toUpperCase() })
                      }
                      className="h-9 text-sm uppercase text-gray-900 caret-blue-600 w-full bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {/* Sexe */}
                  <div>
                    <Label>Sexe <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-2 mt-1">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="sexe"
                          value="M"
                          checked={beneficiaire.BEN_SEXE === "M"}
                          onChange={(e) =>
                            setBeneficiaire({ ...beneficiaire, BEN_SEXE: e.target.value })
                          }
                          className="accent-blue-600 w-4 h-4"
                        />
                        Masculin
                      </label>

                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="sexe"
                          value="F"
                          checked={beneficiaire.BEN_SEXE === "F"}
                          onChange={(e) =>
                            setBeneficiaire({ ...beneficiaire, BEN_SEXE: e.target.value })
                          }
                          className="accent-pink-500 w-4 h-4"
                        />
                        Féminin
                      </label>
                    </div>
                  </div>

                  {/* Date de naissance */}
                  <div>
                    <Label>Date de naissance <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      max={today}
                      value={beneficiaire.BEN_DATE_NAISSANCE}
                      onChange={(e) =>
                        setBeneficiaire({ ...beneficiaire, BEN_DATE_NAISSANCE: e.target.value })
                      }
                      className="h-9 text-sm text-gray-900 w-full bg-white"
                    />
                  </div>

                  {/* Type de bénéficiaire */}
                  <ComboBox
                    label="Type de bénéficiaire *"
                    items={types}
                    value={beneficiaire.TYP_CODE}
                    onSelect={(v: any) => setBeneficiaire({ ...beneficiaire, TYP_CODE: v })}
                    display={(t: any) => t.TYP_LIBELLE}
                  />

                  {/* Fonction */}
                  <ComboBox
                    label="Fonction"
                    items={fonctions}
                    value={beneficiaire.FON_CODE}
                    onSelect={(v: any) => setBeneficiaire({ ...beneficiaire, FON_CODE: v })}
                    display={(f: any) => f.FON_LIBELLE}
                  />

                  {/* Grade */}
                  <ComboBox
                    label="Grade"
                    items={grades}
                    value={beneficiaire.GRD_CODE}
                    onSelect={(v: any) => setBeneficiaire({ ...beneficiaire, GRD_CODE: v })}
                    display={(g: any) => g.GRD_LIBELLE}
                  />

                  {/* Position */}
                  <ComboBox
                    label="Position *"
                    items={positions}
                    value={beneficiaire.POS_CODE}
                    onSelect={(v: any) => setBeneficiaire({ ...beneficiaire, POS_CODE: v })}
                    display={(p: any) => p.POS_LIBELLE}
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
                  display={(b: any) => `${b.BNQ_LIBELLE}`}
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

                      // Si banque primaire, garder que les chiffres et max 11
                      if (isBanquePrimaire) {
                        num = num.replace(/\D/g, "").slice(0, 11);
                      }

                      // Calcul de la clé RIB
                      const rib = calculerCleRib(currentDomiciliation.BNQ_CODE, currentDomiciliation.GUI_ID, num);

                      // Met à jour l'état du formulaire
                      setCurrentDomiciliation({ ...currentDomiciliation, DOM_NUMCPT: num, DOM_RIB: rib });

                      // Met à jour le compteur
                      setNumCompteLength(num.length);
                    }}
                    placeholder={isBanquePrimaire ? "11 chiffres uniquement" : ""}
                    className="h-9 w-full"
                  />
                  <div className="text-right text-xs text-blue-600 mt-1">
                    {currentDomiciliation.DOM_NUMCPT.length}
                  </div>
                </div>

                {/* Clé RIB et actions */}
                <div className="md:col-span-3 mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Clé RIB :</span>
                      <span className="font-semibold text-blue-600">
                        {currentDomiciliation.DOM_RIB || "—"}
                      </span>
                    </div>

                    {/* Upload fichier RIB */}
                    <label className="flex items-center gap-2 px-2 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-md cursor-pointer max-w-[220px]">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setCurrentDomiciliation((prev) => ({ ...prev, DOM_FICHIER: file }));
                          setRibFile(file);
                          setRibFileError(!file);
                        }}
                      />

                      <Upload className="w-4 h-4 text-gray-600 shrink-0" />

                      <span
                        title={
                          currentDomiciliation.DOM_FICHIER instanceof File
                            ? currentDomiciliation.DOM_FICHIER.name
                            : currentDomiciliation.DOM_FICHIER
                              ? currentDomiciliation.DOM_FICHIER.split("/").pop()
                              : ""
                        }
                        className={`text-xs truncate whitespace-nowrap overflow-hidden max-w-[150px]
                          ${currentDomiciliation.DOM_FICHIER ? "text-gray-700" : "text-gray-500"}
                        `}
                      >
                        {currentDomiciliation.DOM_FICHIER instanceof File
                          ? currentDomiciliation.DOM_FICHIER.name
                          : currentDomiciliation.DOM_FICHIER
                            ? currentDomiciliation.DOM_FICHIER.split("/").pop()
                            : "Joindre le fichier du RIB *"}
                      </span>
                    </label>

                    {/* Télécharger le fichier existant */}
                    {currentDomiciliation.DOM_FICHIER && !(currentDomiciliation.DOM_FICHIER instanceof File) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreviewRib(currentDomiciliation.DOM_CODE)}
                        title="Télécharger le fichier"
                      >
                        <FileDown className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                  </div>

                  <div className="flex-1" />

                  <div className="w-full sm:w-auto flex gap-2">
                    {selectedRows.length > 0 && (
                      <div className="flex justify-end mb-4">
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleStatusUpdate([selectedRows[0]])}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Soumettre
                        </Button>
                      </div>
                    )}

                    <Button
                      onClick={isEditing ? handleUpdateDomiciliation : handleAddDomiciliation}
                      disabled={
                        loadingDomiciliation ||
                        !currentDomiciliation.BNQ_CODE ||
                        (isBanquePrimaire && currentDomiciliation.DOM_NUMCPT.length < 11)
                      }
                      className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2
                        ${
                          !currentDomiciliation.BNQ_CODE ||
                          (isBanquePrimaire && currentDomiciliation.DOM_NUMCPT.length < 11)
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : isEditing
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }
                      `}
                    >
                      {loadingDomiciliation ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isEditing ? "Mise à jour..." : "Ajout..."}
                        </>
                      ) : isEditing ? (
                        <>
                          <Save className="w-4 h-4" />
                          Mettre à jour
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
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
                            DOM_FICHIER: null,
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
              {!dataReady ? (
                <TableSkeletonWizard />
              ) : (
                <div className="flex flex-col gap-2 md:hidden mb-3">
                  {domiciliations.length === 0 ? (
                    <div className="p-4 bg-gray-50 rounded-md text-center text-gray-500">
                      Aucune domiciliation ajoutée.
                    </div>
                  ) : (
                    domiciliations.map((d, i) => {
                      // Gestion des couleurs de statut comme desktop
                      let bgColor = "";
                      let textColor = "";
                      let label = "";
                      switch (d.DOM_STATUT) {
                        case 0:
                          bgColor = "bg-red-100";
                          textColor = "text-red-700";
                          label = "Rejeté";
                          break;
                        case 1:
                          bgColor = "bg-gray-100";
                          textColor = "text-gray-600";
                          label = "Non approuvé";
                          break;
                        case 2:
                          bgColor = "bg-orange-100";
                          textColor = "text-orange-700";
                          label = "En cours d'approbation...";
                          break;
                        case 3:
                          bgColor = "bg-green-100";
                          textColor = "text-green-700";
                          label = "Approuvé";
                          break;
                        default:
                          bgColor = "bg-gray-100";
                          textColor = "text-gray-600";
                          label = "Inconnu";
                      }

                      return (
                        <div
                          key={i}
                          className={`p-2 bg-white rounded-lg shadow-sm border flex flex-col gap-2 relative`}
                        >
                          {/* Checkbox mobile */}
                          <input
                            type="checkbox"
                            className="absolute top-2 left-2 w-4 h-4"
                            checked={isSelected(d)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleRowSelection(d)}
                          />

                          <div className="flex justify-between items-start ml-6">
                            <div>
                              <div className="text-xs text-gray-500">Banque :</div>
                              <div className="text-sm font-medium">{getBanqueInfo(d.BNQ_CODE)}</div>
                            </div>
                            <div className="text-xs">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${bgColor} ${textColor}`}>
                                {label}
                              </span>
                            </div>
                          </div>

                          <div className="items-center ml-6">
                            <div className="text-xs text-gray-500">Guichet :</div>
                            <div className="text-sm font-medium">{getGuichetInfo(d.GUI_ID)}</div>
                          </div>

                          <div className="flex justify-between items-center ml-6">
                            <div>
                              <div className="text-xs text-gray-500">N° Compte :</div>
                              <div className="font-medium">{d.DOM_NUMCPT}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Clé RIB :</div>
                              <div className="text-blue-600 font-medium">{d.DOM_RIB || "—"}</div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1 ml-6">
                            {d.DOM_FICHIER && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewRib(d.DOM_CODE);
                                }}
                                title="Afficher le fichier"
                              >
                                <FileDown className="w-4 h-4 text-green-500" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(d)}
                              title="Modifier le RIB"
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDomiciliation(d);
                                setIsDeleteDialogOpen(true);
                              }}
                              title="Supprimer le RIB"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tableau desktop */}
              {!dataReady ? (
                <TableSkeletonWizard />
              ) : (
                <div className="hidden md:block rounded-xl border bg-white overflow-auto max-h-[360px] shadow-sm">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-center">Choix</th>
                        <th className="px-3 py-2 text-center">Banque</th>
                        <th className="px-3 py-2 text-center">Guichet</th>
                        <th className="px-3 py-2 text-center">N° Compte</th>
                        <th className="px-3 py-2 text-center">Clé RIB</th>
                        <th className="px-3 py-2 text-center">Statut</th>
                        <th className="px-3 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {domiciliations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-gray-500 py-4">Aucune domiciliation ajoutée.</td>
                        </tr>
                      ) : (
                        domiciliations.map((d, i) => (
                          <tr
                            key={i}
                            onClick={() => toggleRowSelection(d)}
                            className={`hover:bg-gray-50 transition-colors cursor-pointer
                              ${isSelected(d) ? "bg-green-50" : ""}
                            `}
                          >
                            <td className="px-3 py-2 text-center align-top">
                              <input
                                type="checkbox"
                                checked={isSelected(d)}
                                onClick={(e) => e.stopPropagation()} // pour éviter que le clic déclenche la ligne entière
                                onChange={() => toggleRowSelection(d)}
                              />
                            </td>
                            <td className="px-3 py-2 align-top">{getBanqueInfo(d.BNQ_CODE)}</td>
                            <td className="px-3 py-2 align-top">{getGuichetInfo(d.GUI_ID)}</td>
                            <td className="px-3 py-2 font-medium align-top">{d.DOM_NUMCPT}</td>
                            <td className="px-3 py-2 text-blue-600 font-medium align-top">{d.DOM_RIB || "—"}</td>
                            <td className="px-3 py-2 align-top">
                              {(() => {
                                let bgColor = "";
                                let textColor = "";
                                let label = "";

                                switch (d.DOM_STATUT) {
                                  case 0:
                                    bgColor = "bg-red-100";
                                    textColor = "text-red-700";
                                    label = "Rejeté";
                                    break;
                                  case 1:
                                    bgColor = "bg-gray-100";
                                    textColor = "text-gray-600";
                                    label = "Non approuvé";
                                    break;
                                  case 2:
                                    bgColor = "bg-orange-100";
                                    textColor = "text-orange-700";
                                    label = "En cours d'approbation...";
                                    break;
                                  case 3:
                                    bgColor = "bg-green-100";
                                    textColor = "text-green-700";
                                    label = "Approuvé";
                                    break;
                                  default:
                                    bgColor = "bg-gray-100";
                                    textColor = "text-gray-600";
                                    label = "Inconnu";
                                }

                                return (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${bgColor} ${textColor}`}>
                                    {label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-2 text-right align-top space-x-1">
                              {d.DOM_FICHIER && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewRib(d.DOM_CODE);
                                  }}
                                  title="Afficher le fichier"
                                >
                                  <FileDown className="w-4 h-4 text-green-500" />
                                </Button>
                              )}
                              {/* {d.DOM_FICHIER && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadRib(d.DOM_CODE);
                                  }}
                                  title="Télécharger le fichier"
                                >
                                  <FileDown className="w-4 h-4 text-green-500" />
                                </Button>
                              )} */}
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(d)}} title="Modifier le RIB">
                                <Edit className="w-4 h-4 text-blue-500" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDomiciliation(d);
                                setIsDeleteDialogOpen(true);
                              }} title="Supprimer le RIB">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

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
            selectedDomiciliation
              ? `Le RIB : ${getBanqueInfo(selectedDomiciliation.BNQ_CODE)} - ${selectedDomiciliation.DOM_NUMCPT || "_"}-${selectedDomiciliation.DOM_RIB}`
              : ""
          }
        />

        {/* Confirmation validation statut */}
        <ConfirmValidateDialog
          open={isValidateStatusDialogOpen}
          onClose={() => setIsValidateStatusDialogOpen(false)}
          onConfirm={handleConfirmValidateStatus}
          itemName={selectedRowsForStatus.length > 0 ? `${selectedRowsForStatus.length} RIB sélectionné` : ""}
        />

        <ConfirmValidateDialog2
          open={openValidateDialog}
          onClose={() => setOpenValidateDialog(false)}
          onConfirm={handleConfirmFinishValidation}
          itemName={validateMessage}
        />
      </div>
    </div>
  );
}