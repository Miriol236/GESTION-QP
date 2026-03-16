import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  List,
  Users,
  Building2,
  CreditCard,
  Calendar,
  Wallet,
  Settings,
  Shield,
  UserCog,
  Key,
  User,
  BriefcaseBusiness,
  ShieldPlus,
  Banknote,
  Pencil,
  ChevronDown, 
  ChevronRight,
  Gauge,
  Cog,
  ArrowUp,
  UserRound,
  CheckCheck
} from "lucide-react";
import { API_URL } from "@/config/api";
import { toast } from "sonner";

// Structure du menu avec foncCode
const menuItems = [
  {
    title: "Dashboard",
    icon: Gauge,
    url: "/dashboard",
  },
  {
    title: "Traitements",
    icon: Pencil,
    children: [
      { title: "Bénéficiaires", url: "/beneficiaires", icon: User, foncCode: "0011" },
      { title: "Paiements QP", url: "/paiements", icon: CreditCard, foncCode: "0014" },
    ],
  },
  {
    title: "Mouvements",
    icon: CheckCheck,
    children: [
      { title: "Validation Bénéficiaires", url: "/mouvements/beneficiaires", icon: User, foncCode: "0019" },
      { title: "Validation RIB", url: "/mouvements/domiciliers", icon: Building2, foncCode: "0020" },
      { title: "Validation Paiements", url: "/mouvements/paiements", icon: CreditCard, foncCode: "0021" },
    ],
  },
  {
    title: "Paramètres",
    icon: Settings,
    children: [
      { title: "Types de bénéficiaires", url: "/typeBeneficiaires", icon: User, foncCode: "0004" },
      { title: "Fonctions", url: "/fonctions", icon: BriefcaseBusiness, foncCode: "0005" },
      { title: "Grades", url: "/grades", icon: ShieldPlus, foncCode: "0006" },
      { title: "Échéances", url: "/echeances", icon: Calendar, foncCode: "0007" },
      { title: "Régies", url: "/regies", icon: Wallet, foncCode: "0008" },
      { title: "Banques", url: "/banques", icon: Building2, foncCode: "0009" },
      { title: "Guichets", url: "/guichets", icon: Banknote, foncCode: "0010" },
      { title: "Eléments", url: "/elements", icon: List, foncCode: "0013" },
      { title: "Types de mouvements", url: "/typeMouvements", icon: Cog, foncCode: "0015" },
      { title: "Niveaux de validation", url: "/niveau-validations", icon: ArrowUp, foncCode: "0016" },
      { title: "Positions", url: "/positions", icon: UserRound, foncCode: "0017" },
      { title: "Virements", url: "/virements", icon: CreditCard, foncCode: "0018" },
    ],
  },
  {
    title: "Administration",
    icon: Shield,
    children: [
      { title: "Utilisateurs", url: "/utilisateurs", icon: UserCog, foncCode: "0001" },
      { title: "Groupes & Droits", url: "/groupes", icon: Users, foncCode: "0002" },
      { title: "Fonctionnalités", url: "/fonctionnalites", icon: Key, foncCode: "0003" },
    ],
  },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [allowedFonctionnalites, setAllowedFonctionnalites] = useState<string[]>([]);
  const [totaux, setTotaux] = useState<{ total_general: number; par_type: Record<string, { total: number }> }>({
    total_general: 0,
    par_type: {},
  });

  // Récupérer les fonctionnalités autorisées
  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/user-fonctionnalites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllowedFonctionnalites(data);
    } catch (err) {
      toast.error("Erreur lors du chargement des fonctionnalités");
    }
  };

  useEffect(() => {
    fetchPermissions();

    const handleDroitUpdate = () => {
      fetchPermissions();
    };

    window.addEventListener("droitUpdated", handleDroitUpdate);

    return () => {
      window.removeEventListener("droitUpdated", handleDroitUpdate);
    };
  }, []);

  // Totaux des mouvements
  useEffect(() => {
    const fetchTotaux = async () => {
      try {
        setTotaux({ total_general: 0, par_type: {} });

        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/mouvements/totaux`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTotaux(res.data);
      } catch (err) {
        console.error("Erreur récupération totaux mouvements :", err);
        setTotaux({ total_general: 0, par_type: {} });
      }
    };

    fetchTotaux();

    const handleUpdate = () => fetchTotaux();
    window.addEventListener("mouvementsUpdated", handleUpdate);

    return () => window.removeEventListener("mouvementsUpdated", handleUpdate);
  }, []);
  
  // Créer une copie profonde du menu pour éviter les mutations
  const getUpdatedMenu = () => {
    return menuItems.map(menu => {
      if (menu.title === "Mouvements") {
        const updatedMenu = { ...menu };
        updatedMenu.title = `Mouvements${totaux.total_general > 0 ? ` (${totaux.total_general})` : ""}`;
        
        updatedMenu.children = menu.children.map((child) => {
          const typCodeMap: Record<string, string> = {
            "Validation Bénéficiaires": "20250001",
            "Validation Paiements": "20250002",
            "Validation RIB": "20250003",
          };

          const baseTitle = child.title.replace(/\s*\(\d+\)/, "");
          const code = typCodeMap[baseTitle];
          const total = code ? totaux.par_type[code]?.total : 0;

          return {
            ...child,
            title: `${baseTitle}${total && total > 0 ? ` (${total})` : ""}`,
          };
        });
        
        return updatedMenu;
      }
      return menu;
    });
  };

  // Filtrer le menu selon les droits
  const filterMenuItems = (items: any[]): any[] => {
    return items
      .map((item) => {
        if (!item.children) {
          return item;
        }

        const allowedChildren = item.children.filter((child: any) =>
          allowedFonctionnalites.includes(String(child.foncCode))
        );

        if (allowedChildren.length === 0) return null;

        return { ...item, children: allowedChildren };
      })
      .filter(Boolean);
  };

  const updatedMenu = getUpdatedMenu();
  const filteredMenu = filterMenuItems(updatedMenu);

  // Toggle submenu
  const toggleSubmenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border dark:border-gray-800 bg-sidebar dark:bg-gray-900 text-sidebar-foreground dark:text-gray-200">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-sidebar-border dark:border-gray-800">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <span className="font-bold text-sidebar-foreground dark:text-white">
                Quotes-Parts
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">QP</span>
            </div>
          )}
        </div>

        {/* Menu principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 dark:text-gray-400">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenu.map((item) => {
                const hasChildren = !!item.children;
                const isActiveParent =
                  hasChildren &&
                  item.children.some((child) => location.pathname.startsWith(child.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    {hasChildren ? (
                      <>
                        <SidebarMenuButton
                          onClick={() => toggleSubmenu(item.title)}
                          className={`w-full ${
                            isActiveParent
                              ? "bg-sidebar-accent dark:bg-gray-800 text-sidebar-accent-foreground dark:text-white font-semibold"
                              : "hover:bg-sidebar-accent/50 dark:hover:bg-gray-800/50 text-sidebar-foreground dark:text-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!isCollapsed && <span className="truncate">{item.title}</span>}
                          </div>
                          {!isCollapsed && (
                            <span className="ml-auto shrink-0">
                              {openMenus[item.title] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </SidebarMenuButton>

                        <AnimatePresence>
                          {openMenus[item.title] && !isCollapsed && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-6 mt-1 space-y-1 overflow-hidden"
                            >
                              {item.children.map((subItem) => (
                                <NavLink
                                  key={subItem.title}
                                  to={subItem.url}
                                  className={({ isActive }) =>
                                    `block px-2 py-1.5 rounded-md text-sm transition-all ${
                                      isActive
                                        ? "bg-sidebar-accent dark:bg-gray-800 text-sidebar-accent-foreground dark:text-white font-medium"
                                        : "hover:bg-sidebar-accent/40 dark:hover:bg-gray-800/40 text-sidebar-foreground/80 dark:text-gray-400"
                                    }`
                                  }
                                  onClick={() => {
                                    if (isMobile) {
                                      setOpenMobile(false);
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <subItem.icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{subItem.title}</span>
                                  </div>
                                </NavLink>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <NavLink
                        to={item.url || "#"}
                        className={({ isActive }) =>
                          `block ${
                            isActive
                              ? "bg-sidebar-accent dark:bg-gray-800 text-sidebar-accent-foreground dark:text-white font-medium"
                              : "hover:bg-sidebar-accent/40 dark:hover:bg-gray-800/40 text-sidebar-foreground dark:text-gray-300"
                          }`
                        }
                      >
                        <SidebarMenuButton className="w-full">
                          <div className="flex items-center gap-2 flex-1">
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!isCollapsed && <span className="truncate">{item.title}</span>}
                          </div>
                        </SidebarMenuButton>
                      </NavLink>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}