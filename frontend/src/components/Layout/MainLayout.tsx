import { Navigate, Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { useAuth } from "@/contexts/AuthContext";

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
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 bg-background overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
