
import { Navigate, Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import Header from "./Header";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "./Footer";
export function MainLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-primary">
            QP
          </div>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar fixe à gauche */}
        <AppSidebar />

        {/* Conteneur principal */}
        <div className="flex flex-col flex-1">
          {/* Header fixe (ne bouge pas) */}
          <Header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md shadow-sm" />

          {/* Contenu défilable */}
          <main className="flex-1 overflow-auto p-6 bg-background">
            <Outlet />
          </main>

          {/* Footer fixe (ne bouge pas) */}
          <Footer className="border-t bg-background/80 backdrop-blur-md" />
        </div>
      </div>
    </SidebarProvider>
  );
}
