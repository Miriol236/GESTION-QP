import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/Layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Beneficiaires from "./pages/Beneficiaires";
import Banques from "./pages/Banques";
import NotFound from "./pages/NotFound";
import Utilisateurs from "./pages/Utilisateurs";
import Fonctionnalites from "./pages/Fonctionnalites";
import Groupe from "./pages/Groupes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/beneficiaires" element={<Beneficiaires />} />
              <Route path="/banques" element={<Banques />} />
              <Route path="/paiements" element={<Banques />} />
              <Route path="/echeances" element={<Banques />} />
              <Route path="/regies" element={<Banques />} />
              <Route path="/elements" element={<Banques />} />
              <Route path="/parametres" element={<Banques />} />
              <Route path="/utilisateurs" element={<Utilisateurs />} />
              <Route path="/fonctionnalites" element={<Fonctionnalites />} />
              <Route path="/groupes" element={<Groupe />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
