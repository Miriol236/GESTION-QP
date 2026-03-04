import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import axios from "axios";
import { API_URL } from "@/config/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  if (user) return <Navigate to="/dashboard" replace />;

  const clearOldCookies = () => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      clearOldCookies();
      await axios.get(`${API_URL.replace("/api", "")}/sanctum/csrf-cookie`, {
        withCredentials: true,
      });

      const response = await axios.post(
        `${API_URL}/login`,
        { username, password },
        { withCredentials: true }
      );

      const { access_token, user, fonctionnalites } = response.data;

      localStorage.setItem("token", access_token);
      setUser(user);

      if (fonctionnalites) {
        localStorage.setItem("fonctionnalites", JSON.stringify(fonctionnalites));
      }

      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${user.UTI_PRENOM} ${user.UTI_NOM}`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description:
          error?.response?.data?.message || "Erreur de serveur. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(0,20,40,0.85) 0%, rgba(0,40,60,0.75) 100%),
          url(${import.meta.env.BASE_URL}bg_login.png)
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Effet de particules animées */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Bandeau texte animé */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden z-10">
        <div className="relative">
          {/* Dégradé de fond */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-transparent to-blue-600/30 backdrop-blur-sm"></div>
          
          {/* Contenu avec animation */}
          <div className="relative py-6">
            <div className="flex whitespace-nowrap animate-marquee-slow">
              <div className="flex items-center space-x-8 mx-4">
                <Shield className="w-5 h-5 text-blue-300" />
                <span className="text-xl md:text-2xl font-light text-white/90 tracking-wider">
                  BIENVENUE SUR LA PLATEFORME DE GESTION DIGITALISÉE DES QUOTES-PARTS
                </span>
                <Shield className="w-5 h-5 text-blue-300" />
                <span className="text-xl md:text-2xl font-light text-white/90 tracking-wider">
                  BIENVENUE SUR LA PLATEFORME DE GESTION DIGITALISÉE DES QUOTES-PARTS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="w-full max-w-md px-4 relative z-20 mt-24">
        <Card className="backdrop-blur-xl bg-white/90 border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden">
          {/* Décoration en haut de la carte */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600"></div>
          
          {/* Cercles décoratifs */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl"></div>

          <CardHeader className="space-y-4 text-center relative">
            {/* Logo avec animation */}
            <div className="mx-auto w-28 h-28 flex items-center justify-center mb-2 group">
              <div className="absolute w-32 h-32 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full animate-ping-slow"></div>
              <div className="relative bg-white/50 backdrop-blur-sm rounded-2xl p-2 shadow-xl group-hover:scale-110 transition-transform duration-300">
                <img
                  src={`${import.meta.env.BASE_URL}armoirie2.png`}
                  alt="User"
                  className="w-30 h-30 object-contain"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-cyan-800 bg-clip-text text-transparent">
                AUTHENTIFICATION
              </CardTitle>
              <p className="text-sm text-gray-500">
                Accédez à votre espace sécurisé
              </p>
            </div>
          </CardHeader>

          <CardContent className="relative">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Nom d'utilisateur
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Entrez votre nom d'utilisateur"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Mot de passe
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-800 hover:to-cyan-800 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </div>
                ) : (
                  "Se connecter"
                )}
              </Button>

              {/* Message de sécurité */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
                <Shield className="w-3 h-3" />
                <span>Connexion sécurisée</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center z-20">
        <div className="inline-flex items-center gap-3 px-6 py-2 backdrop-blur-sm bg-black/20 rounded-full border border-white/10">
          <p className="text-xs text-white/80">
            © 2025 - {new Date().getFullYear()} Développé par l'Office National d'Informatique
          </p>
          <div className="w-px h-4 bg-white/20"></div>
          <img
            src={`${import.meta.env.BASE_URL}logo.jpg`}
            alt="ONI"
            className="w-4 h-4 object-contain opacity-80 hover:opacity-100 transition-opacity"
          />
          <span className="text-xs text-white/60">Tous droits réservés.</span>
        </div>
      </footer>

      {/* Animations personnalisées */}
      <style>{`
        @keyframes marquee-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-slow {
          animation: marquee-slow 30s linear infinite;
        }
        .animate-ping-slow {
          animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}