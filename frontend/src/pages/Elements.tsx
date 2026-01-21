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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { API_URL } from "@/config/api";

export default function Element() {
  const [elements, setElements] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState(null);
  const [elementToDelete, setElementToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState("");
  const { toast } = useToast();

  //  Chargement initial
  useEffect(() => {
    fetchElements();
  }, []);

  useEffect(() => {
      if (editingElement) {
        setSelectedElement(editingElement.ELT_SENS || "");
      } else {
        setSelectedElement("");
      }
    }, [editingElement]);

  // Récupération des éléments
  const fetchElements = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/elements`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setElements(res.data);
        } catch (error) {
        console.error("Erreur lors du chargement des éléments :", error);
        } finally {
            setIsLoading(false);
      }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const displayed = elements
    // Filtrer par recherche si searchTerm non vide
    .filter((p) =>
      !searchTerm ||
      String(p.ELT_LIBELLE).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column[]  = [
    {
      key: "ELT_LIBELLE",
      title: "LIBELLE",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "ELT_SENS",
      title: "SENS",
      render: (value) => (
        <Badge
          variant={value === 1 ? "default" : "secondary"}
          className={
            value === 1
              ? "bg-green-500/20 text-green-700"
              : "bg-red-500/20 text-red-700"
          }
        >
          {value === 1 ? "+ Gain" : " - Retenue"}
        </Badge>
      ),
    },
  ];

  //  Ajouter ou modifier un élément
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = localStorage.getItem("token");

    const payload = {
      ELT_LIBELLE: formData.get("ELT_LIBELLE"),
      ELT_SENS: selectedElement,
    };

    try {
      if (editingElement) {
        await axios.put(`${API_URL}/elements/${editingElement.ELT_CODE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast({ 
          title: "Succès",
          description: "Elément modifié avec succès",
          variant: "success",
        });
      } else {
        await axios.post(`${API_URL}/elements`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast({ 
          title: "Succès",
          description: "Elément ajouté avec succès",
          variant: "success",
        });
      }
      fetchElements();
      setIsDialogOpen(false);
      setEditingElement(null);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Échec de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  // Suppression
  const handleConfirmDelete = async () => {
    if (!elementToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/elements/${elementToDelete.ELT_CODE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({ 
        title: "Succès",
        description: "Elément supprimé avec succès",
        variant: "success",
      });
      fetchElements();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.response?.data?.message || "Suppression échouée", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  if(isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold text-primary">
        Gestion des Eléments
      </h1>

      <DataTable
        title={`Effectif (${displayed.length})`}
        columns={columns}
        data={displayed}
        onAdd={() => { setEditingElement(null); setIsDialogOpen(true); }}
        onEdit={(u) => { setEditingElement(u); setIsDialogOpen(true); }}
        onDelete={(u) => { setElementToDelete(u); setIsDeleteDialogOpen(true); }}
        addButtonText="Nouveau"
        searchPlaceholder="Rechercher un élément..."
        onSearchChange={(value: string) => setSearchTerm(value)}
      />

      {/* Dialog ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingElement ? "MODIFIER L'ELEMENT" : "NOUVEAU ELEMENT"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input name="ELT_LIBELLE" defaultValue={editingElement?.ELT_LIBELLE || ""} required />
            </div>

            <div className="space-y-2">
                <Label>Sens <span className="text-red-500">*</span></Label>
                <Select
                value={selectedElement || undefined}
                onValueChange={(value) => setSelectedElement(value)}
                >
                <SelectTrigger>
                    <SelectValue placeholder="-- Sélectionner le sens --" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">+ Gain</SelectItem>
                    <SelectItem value="2">- Retenue</SelectItem>
                </SelectContent>
                </Select>
            </div>

            {/* <div className="col-span-2">
              <Label>Sens <span className="text-red-500">*</span></Label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="sens" value="1" checked={editingElement?.ELT_SENS === 1} className="accent-blue-600 w-4 h-4" />
                  + Gain
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="sens" value="2" checked={editingElement?.ELT_SENS === 2} className="accent-pink-500 w-4 h-4" />
                  - Retenue
                </label>
              </div>
            </div> */}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="default">
                {editingElement ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={elementToDelete?.ELT_LIBELLE}
      />
    </div>
  );
}