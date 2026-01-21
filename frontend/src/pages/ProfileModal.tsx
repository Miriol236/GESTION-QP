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
import { User, Lock, Eye, EyeOff, UserCircle, Shield, Building2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: Props) {
  const { user } = useAuth();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) {
      toast({
        title: "Mot de passe invalide",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    if (password !== passwordConfirm) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.put(
        `${API_URL}/profile-password`,
        { password },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "Succès",
        description: "Mot de passe mis à jour avec succès.",
        variant: "success",
      });

      setPassword("");
      setPasswordConfirm("");
      onClose();
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
      <DialogContent className="sm:max-w-[450px] rounded-2xl p-6">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-lg font-semibold flex items-center justify-center">
            MON PROFIL UTILISATEUR
          </DialogTitle>
          
          {/* Avatar */}
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
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
            {user?.UTI_STATUT === 1 ? "Compte actif" : "Compte inactif"}
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

            {/* Rôle */}
            <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <Shield className="h-4 w-4 text-purple-600" />
            </div>
            <div>
                <p className="text-muted-foreground text-xs">Rôle</p>
                <p className="font-medium">
                {user?.groupe?.GRP_NOM ?? "-"}
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

        {/* Sécurité */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lock className="w-4 h-4 text-primary" />
            Sécurité
          </div>

          {/* Nouveau mot de passe */}
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
              onClick={() =>
                setShowPasswordConfirm(!showPasswordConfirm)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPasswordConfirm ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleUpdatePassword}
            disabled={
                loading || !password || !passwordConfirm || password !== passwordConfirm
            }
          >
            {loading ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}