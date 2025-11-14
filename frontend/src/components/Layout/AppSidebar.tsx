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
  HandCoins,
  ChevronDown, 
  ChevronRight
} from "lucide-react";
import { API_URL } from "@/config/api";
import { toast } from "sonner";

// Structure du menu avec foncCode
const menuItems = [
  {
    title: "Bénéficiaires",
    icon: Users,
    children: [
      { title: "Gestion des bénéficiaires", url: "/beneficiaires", icon: User, foncCode: "0011" },
      { title: "Liste des bénéficiaires avec RIB actifs", url: "/liste-beneficiaires", icon: Users, foncCode: "0012" },
    ],
  },
  {
    title: "Paiements QP",
    icon: CreditCard,
    children: [
      { title: "Gestion des paiements", url: "/paiements", icon: HandCoins, foncCode: "0014" },
      { title: "Liste des paiements", url: "/", icon: Banknote, foncCode: "0000" },
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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [allowedFonctionnalites, setAllowedFonctionnalites] = useState<string[]>([]);

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
    // Chargement initial
    fetchPermissions();

    const handleEcheanceUpdate = () => {
      fetchPermissions();
    };

    window.addEventListener("echeanceUpdated", handleEcheanceUpdate);

    return () => {
      window.removeEventListener("echeanceUpdated", handleEcheanceUpdate);
    };
  }, []);

  // Filtrer le menu selon les droits
  const filterMenuItems = (items: any[]): any[] => {
    return items
      .map((item) => {
        // Filtrer les enfants autorisés
        const allowedChildren = item.children
          ? item.children.filter((child: any) =>
              allowedFonctionnalites.includes(String(child.foncCode))
            )
          : [];

        // Si le menu principal n’a aucun enfant autorisé, on le supprime
        if (allowedChildren.length === 0) return null;

        return { ...item, children: allowedChildren };
      })
      .filter(Boolean) as any[]; // Supprime les null
  };

  const filteredMenu = filterMenuItems(menuItems);

  // Toggle submenu
  const toggleSubmenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <span className="font-bold text-sidebar-foreground">
                Gestion des Quotes-Parts
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">QP</span>
            </div>
          )}
        </div>

        {/* Menu principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
                          className={`flex items-center justify-between transition-all w-full ${
                            isActiveParent
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                              : "hover:bg-sidebar-accent/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.title}</span>}
                          </div>
                          {!isCollapsed && (
                            <span className="text-xs">
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
                              className="ml-6 mt-1 space-y-1"
                            >
                              {item.children.map((subItem) => (
                                <NavLink
                                  key={subItem.title}
                                  to={subItem.url}
                                  className={({ isActive }) =>
                                    `block px-2 py-1 rounded-md text-sm transition-all ${
                                      isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                        : "hover:bg-sidebar-accent/40"
                                    }`
                                  }
                                >
                                  <subItem.icon className="inline-block h-3 w-3 mr-2" />
                                  {subItem.title}
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
                          `flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-all ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "hover:bg-sidebar-accent/40"
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && item.title}
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