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
  const [dataReady, setDataReady] = useState(true);
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
  const [benefSuggestions, setBenefSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [ageError, setAgeError] = useState("");
  const today = new Date();
  const maxDate15 = new Date(
    today.getFullYear() - 15,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .split("T")[0];

  const { toast } = useToast();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBeneficiaire({ ...beneficiaire, BEN_DATE_NAISSANCE: value });

    if (value) {
      const selectedDate = new Date(value);
      const minAllowedDate = new Date(
        today.getFullYear() - 15,
        today.getMonth(),
        today.getDate()
      );

      if (selectedDate > minAllowedDate) {
        setAgeError("Le bénéficiaire doit avoir au moins 15 ans.");
      } else {
        setAgeError("");
      }
    } else {
      setAgeError("");
    }
  };

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
      if (beneficiaireData) {
        setDataReady(false);

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

        setDataReady(true);
      }
    };

    loadBeneficiaireData();
  }, [beneficiaireData, listsLoaded]);

  useEffect(() => {
    const loadData = async () => {
      setDataReady(false);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
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
        setListsLoaded(true);

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

  const searchBeneficiaires = async (nom: string, prenom: string) => {
    if (!nom && !prenom) {
      setBenefSuggestions([]);
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/beneficiaires-search`, {
        params: { nom, prenom },
        headers: { Authorization: `Bearer ${token}` },
      });

      setBenefSuggestions(res.data || []);
    } catch {
      setBenefSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        beneficiaire.BEN_NOM.length >= 2 ||
        beneficiaire.BEN_PRENOM.length >= 2
      ) {
        searchBeneficiaires(
          beneficiaire.BEN_NOM,
          beneficiaire.BEN_PRENOM
        );
      } else {
        setBenefSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [beneficiaire.BEN_NOM, beneficiaire.BEN_PRENOM]);

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

    const onlyDigits = numCompte.replace(/\D/g, "");
    const containsLetters = /[A-Z]/.test(numCompte);

    if (onlyDigits.length < 11 || containsLetters) {
      return "";
    }

    const ribBase = codeBanque + codeGuichet + onlyDigits + "00";

    let reste = 0;
    for (let i = 0; i < ribBase.length; i++) {
      reste = (reste * 10 + Number(ribBase[i])) % 97;
    }

    const cle = 97 - reste;
    return String(cle).padStart(2, "0");
  };

  const handleNext = async () => {
    if (!beneficiaire.BEN_NOM || !beneficiaire.BEN_PRENOM || !beneficiaire.BEN_SEXE || !beneficiaire.BEN_DATE_NAISSANCE || !beneficiaire.TYP_CODE || !beneficiaire.FON_CODE || !beneficiaire.POS_CODE) {
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
        await axios.put(`${API_URL}/beneficiaires/${beneficiaireData.BEN_CODE}`, beneficiaire, { headers });
        toast({
          title: "Succès",
          description: "Bénéficiaire mis à jour !",
          variant: "success",
        });
        setStep(2);
      } else {
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

  const handleNextWithUpdate = async () => {
    if (!benefCode) 
      return toast({
          title: "Erreur",
          description: "Aucun bénéficiaire sélectionné.",
          variant: "destructive",
        });
    if (!beneficiaire.BEN_NOM || !beneficiaire.BEN_PRENOM || !beneficiaire.TYP_CODE || !beneficiaire.FON_CODE || !beneficiaire.POS_CODE) {
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
          description: error?.response?.data?.message || "Erreur lors de la mise à jour",
          variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

      const list = await axios.get(`${API_URL}/domiciliations/${benefCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDomiciliations(list.data);

      setCurrentDomiciliation({
        DOM_CODE: "",
        DOM_NUMCPT: "",
        BNQ_CODE: "",
        GUI_ID: "",
        DOM_RIB: "",
        DOM_FICHIER: null,
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

  const handleEdit = (d: any) => {
    setIsEditing(true);
    setEditId(d.DOM_CODE);
    
    setCurrentDomiciliation({
      DOM_CODE: d.DOM_CODE,
      DOM_NUMCPT: d.DOM_NUMCPT,
      BNQ_CODE: d.BNQ_CODE,
      GUI_ID: d.GUI_ID,
      DOM_RIB: d.DOM_RIB,
      DOM_FICHIER: d.DOM_FICHIER || null,
    });

    setRibFile(d.DOM_FICHIER || null);
  };

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

      const formData = new FormData();
      formData.append("BNQ_CODE", currentDomiciliation.BNQ_CODE);
      formData.append("GUI_ID", currentDomiciliation.GUI_ID);
      formData.append("DOM_NUMCPT", currentDomiciliation.DOM_NUMCPT || "");
      if (currentDomiciliation.DOM_FICHIER instanceof File) {
        formData.append("DOM_FICHIER", currentDomiciliation.DOM_FICHIER);
      }
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

      const res = await axios.get(`${API_URL}/domiciliations/${benefCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDomiciliations(res.data);

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
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers["content-type"];
      const file = new Blob([response.data], { type: contentType });

      const fileURL = window.URL.createObjectURL(file);

      window.open(fileURL, "_blank");

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
      link.download = filename;
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
      const id = selectedRowsForStatus[0].DOM_CODE;
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

      if (data?.requiresConfirmation) {
        setValidateMessage(data.message);
        setOpenValidateDialog(true);
        return;
      }

      toast({
        title: "Succès",
        description: data.message,
        variant: "success",
      });

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
            <Button 
              variant="outline" 
              className="w-full justify-between truncate text-left bg-card dark:bg-card border-border dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20" 
              disabled={disabled}
            >
              {selected ? (
                <span className="truncate max-w-[230px] text-foreground dark:text-foreground">{display(selected)}</span>
              ) : (
                <span className="text-muted-foreground dark:text-muted-foreground">-- Sélectionner --</span>
              )}
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
            </Button>
          </PopoverTrigger>
          {!disabled && (
            <PopoverContent className="p-0 w-full sm:w-[300px] bg-popover dark:bg-popover border-border dark:border-border">
              <Command className="bg-popover dark:bg-popover">
                <CommandInput 
                  placeholder={`Rechercher ${label.toLowerCase()}...`} 
                  className="border-0 focus:ring-0 text-foreground dark:text-foreground"
                />
                <CommandList>
                  <CommandEmpty className="text-muted-foreground dark:text-muted-foreground">Aucun résultat</CommandEmpty>
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
                        className="cursor-pointer hover:bg-muted dark:hover:bg-muted/20 text-foreground dark:text-foreground"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${value ===
                            (item.TYP_CODE ||
                              item.FON_CODE ||
                              item.GRD_CODE ||
                              item.POS_CODE ||
                              item.BNQ_CODE ||
                              item.GUI_ID)
                            ? "opacity-100 text-primary dark:text-primary"
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

  const banquesPrimaires = ["20001", "20002", "20003", "20005"];

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
    <div className="w-full max-w-4xl lg:max-w-6xl mx-auto p-0 sm:p-8 bg-card dark:bg-card rounded-xl shadow-lg ring-1 ring-border dark:ring-border">
      <div className="flex flex-col h-screen md:h-auto">
        <div className="p-1 sm:p-1">
          <div className="text-center mb-3">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground dark:text-foreground uppercase tracking-wide">
              {beneficiaireData
                ? "MODIFICATION D'UN BÉNÉFICIAIRE"
                : "ENRÔLEMENT D'UN BÉNÉFICIAIRE"}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mt-1">
              {beneficiaireData
                ? "Mise à jour des informations du bénéficiaire"
                : "Saisie et enregistrement d’un nouveau bénéficiaire"}
            </p>
          </div>

          <div className="relative mb-1 md:mb-2 sticky top-0 bg-card dark:bg-card z-30 py-1">
            <div className="absolute top-5 left-0 w-full h-2 bg-muted dark:bg-muted/30 rounded-full">
              <motion.div
                className="h-1 bg-gradient-to-r from-primary to-primary-dark rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(step / stepTitles.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div className="flex justify-between items-center relative z-10 gap-2 px-1">
              {stepTitles.map((title, index) => {
                const isActive = step === index + 1;
                const isCompleted = step > index + 1;
                return (
                  <div key={index} className="flex flex-col items-center w-full px-1">
                    <motion.div
                      className={`flex items-center justify-center min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border-2 transition-all
                        ${isActive
                          ? "border-primary bg-primary text-primary-foreground scale-105 shadow-lg"
                          : isCompleted
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground"
                        }`}
                      whileHover={{ scale: isActive ? 1.05 : 1 }}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </motion.div>
                    <span className={`mt-3 text-xs sm:text-sm font-medium text-center ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        <div className="flex-1 overflow-auto px-1 sm:px-2 pb-1">

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-4 md:gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-foreground dark:text-foreground">Matricule solde</Label>
                    <Input
                      value={beneficiaire.BEN_MATRICULE}
                      onChange={(e) =>
                        setBeneficiaire({ ...beneficiaire, BEN_MATRICULE: e.target.value.toUpperCase() })
                      }
                      className="h-9 text-sm text-foreground dark:text-foreground caret-primary w-full bg-card dark:bg-card border-border dark:border-border"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground dark:text-foreground">Nom <span className="text-destructive">*</span></Label>
                    <Input
                      value={beneficiaire.BEN_NOM}
                      onChange={(e) =>
                        setBeneficiaire({ ...beneficiaire, BEN_NOM: e.target.value.toUpperCase() })
                      }
                      className="h-9 text-sm uppercase text-foreground dark:text-foreground caret-primary w-full bg-card dark:bg-card border-border dark:border-border"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground dark:text-foreground">Prénom <span className="text-destructive">*</span></Label>
                    <Input
                      value={beneficiaire.BEN_PRENOM}
                      onChange={(e) =>
                        setBeneficiaire({ ...beneficiaire, BEN_PRENOM: e.target.value.toUpperCase() })
                      }
                      className="h-9 text-sm uppercase text-foreground dark:text-foreground caret-primary w-full bg-card dark:bg-card border-border dark:border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-foreground dark:text-foreground">Sexe <span className="text-destructive">*</span></Label>
                    <div className="flex items-center gap-2 mt-1">
                      <label className="flex items-center gap-1 text-foreground dark:text-foreground">
                        <input
                          type="radio"
                          name="sexe"
                          value="M"
                          checked={beneficiaire.BEN_SEXE === "M"}
                          onChange={(e) =>
                            setBeneficiaire({ ...beneficiaire, BEN_SEXE: e.target.value })
                          }
                          className="accent-primary w-4 h-4"
                        />
                        Masculin
                      </label>

                      <label className="flex items-center gap-1 text-foreground dark:text-foreground">
                        <input
                          type="radio"
                          name="sexe"
                          value="F"
                          checked={beneficiaire.BEN_SEXE === "F"}
                          onChange={(e) =>
                            setBeneficiaire({ ...beneficiaire, BEN_SEXE: e.target.value })
                          }
                          className="accent-primary w-4 h-4"
                        />
                        Féminin
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-foreground dark:text-foreground">Date de naissance <span className="text-destructive">*</span></Label>
                    <Input
                      type="date"
                      max={maxDate15}
                      value={beneficiaire.BEN_DATE_NAISSANCE}
                      onChange={handleDateChange}
                      className={`h-9 text-sm text-foreground dark:text-foreground w-full bg-card dark:bg-card border-border dark:border-border ${ageError ? "border-destructive" : ""}`}
                    />
                    {ageError && (
                      <p className="text-destructive text-xs mt-1">{ageError}</p>
                    )}
                  </div>

                  <ComboBox
                    label="Type de bénéficiaire *"
                    items={types}
                    value={beneficiaire.TYP_CODE}
                    onSelect={(v: any) => setBeneficiaire({ ...beneficiaire, TYP_CODE: v })}
                    display={(t: any) => t.TYP_LIBELLE}
                  />

                  <ComboBox
                    label="Fonction *"
                    items={fonctions}
                    value={beneficiaire.FON_CODE}
                    onSelect={(v: any) => setBeneficiaire({ ...beneficiaire, FON_CODE: v })}
                    display={(f: any) => f.FON_LIBELLE}
                  />

                  <ComboBox
                    label="Grade"
                    items={grades}
                    value={beneficiaire.GRD_CODE}
                    onSelect={(v: any) => setBeneficiaire({ ...beneficiaire, GRD_CODE: v })}
                    display={(g: any) => g.GRD_LIBELLE}
                  />

                  <ComboBox
                    label="Position *"
                    items={positions}
                    value={beneficiaire.POS_CODE}
                    onSelect={(v: any) => setBeneficiaire({ ...beneficiaire, POS_CODE: v })}
                    display={(p: any) => p.POS_LIBELLE}
                  />
                </div>

                {!beneficiaireData && (benefSuggestions.length > 0 || searchLoading) && (
                  <div className="mt-2 col-span-full rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">

                    <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
                      {benefSuggestions.some(
                        (b) =>
                          b.BEN_NOM.toUpperCase() === beneficiaire.BEN_NOM.toUpperCase() &&
                          b.BEN_PRENOM.toUpperCase() === beneficiaire.BEN_PRENOM.toUpperCase()
                      )
                        ? <span className="text-destructive">
                            Attention : un bénéficiaire avec ce nom et prénom existe déjà. 
                            Veuillez vérifier les autres informations pour être sûr !
                          </span>
                        : "Liste des potentiels doublons sur nom/prénom"}
                    </div>

                    {searchLoading && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Recherche...
                      </div>
                    )}

                    <div className="flex flex-col gap-1 max-h-40 overflow-y-auto text-xs">

                      <div className="grid grid-cols-6 gap-2 font-semibold text-foreground border-b border-border pb-1 mb-1">
                        <div>Nom / Prénom</div>
                        <div>Date naissance</div>
                        <div>Position</div>
                        <div>Banque</div>
                        <div>Guichet</div>
                        <div>N° Compte - clé RIB</div>
                      </div>

                      {benefSuggestions.map((b) => (
                        <div
                          key={b.BEN_CODE}
                          className="grid grid-cols-6 gap-2 border-b border-border last:border-0 py-1 px-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded"
                        >
                          <div className="font-medium text-foreground">
                            {b.BEN_NOM} {b.BEN_PRENOM}
                          </div>

                          <div className="text-muted-foreground">
                            {b.BEN_DATE_NAISSANCE || "-"}
                          </div>

                          <div className="text-muted-foreground">
                            {b.POS_LIBELLE || "-"}
                          </div>

                          <div className="text-muted-foreground">
                            {b.domiciliations?.[0]?.BNQ_LIBELLE || "-"}
                          </div>

                          <div className="text-muted-foreground">
                            {b.domiciliations?.[0]?.GUI_CODE || "-"}
                          </div>

                          <div className="text-muted-foreground">
                            {b.domiciliations?.[0]
                              ? b.domiciliations[0].DOM_RIB
                                ? `${b.domiciliations[0].DOM_NUMCPT}-${b.domiciliations[0].DOM_RIB}`
                                : b.domiciliations[0].DOM_NUMCPT
                              : "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">

                <ComboBox
                  label="Banque *"
                  items={banques}
                  value={currentDomiciliation.BNQ_CODE}
                  onSelect={(v: any) => setCurrentDomiciliation({ ...currentDomiciliation, BNQ_CODE: v, GUI_ID: "" })}
                  display={(b: any) => `${b.BNQ_LIBELLE}`}
                />

                <ComboBox
                  label="Guichet *"
                  items={guichets.filter((g) => String(g.BNQ_CODE).trim() === String(currentDomiciliation.BNQ_CODE).trim())}
                  value={currentDomiciliation.GUI_ID}
                  onSelect={(v: any) => setCurrentDomiciliation({ ...currentDomiciliation, GUI_ID: v })}
                  display={(g: any) => `${g.GUI_CODE} - ${g.GUI_NOM || "—"}`}
                  disabled={!currentDomiciliation.BNQ_CODE}
                />

                <div>
                  <Label className="text-foreground dark:text-foreground">Numéro de compte</Label>
                  <Input
                    value={currentDomiciliation.DOM_NUMCPT}
                    onChange={(e) => {
                      let num = e.target.value;

                      if (isBanquePrimaire) {
                        num = num.replace(/\D/g, "").slice(0, 11);
                      }

                      const rib = calculerCleRib(currentDomiciliation.BNQ_CODE, currentDomiciliation.GUI_ID, num);

                      setCurrentDomiciliation({ ...currentDomiciliation, DOM_NUMCPT: num, DOM_RIB: rib });

                      setNumCompteLength(num.length);
                    }}
                    placeholder={isBanquePrimaire ? "11 chiffres uniquement" : ""}
                    className="h-9 w-full bg-card dark:bg-card border-border dark:border-border text-foreground dark:text-foreground"
                  />
                  <div className="text-right text-xs text-primary mt-1">
                    {currentDomiciliation.DOM_NUMCPT.length}
                  </div>
                </div>

                <div className="md:col-span-3 mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Clé RIB :</span>
                      <span className="font-semibold text-primary">
                        {currentDomiciliation.DOM_RIB || "—"}
                      </span>
                    </div>

                    <label className="flex items-center gap-2 px-2 py-1 text-sm bg-primary/10 hover:bg-primary/20 rounded-md cursor-pointer max-w-[220px]">
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

                      <Upload className="w-4 h-4 text-muted-foreground shrink-0" />

                      <span
                        title={
                          currentDomiciliation.DOM_FICHIER instanceof File
                            ? currentDomiciliation.DOM_FICHIER.name
                            : currentDomiciliation.DOM_FICHIER
                              ? currentDomiciliation.DOM_FICHIER.split("/").pop()
                              : ""
                        }
                        className={`text-xs truncate whitespace-nowrap overflow-hidden max-w-[150px]
                          ${currentDomiciliation.DOM_FICHIER ? "text-foreground" : "text-muted-foreground"}
                        `}
                      >
                        {currentDomiciliation.DOM_FICHIER instanceof File
                          ? currentDomiciliation.DOM_FICHIER.name
                          : currentDomiciliation.DOM_FICHIER
                            ? currentDomiciliation.DOM_FICHIER.split("/").pop()
                            : "Joindre le fichier du RIB *"}
                      </span>
                    </label>

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
                          className="bg-primary hover:bg-primary-dark text-primary-foreground"
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
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : isEditing
                            ? "bg-primary hover:bg-primary-dark text-primary-foreground"
                            : "bg-primary hover:bg-primary-dark text-primary-foreground"
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
                        className="px-3 py-1.5 rounded-md text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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

              {!dataReady ? (
                <TableSkeletonWizard />
              ) : (
                <div className="flex flex-col gap-2 md:hidden mb-3">
                  {domiciliations.length === 0 ? (
                    <div className="p-4 bg-muted rounded-md text-center text-muted-foreground">
                      Aucune domiciliation ajoutée.
                    </div>
                  ) : (
                    domiciliations.map((d, i) => {
                      let bgColor = "";
                      let textColor = "";
                      let label = "";
                      switch (d.DOM_STATUT) {
                        case 0:
                          bgColor = "bg-destructive/10";
                          textColor = "text-destructive";
                          label = "Rejeté";
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
                        <div
                          key={i}
                          className={`p-2 bg-card rounded-lg shadow-sm border border-border flex flex-col gap-2 relative`}
                        >
                          <input
                            type="checkbox"
                            className="absolute top-2 left-2 w-4 h-4 accent-primary"
                            checked={isSelected(d)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleRowSelection(d)}
                          />

                          <div className="flex justify-between items-start ml-6">
                            <div>
                              <div className="text-xs text-muted-foreground">Banque :</div>
                              <div className="text-sm font-medium text-foreground">{getBanqueInfo(d.BNQ_CODE)}</div>
                            </div>
                            <div className="text-xs">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${bgColor} ${textColor}`}>
                                {label}
                              </span>
                            </div>
                          </div>

                          <div className="items-center ml-6">
                            <div className="text-xs text-muted-foreground">Guichet :</div>
                            <div className="text-sm font-medium text-foreground">{getGuichetInfo(d.GUI_ID)}</div>
                          </div>

                          <div className="flex justify-between items-center ml-6">
                            <div>
                              <div className="text-xs text-muted-foreground">N° Compte :</div>
                              <div className="font-medium text-foreground">{d.DOM_NUMCPT}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Clé RIB :</div>
                              <div className="text-primary font-medium">{d.DOM_RIB || "—"}</div>
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
                              <Edit className="w-4 h-4 text-primary" />
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
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {!dataReady ? (
                <TableSkeletonWizard />
              ) : (
                <div className="hidden md:block rounded-xl border border-border bg-card overflow-auto max-h-[360px] shadow-sm">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-muted sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-center text-muted-foreground">Choix</th>
                        <th className="px-3 py-2 text-center text-muted-foreground">Banque</th>
                        <th className="px-3 py-2 text-center text-muted-foreground">Guichet</th>
                        <th className="px-3 py-2 text-center text-muted-foreground">N° Compte</th>
                        <th className="px-3 py-2 text-center text-muted-foreground">Clé RIB</th>
                        <th className="px-3 py-2 text-center text-muted-foreground">Statut</th>
                        <th className="px-3 py-2 text-center text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {domiciliations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted-foreground py-4">Aucune domiciliation ajoutée.</td>
                        </tr>
                      ) : (
                        domiciliations.map((d, i) => (
                          <tr
                            key={i}
                            onClick={() => toggleRowSelection(d)}
                            className={`hover:bg-muted/50 transition-colors cursor-pointer
                              ${isSelected(d) ? "bg-primary/5" : ""}
                            `}
                          >
                            <td className="px-3 py-2 text-center align-top">
                              <input
                                type="checkbox"
                                checked={isSelected(d)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => toggleRowSelection(d)}
                                className="accent-primary"
                              />
                            </td>
                            <td className="px-3 py-2 align-top text-foreground">{getBanqueInfo(d.BNQ_CODE)}</td>
                            <td className="px-3 py-2 align-top text-foreground">{getGuichetInfo(d.GUI_ID)}</td>
                            <td className="px-3 py-2 font-medium align-top text-foreground">{d.DOM_NUMCPT}</td>
                            <td className="px-3 py-2 text-primary font-medium align-top">{d.DOM_RIB || "—"}</td>
                            <td className="px-3 py-2 align-top">
                              {(() => {
                                let bgColor = "";
                                let textColor = "";
                                let label = "";

                                switch (d.DOM_STATUT) {
                                  case 0:
                                    bgColor = "bg-destructive/10";
                                    textColor = "text-destructive";
                                    label = "Rejeté";
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
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(d)}} title="Modifier le RIB">
                                <Edit className="w-4 h-4 text-primary" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDomiciliation(d);
                                setIsDeleteDialogOpen(true);
                              }} title="Supprimer le RIB">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-between mt-6 gap-2">
                
                {beneficiaireData ? (
                  <Button
                    className="bg-primary hover:bg-primary-dark text-primary-foreground w-full md:w-auto"
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
                ) : (
                  <div />
                )}

                <Button
                  onClick={handleFinishValidation}
                  disabled={loading}
                  className="w-full md:w-auto bg-primary hover:bg-primary-dark text-primary-foreground"
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