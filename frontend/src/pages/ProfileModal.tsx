import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import axios from "axios";
import { API_URL } from "@/config/api";
import { toast } from "@/components/ui/use-toast";
import { User, Lock, Eye, EyeOff, UserCircle, Shield, Building2, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: Props) {
  const { user, setUser } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [nom, setNom] = useState(user?.UTI_NOM || "");
  const [prenom, setPrenom] = useState(user?.UTI_PRENOM || "");
  const [sexe, setSexe] = useState(user?.UTI_SEXE || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setNom(user.UTI_NOM || "");
      setPrenom(user.UTI_PRENOM || "");
      setSexe(user.UTI_SEXE || "");
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (password && password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    if (password && password !== passwordConfirm) {
      toast({
        title: "Erreur",
        description: "Le mot de passe et sa confirmation ne correspondent pas.",
        variant: "destructive",
      });
      return; // stop la fonction ici
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.put(
        `${API_URL}/profile-update`,
        {
          UTI_NOM: nom,
          UTI_PRENOM: prenom,
          UTI_SEXE: sexe,
          password: password || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès.",
        variant: "success",
      });

      setUser({
        ...user,
        UTI_NOM: nom,
        UTI_PRENOM: prenom,
        UTI_SEXE: sexe,
      });

      setEditMode(false);
      setPassword("");
      setPasswordConfirm("");
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Erreur serveur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl p-6">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-lg font-semibold flex items-center justify-center">
            MON PROFIL {user?.groupe?.GRP_NOM ?? "-"}
          </DialogTitle>
          
          {/* Avatar */}
          <div className="relative mx-auto w-16 h-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>

            <button
              onClick={() => setEditMode(!editMode)}
              className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1 shadow-md hover:scale-105 transition"
            >
              <Pencil size={14} />
            </button>
          </div>

        </DialogHeader>

        {/* Infos utilisateur */}
        <div className="mt-4 rounded-2xl border bg-background shadow-sm">

        {/* Identité */}
        <div className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <User className="h-6 w-6 text-primary" />
            </div>

            <div className="flex-1">
            <p className="text-xs text-muted-foreground">Nom(s) et Prénom(s)</p>
            <p className="text-base font-semibold leading-tight">
                {user?.UTI_PRENOM} {user?.UTI_NOM}
            </p>
            </div>

            {/* Statut */}
            <span
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium
                ${
                user?.UTI_STATUT === 1
                    ? "bg-green-500/10 text-green-700"
                    : "bg-gray-400/10 text-gray-600"
                }`}
            >
            <span
                className={`h-2 w-2 rounded-full animate-pulse
                ${
                    user?.UTI_STATUT === 1
                    ? "bg-green-500"
                    : "bg-gray-400"
                }`}
            />
            {user?.UTI_STATUT === 1 ? "Actif" : "Inactif"}
            </span>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-1 gap-4 border-t p-5 text-sm sm:grid-cols-2">

            {/* Nom d'utilisateur */}
            <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10">
                <UserCircle className="h-4 w-4 text-sky-600" />
            </div>
            <div className="truncate">
                <p className="text-muted-foreground text-xs">Nom d'utilisateur</p>
                <p className="font-medium truncate">
                {user?.UTI_USERNAME}
                </p>
            </div>
            </div>

            {/* Régie */}
            <div className="flex items-center gap-3 sm:col-span-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Building2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
                <p className="text-muted-foreground text-xs">Régie</p>
                <p className="font-medium">
                {user?.regie
                    ? `${user.regie.REG_LIBELLE} (${user.regie.REG_SIGLE})`
                    : "-"}
                </p>
            </div>
            </div>

        </div>
        </div>

        {editMode && (
          <div className="mt-6 space-y-4 border-t pt-6">

            <div className="text-sm font-medium text-primary">
              Modification des informations
            </div>

            {/* Nom & Prénom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-1">Nom</label>
                <Input
                  placeholder="Nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-1">Prénom</label>
                <Input
                  placeholder="Prénom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                />
              </div>
            </div>

            {/* Sexe */}
            <div className="flex flex-col mt-4">
              <label className="text-xs text-muted-foreground mb-1">Sexe</label>
              <Select value={sexe} onValueChange={setSexe}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le sexe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mot de passe */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirmation */}
            <div className="relative">
              <Input
                type={showPasswordConfirm ? "text" : "password"}
                placeholder="Confirmer le mot de passe"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Boutons édition */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setPassword("");
                  setPasswordConfirm("");
                }}
                disabled={loading}
              >
                Annuler
              </Button>

              <Button
                type="button"
                onClick={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? "Mise à jour..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}