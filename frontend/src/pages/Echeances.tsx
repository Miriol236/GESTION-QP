import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/common/DataTable";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import axios from "axios";
import { API_URL } from "@/config/api";

export default function Echeances() {
  const [echeances, setEcheances] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEcheance, setEditingEcheance] = useState(null);
  const [echeanceToDelete, setEcheanceToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [suggestion, setSuggestion] = useState({ annee: "", mois: "" });
  const [annee, setAnnee] = useState("");
  const [mois, setMois] = useState("");

  const years = Array.from({ length: 31 }, (_, i) => 2020 + i); // 2020 → 2050
  const months = [
    { value: "03", label: "Mars" },
    { value: "06", label: "Juin" },
    { value: "09", label: "Septembre" },
    { value: "12", label: "Décembre" },
  ];

  // Fonction utilitaire pour calculer le prochain trimestre
  function nextQuarter(echCode: string | number) {
    const code = echCode.toString();
    const year = parseInt(code.slice(0, 4), 10);
    const month = parseInt(code.slice(4, 6), 10);

    const trimestres = [3, 6, 9, 12];
    const index = trimestres.indexOf(month);

    if (index === -1) return { annee: year, mois: 3 }; // fallback

    if (index === trimestres.length - 1) {
      return { annee: year + 1, mois: 3 }; // dernier trimestre → année suivante
    }

    return { annee: year, mois: trimestres[index + 1] };
  }

  //  Chargement initial
  useEffect(() => {
    fetchEcheances();
  }, []);

  const fetchEcheances = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/echeances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEcheances(res.data);

      // récupérer le dernier ECH_CODE existant (ou actif)
      if (res.data.length > 0) {
        const sorted = res.data.sort((a, b) => b.ECH_CODE - a.ECH_CODE);
        const last = sorted[0];
        const next = nextQuarter(last.ECH_CODE);
        setSuggestion({
          annee: next.annee.toString(),
          mois: next.mois.toString().padStart(2, "0"),
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const displayed = echeances.filter(
    (p) =>
      !searchTerm ||
      String(p.ECH_LIBELLE).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column[] = [
    {
      key: "ECH_CODE",
      title: "CODE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "ECH_LIBELLE",
      title: "LIBELLE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "ECH_STATUT",
      title: "STATUT",
      render: (value: boolean) => (
        <Badge
          variant={value ? "default" : "secondary"}
          className={value ? "bg-green-500/20 text-green-700" : ""}
        >
          {value ? "En cours..." : "Traité"}
        </Badge>
      ),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      ECH_LIBELLE: formData.get("ECH_LIBELLE"),
      ECH_ANNEE: annee,
      ECH_MOIS: mois,
      ECH_CODE: `${annee}${mois}`
    };

    try {
      if (editingEcheance) {
        await axios.put(
          `${API_URL}/echeances/${editingEcheance.ECH_CODE}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        window.dispatchEvent(new Event("echeanceUpdated"));
        toast({
          title: "Succès",
          description: "Echéance modifiée avec succès",
          variant: "success",
        });
      } else {
        await axios.post(`${API_URL}/echeances`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        window.dispatchEvent(new Event("echeanceUpdated"));
        toast({
          title: "Succès",
          description: "Echéance ajoutée avec succès",
          variant: "success",
        });
      }
      fetchEcheances();
      setIsDialogOpen(false);
      setEditingEcheance(null);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Échec de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!echeanceToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/echeances/${echeanceToDelete.ECH_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.dispatchEvent(new Event("echeanceUpdated"));
      toast({
        title: "Succès",
        description: "Echéance supprimée avec succès",
        variant: "success",
      });
      fetchEcheances();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Suppression échouée",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleActivateEcheance = async (echeanceActivate) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/echeances/${echeanceActivate.ECH_CODE}/activer`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.dispatchEvent(new Event("echeanceUpdated"));
      toast({
        title: "Succès",
        description: "Echéance activée avec succès",
        variant: "success",
      });
      fetchEcheances();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error?.response?.data?.message || "Impossible d'activer",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold text-primary">Gestion des Echéances</h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => {
          setEditingEcheance(null);
          setAnnee(suggestion.annee);
          setMois(suggestion.mois);
          setIsDialogOpen(true);
        }}
        onStatut={(u) => handleActivateEcheance(u)}
        onEdit={(u) => {
          setEditingEcheance(u);

          const code = u.ECH_CODE.toString();
          const an = code.slice(0, 4);
          const ms = code.slice(4, 6);

          setAnnee(an);
          setMois(ms);

          setIsDialogOpen(true);
        }}
        onDelete={(u) => {
          setEcheanceToDelete(u);
          setIsDeleteDialogOpen(true);
        }}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher une échéance..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEcheance ? "MODIFIER L'ECHEANCE" : "NOUVELLE ECHEANCE"}
            </DialogTitle>
          </DialogHeader>

          {/* Suggestion prochaine échéance */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              Prochaine échéance suggérée :{" "}
              <strong>
                {suggestion.annee && suggestion.mois
                  ? `${suggestion.annee}-${suggestion.mois}`
                  : "-"}
              </strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Année <span className="text-red-500">*</span></Label>
                <select
                  name="ECH_ANNEE"
                  className="border rounded p-2 w-full"
                  required
                  value={annee}
                  onChange={(e) => setAnnee(e.target.value)}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Mois <span className="text-red-500">*</span></Label>
                <select
                  name="ECH_MOIS"
                  className="border rounded p-2 w-full"
                  required
                  value={mois}
                  onChange={(e) => setMois(e.target.value)}
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input
                name="ECH_LIBELLE"
                defaultValue={editingEcheance?.ECH_LIBELLE || ""}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="default">
                {editingEcheance ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={echeanceToDelete?.ECH_LIBELLE}
      />
    </div>
  );
}