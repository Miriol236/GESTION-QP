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
import ListeBeneficiaires from "./pages/ListeBeneficiaires";
import NotFound from "./pages/NotFound";
import Utilisateurs from "./pages/Utilisateurs";
import Fonctionnalites from "./pages/Fonctionnalites";
import Groupe from "./pages/Groupes";
import TypeBeneficiaires from "./pages/TypeBeneficiaires";
import Fonctions from "./pages/Fonctions";
import Grades from "./pages/Grades";
import Echeances from "./pages/Echeances";
import Regies from "./pages/Regies";
import Banques from "./pages/Banques";
import Guichets from "./pages/Guichets";
import Elements from "./pages/Elements";
import Paiements from "./pages/Paiements";
import TypeMouvements from "./pages/TypeMouvements";
import NiveauValidations from "./pages/NiveauValidations";
import Positions from "./pages/Positions";
import Virements from "./pages/Virements";
import MouvementBeneficiaires from "./pages/MouvementBeneficiaires";
import MouvementDomiciliers from "./pages/MouvementDomiciliers";
import MouvementPaiements from "./pages/MouvementPaiements";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        {/* <BrowserRouter basename="/backend"> */}
        {/* <BrowserRouter basename="/"> */}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/beneficiaires" element={<Beneficiaires />} />
              <Route path="/liste-beneficiaires" element={<ListeBeneficiaires />} />
              <Route path="/paiements" element={<Paiements />} />
              <Route path="/utilisateurs" element={<Utilisateurs />} />
              <Route path="/fonctionnalites" element={<Fonctionnalites />} />
              <Route path="/groupes" element={<Groupe />} />
              <Route path="/typeBeneficiaires" element={<TypeBeneficiaires />} />
              <Route path="/fonctions" element={<Fonctions />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/echeances" element={<Echeances />} />
              <Route path="/regies" element={<Regies />} />
              <Route path="/banques" element={<Banques />} />
              <Route path="/guichets" element={<Guichets />} />
              <Route path="/elements" element={<Elements />} />
              <Route path="/typeMouvements" element={<TypeMouvements />} />
              <Route path="/niveau-validations" element={<NiveauValidations/>} />
              <Route path="/positions" element={<Positions/>} />
              <Route path="/virements" element={<Virements/>} />
              <Route path="/mouvements/beneficiaires" element={<MouvementBeneficiaires/>} />
              <Route path="/mouvements/domiciliers" element={<MouvementDomiciliers/>} />
              <Route path="/mouvements/paiements" element={<MouvementPaiements/>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
