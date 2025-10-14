import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Building2,
  CreditCard,
  Calendar,
  Wallet,
  FileText,
  Settings,
  Shield,
  UserCog,
  Key,
} from "lucide-react";
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

// Structure du menu avec sous-menus
const menuItems = [
  { title: "Tableau de bord", url: "/dashboard", icon: Home },
  { title: "Bénéficiaires", url: "/beneficiaires", icon: Users },
  { title: "Banques", url: "/banques", icon: Building2 },
  { title: "Paiements", url: "/paiements", icon: CreditCard },
  { title: "Échéances", url: "/echeances", icon: Calendar },
  { title: "Régies", url: "/regies", icon: Wallet },
  { title: "Éléments", url: "/elements", icon: FileText },

  //  Menu Paramètres
  {
    title: "Paramètres",
    icon: Settings,
    children: [
      { title: "Types de bénéficiaires", url: "typeBeneficiaires" },
      { title: "Fonctions", url: "/fonctions" },
      { title: "Grades", url: "/grades" },
    ],
  },

  //  Menu Administration
  {
    title: "Administration",
    icon: Shield,
    children: [
      { title: "Utilisateurs", url: "utilisateurs", icon: UserCog },
      { title: "Groupes & Droits", url: "groupes", icon: Users },
      { title: "Fonctionnalités", url: "fonctionnalites", icon: Key },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (menuTitle: string) => {
    setOpenMenus((prev) => ({ ...prev, [menuTitle]: !prev[menuTitle] }));
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        {/*  Logo */}
        <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              {/* <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ONI</span>
              </div> */}
              <span className="font-bold text-sidebar-foreground">Gestion des Quotes-Parts</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ONI</span>
            </div>
          )}
        </div>

        {/*  Menu principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const hasChildren = !!item.children;
                const isActiveParent =
                  hasChildren &&
                  item.children.some((child) =>
                    location.pathname.startsWith(child.url)
                  );

                return (
                  <SidebarMenuItem key={item.title}>
                    {hasChildren ? (
                      <>
                        {/*  Bouton principal avec couleur active */}
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
                              {openMenus[item.title] ? "▾" : "▸"}
                            </span>
                          )}
                        </SidebarMenuButton>

                        {/*  Sous-menus avec animation */}
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
                                  {subItem.icon && (
                                    <subItem.icon className="inline-block h-3 w-3 mr-2" />
                                  )}
                                  {subItem.title}
                                </NavLink>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      //  Menus sans sous-menus
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `transition-all ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                : "hover:bg-sidebar-accent/50"
                            }`
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
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
