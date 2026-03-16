import { Calendar, ChevronDown, LogOut, Settings, User } from "lucide-react";
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
import ThemeToggle from "@/components/ui/ThemeToggle";

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
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-background/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-gray-900/30 ${className}`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center justify-between w-full min-h-[64px] px-4">
            <SidebarTrigger className="dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800" />

            <div className="flex-1 px-2 text-center">

              {/* Plateforme en haut */}
              <p className="text-[14px] sm:text-[14px] text-muted-foreground dark:text-gray-400 font-medium">
                Plateforme de gestion digitalisée des Quotes-Parts
              </p>

              {/* Nom de la régie */}
              <h1
                className="font-bold text-primary dark:text-primary-400 text-[14px] sm:text-base md:text-[14px] break-words mt-1"
              >
                {user?.regie
                  ? `${user.regie.REG_LIBELLE} (${user.regie.REG_SIGLE})`
                  : ""}
              </h1>

              {activeEcheance && (
                <div className="mt-1 inline-flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
                  <Calendar className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Échéance en cours : {activeEcheance.ECH_LIBELLE}
                  </span>
                </div>
              )}

            </div>

            {/* Dropdown profil */}
            <div className="flex items-center gap-2">

              {/* Switch thème */}
              <ThemeToggle />

              {/* Dropdown profil */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="group flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 px-2 py-1 h-auto rounded-full"
                  >
                    {/* Avatar avec statut */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <span className="text-white font-semibold text-sm">
                          {user?.UTI_PRENOM?.charAt(0)}{user?.UTI_NOM?.charAt(0)}
                        </span>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 dark:bg-green-400 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>

                    {/* Infos utilisateur */}
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                        {user?.UTI_PRENOM} {user?.UTI_NOM}
                        <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {user?.groupe?.GRP_NOM ?? "Utilisateur"}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent 
                  align="end" 
                  className="w-64 p-2 mt-2 border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-gray-900/50 rounded-xl dark:bg-gray-800"
                >
                  {/* En-tête du dropdown */}
                  <div className="px-2 py-3 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Connecté en tant que</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {user?.groupe?.GRP_NOM ?? "Utilisateur"}
                    </p>
                  </div>

                  <DropdownMenuLabel className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    Mon compte
                  </DropdownMenuLabel>
                  
                  <DropdownMenuItem 
                    onClick={() => setProfileOpen(true)}
                    className="cursor-pointer rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors py-2.5 dark:text-gray-300"
                  >
                    <Settings className="mr-3 h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <div>
                      <span className="text-sm font-medium dark:text-gray-200">Paramètres du profil</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Modifier vos informations</p>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2 dark:bg-gray-700" />

                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 transition-colors py-2.5"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <div>
                      <span className="text-sm font-medium">Déconnexion</span>
                      <p className="text-xs text-red-400 dark:text-red-500">Quitter la session</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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