import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { API_URL } from "@/config/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password,
      });

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
        description: error?.response?.data?.message || "Erreur de serveur. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-300 relative overflow-hidden">

      {/*  Texte défilant en haut ----> animate-marquee */}
      <div className="absolute top-16 w-full overflow-hidden">
        <div className="text-2xl font-bold text-center text-primary">
          BIENVENUE SUR LA PLATEFORME DIGITALISEE DES QUOTES-PARTS
        </div>
      </div>


      {/*  Contenu principal */}
      <div className="w-full max-w-md px-4 mt-12">
        <Card className="shadow-lg border border-gray-300 bg-white">
          <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">AUTHENTIFICATION</CardTitle>
          {/* <div className="mx-auto w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
            <User className="text-white w-20 h-20" />
          </div> */}
          <div className="mx-auto w-32 h-32 flex items-center justify-center mb-4">
            <img
              src={`${import.meta.env.BASE_URL}armoirie.png`}
              alt="User"
              className="w-full h-full object-contain"
            />
          </div>
        </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

             <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/*  Footer avec copyright */}
      {/* <footer className="absolute bottom-4 text-sm text-muted-foreground text-center">
        © {new Date().getFullYear()} Développé par l’Office National d’Informatique - Tous droits réservés.
      </footer> */}
      <footer className="absolute bottom-4 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
        © {new Date().getFullYear()} Développé par l’Office National d’Informatique
        <img
          src={`${import.meta.env.BASE_URL}logo.jpg`}
          alt="ONI"
          className="inline-block w-5 h-5 object-contain"
        /> 
        - Tous droits réservés.
      </footer>

      {/*  Animation du texte défilant */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          min-width: 100%;
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </div>
  );
}