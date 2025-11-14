import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import {API_URL} from '@/config/api';

export default function Header({ className = "" }: { className?: string }) {
  const { user, logout } = useAuth();
  const [activeEcheance, setActiveEcheance] = useState(null);

  const fetchActiveEcheance = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/echeance/active`, {
          headers: { Authorization: `Bearer ${token}` },
      });
      setActiveEcheance(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement de l'échéance :", error);
    }
  };

  useEffect(() => {
    // Chargement initial
    fetchActiveEcheance();

    //  Actualisation lors d'un changement d'échéance
    const handleEcheanceUpdate = () => {
      fetchActiveEcheance();
    };

    window.addEventListener("echeanceUpdated", handleEcheanceUpdate);

    return () => {
      window.removeEventListener("echeanceUpdated", handleEcheanceUpdate);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-background/80 backdrop-blur-md border-b shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between w-full">
        {/* --- Logo & Titre --- */}
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl font-bold text-primary">
              {user?.regie
                ? `${user.regie.REG_LIBELLE} (${user.regie.REG_SIGLE})`
                : ""}
            </h1>
            <p className="text-sm text-muted-foreground">
              Système de Gestion des Quotes-Parts
              {activeEcheance && (
                <span className="ml-2 text-green-600 font-medium">
                  — Échéance en cours : {activeEcheance.ECH_LIBELLE}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* --- Menu utilisateur --- */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 hover:bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">
                  {user?.UTI_PRENOM} {user?.UTI_NOM}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.groupe?.GRP_NOM ?? "-"}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}