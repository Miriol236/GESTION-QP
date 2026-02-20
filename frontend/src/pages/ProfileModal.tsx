import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/config/api";
import { toast } from "@/components/ui/use-toast";
import { User, Eye, EyeOff, UserCircle, Pencil, Building2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères.", variant: "destructive" });
      return;
    }
    if (password && password !== passwordConfirm) {
      toast({ title: "Erreur", description: "Le mot de passe et sa confirmation ne correspondent pas.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/profile-update`,
        { UTI_NOM: nom, UTI_PRENOM: prenom, UTI_SEXE: sexe, password: password || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "Succès", description: "Profil mis à jour avec succès.", variant: "success" });
      setUser({ ...user, UTI_NOM: nom, UTI_PRENOM: prenom, UTI_SEXE: sexe });
      setEditMode(false);
      setPassword(""); setPasswordConfirm("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.response?.data?.message || "Erreur serveur", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Taille compacte : max-w 500px, padding réduit */}
      <DialogContent className="sm:max-w-[500px] rounded-2xl p-4">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-lg font-semibold flex items-center justify-center">
            MON PROFIL {user?.groupe?.GRP_NOM ?? "-"}
          </DialogTitle>

          {/* Avatar */}
          <div className="relative mx-auto w-14 h-14">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1 shadow-md hover:scale-105 transition"
              title="Modifier"
            >
              <Pencil size={14} />
            </button>
          </div>
        </DialogHeader>

        {/* Infos utilisateur compactes */}
        <div className="mt-3 rounded-2xl border bg-background shadow-sm p-3 space-y-3">

          {/* Nom & statut */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs text-muted-foreground">Nom(s) et Prénom(s)</p>
                <p className="text-sm font-semibold truncate">{user?.UTI_PRENOM} {user?.UTI_NOM}</p>
              </div>
            </div>

            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
                ${user?.UTI_STATUT === 1 ? "bg-green-500/10 text-green-700" : "bg-gray-400/10 text-gray-600"}`}>
              <span className={`h-2 w-2 rounded-full animate-pulse ${user?.UTI_STATUT === 1 ? "bg-green-500" : "bg-gray-400"}`} />
              {user?.UTI_STATUT === 1 ? "Actif" : "Inactif"}
            </span>
          </div>

          {/* Username & régie */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                <UserCircle className="h-4 w-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nom d'utilisateur</p>
                <p className="truncate font-medium">{user?.UTI_USERNAME}</p>
              </div>
            </div>

            {/* Régie */}
            <div className="flex items-center gap-2 sm:col-span-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Building2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs text-muted-foreground">Régie</p>
                <p className="font-medium truncate">
                  {user?.regie ? `${user.regie.REG_LIBELLE} (${user.regie.REG_SIGLE})` : "-"}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Section édition compact */}
        {editMode && (
          <div className="mt-3 border-t pt-3 space-y-3">

            <p className="text-sm font-medium text-primary">Modification</p>

            {/* Nom + Prénom sur une ligne */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-1">Nom</label>
                <Input placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-1">Prénom</label>
                <Input placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            {/* Sexe */}
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">Sexe</label>
              <Select value={sexe} onValueChange={setSexe}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Sexe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mot de passe */}
            <div className="relative flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">Nouveau mot de passe</label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-8 text-sm"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirmation */}
            <div className="relative flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">Confirmer mot de passe</label>
              <Input
                type={showPasswordConfirm ? "text" : "password"}
                placeholder="Confirmer mot de passe"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                className="h-8 text-sm"
              />
              <button type="button" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setEditMode(false); setPassword(""); setPasswordConfirm(""); }} disabled={loading}>Annuler</Button>
              <Button
                size="sm"
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>

          </div>
        )}
      </DialogContent>
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </Dialog>
  );
}