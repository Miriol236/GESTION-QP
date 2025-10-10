import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface User {
  UTI_CODE: string;
  UTI_NOM: string;
  UTI_PRENOM: string;
  UTI_USERNAME: string;
  GRP_CODE: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fonctionnalites: string[]; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [fonctionnalites, setFonctionnalites] = useState<string[]>([]); 

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedFonctionnalites = localStorage.getItem("fonctionnalites");

    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedFonctionnalites) setFonctionnalites(JSON.parse(storedFonctionnalites));
    }
  }, []);

  //  Connexion utilisateur
  const login = async (username: string, password: string) => {
    const { data } = await axios.post("http://127.0.0.1:8000/api/login", {
      username,
      password,
    });

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("fonctionnalites", JSON.stringify(data.fonctionnalites || []));

    axios.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
    setUser(data.user);
    setFonctionnalites(data.fonctionnalites || []);
  };

  //  Déconnexion
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("fonctionnalites");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setFonctionnalites([]);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, fonctionnalites }}>
      {children}
    </AuthContext.Provider>
  );
}

//  Hook personnalisé
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}