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
import ProfileModal from "@/pages/ProfileModal";

export default function Header({ className = "" }: { className?: string }) {
  const { user, logout } = useAuth();
  const [activeEcheance, setActiveEcheance] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

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
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-background/80 backdrop-blur-md border-b shadow-sm ${className}`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center justify-between w-full min-h-[64px] px-4">
            <SidebarTrigger />

            <div className="flex-1 px-2 text-center">
              <h1
                className="font-bold text-primary text-sm sm:text-base md:text-xl break-words"
              >
                {user?.regie
                  ? `${user.regie.REG_LIBELLE} (${user.regie.REG_SIGLE})`
                  : ""}
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground">
                Plateforme digitalisée de gestion des Quotes-Parts
                {activeEcheance && (
                  <span className="ml-1 text-green-600 font-medium">
                    — Échéance en cours : {activeEcheance.ECH_LIBELLE}
                  </span>
                )}
              </p>
            </div>

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
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Modal profil */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}