import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Filter, Check, ChevronDown, DollarSign, CheckCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from "@/config/api";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSkeleton from "@/components/loaders/DashboardSkeleton";

// Ajouter ArcElement pour Pie chart
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Stat {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
  taux?: string;
}

export default function Dashboard() {
  const { toast } = useToast();

  const [stats, setStats] = useState<Stat[]>([]);
  const [echeances, setEcheances] = useState<any[]>([]);
  const [regies, setRegies] = useState<any[]>([]);
  const [selectedEcheance, setSelectedEcheance] = useState<string | null>(null);
  const [selectedRegie, setSelectedRegie] = useState<string | null>(null);

  const [echeanceOpen, setEcheanceOpen] = useState(false);
  const [regieOpen, setRegieOpen] = useState(false);
  const [pieRegieData, setPieRegieData] = useState<any>(null);
  const [isLoadings, setIsLoading] = useState(true);

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [totaux, setTotaux] = useState<{
    total_general: number;
    par_type: Record<string, { total: number }>;
  }>({
    total_general: 0,
    par_type: {},
  });

  const { user, isLoading } = useAuth(); // <- récupère `user` depuis ton contexte

  // Vérifie si le filtre Régie doit s'afficher
  const showRegieFilter = user?.REG_CODE === null;

  // Récupération des listes
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get(`${API_URL}/echeances-publique`, { headers }),
      axios.get(`${API_URL}/regies-publiques`, { headers }),
    ])
      .then(([e, r]) => {
        setEcheances(e.data);
        setRegies(r.data);
      })
      .catch(() =>
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des listes.",
          variant: "destructive",
        })
      );
  }, []);
  
  useEffect(() => {
    const fetchTotaux = async () => {
      try {
        const res = await axios.get(`${API_URL}/mouvements/totaux`);
        setTotaux(res.data);
      } catch (err) {
        console.error("Erreur récupération totaux mouvements :", err);
      }
    };

    fetchTotaux();
    // const interval = setInterval(fetchTotaux, 30000); // actualisation toutes les 30s
    // return () => clearInterval(interval);
  }, []);

  // Fetch statistiques
  const fetchTotals = async (ech_code: string | null = null, reg_code: string | null = null) => {
    try {
      // setIsLoading(true);
      const token = localStorage.getItem("token");
      const params: any = {};
      if (ech_code) params.ech_code = ech_code;
      if (reg_code) params.reg_code = reg_code;

      const { data } = await axios.get(`${API_URL}/totals-by-user`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const formatAmount = (a: number) => Number(a).toLocaleString("fr-FR") + " F CFA";
      const formatPercent = (p?: number) => (p != null ? p.toFixed(2) + " %" : "0.00 %");

      const newStats: Stat[] = [
      {
        title: "Effectif Bénéficiaires",
        value: data.total_beneficiaires.toString(),
        icon: Users, // importe l'icône Users de lucide-react ou une autre de ton choix
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        title: "Montant Total Brut",
        value: formatAmount(data.total_gain),
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        title: "Montant Total Net",
        value: formatAmount(data.total_net),
        icon: DollarSign,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "Montant déjà Viré",
        value: formatAmount(data.total_paye),
        icon: CheckCheck,
        color: "text-green-600",
        bgColor: "bg-green-50",
        taux: formatPercent(data.taux_paiement),
      },
      {
        title: "Montant reste à virer",
        value: formatAmount(data.reste_a_payer),
        icon: CheckCheck,
        color: "text-red-600",
        bgColor: "bg-red-50",
        taux: formatPercent(data.taux_reste_a_payer),
      }
    ];

      setStats(newStats);

      // Pie Chart uniquement avec Net à Payer, Déjà Viré et Reste à Virer
      setChartData({
        labels: [
          `Déjà Viré : ${formatAmount(data.total_paye)} (${formatPercent(data.taux_paiement)})`,
          `Reste à Virer : ${formatAmount(data.reste_a_payer)} (${formatPercent(data.taux_reste_a_payer)})`,
        ],
        datasets: [
          {
            data: [data.total_paye, data.reste_a_payer],
            backgroundColor: [
              "rgba(34,197,94,0.6)",   // vert pour déjà vire
              "rgba(239,68,68,0.6)",   // rouge pour reste à virer
            ],
            borderColor: [
              "rgba(34,197,94,1)",
              "rgba(239,68,68,1)",
            ],
            borderWidth: 1,
          },
        ],
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les totaux.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const BASE_COLORS = [
    { brut: "#046422ff", net: "#3db462ff" }, // vert
    { brut: "#2b1993ff", net: "#5199f2ff" }, // bleu
    { brut: "#c03e06ff", net: "#e58359ff" }, // orange
    { brut: "#6328edff", net: "#8659efff" }, // violet
    { brut: "#3b3b3cff", net: "#7b7b7eff" }, // gris
    { brut: "#3b240eff", net: "#785636ff" }, // teal
  ];

  // Création d’un mapping dynamique basé sur l’ordre d’apparition de la régie
  let regieColorMap: Record<string, { brut: string; net: string }> = {};

  const assignColors = (regies: string[]) => {
    regies.forEach((regie, i) => {
      if (!regieColorMap[regie]) {
        regieColorMap[regie] = BASE_COLORS[i % BASE_COLORS.length];
      }
    });
    return regieColorMap;
  };

  // Dans fetchTotalsByRegie
  const fetchTotalsByRegie = async (ech_code: string | null = null, reg_code: string | null = null) => {
    try {
      // setIsLoading(true);
      const token = localStorage.getItem("token");

      const params: any = {};
      if (ech_code) params.ech_code = ech_code;
      if (reg_code) params.reg_code = reg_code;

      const { data } = await axios.get(`${API_URL}/totals-by-regie`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      // On assigne dynamiquement les couleurs selon l’ordre d’apparition
      assignColors(data.map((r: any) => r.regie));

      setPieRegieData({
        labels: data.map((r: any) => r.regie),
        datasets: [
          {
            label: "Brut",
            data: data.map((r: any) => r.total_gain),
            backgroundColor: data.map((r: any) => regieColorMap[r.regie].brut),
            borderColor: "#ffffff",
            borderWidth: 2,
          },
          {
            label: "Net",
            data: data.map((r: any) => r.total_net),
            backgroundColor: data.map((r: any) => regieColorMap[r.regie].net),
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        ],
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques par régie.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch stats à chaque filtre
  useEffect(() => {
    fetchTotals(selectedEcheance, selectedRegie);
    fetchTotalsByRegie(selectedEcheance, selectedRegie);
  }, [selectedEcheance, selectedRegie]);

  if (isLoadings) {
    return <DashboardSkeleton />;
  }

  // const typCodeMap: Record<string, string> = {
  //   "Bénéficiaires": "20250001",
  //   "Paiements QP": "20250002",
  //   "Domiciliations (RIB)": "20250003",
  // };

  // // Construire les titres dynamiques
  // const mouvementsAvecTotaux = [
  //   "Bénéficiaires",
  //   "Paiements QP",
  //   "Domiciliations (RIB)"
  // ].map((titre) => {
  //   const code = typCodeMap[titre];
  //   const total = code ? totaux.par_type[code]?.total : 0;
  //   return {
  //     titre,
  //     total,
  //     affichage: `${titre}${total && total > 0 ? ` (${total})` : ""}`,
  //   };
  // });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* FILTRES */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Échéances */}
        {echeances.length > 0 && (
          <Popover open={echeanceOpen} onOpenChange={setEcheanceOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="px-2 py-1 flex items-center gap-2 justify-between w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 text-gray-500" />

                <span className="text-gray-600 text-xs font-medium">
                  Filtre :
                </span>

                <span className="font-semibold truncate">
                  {selectedEcheance
                    ? echeances.find((e) => e.ECH_CODE === selectedEcheance)?.ECH_LIBELLE
                    : "Échéance en cours..."}
                </span>

                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-[220px] sm:w-[250px]">
              <Command className="min-w-[230px] sm:min-w-[260px] max-w-[380px]">
                <CommandInput placeholder="Rechercher..." />
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setSelectedEcheance(null);
                        setEcheanceOpen(false); // ferme le Popover
                      }}
                    >
                      <Check className={`${!selectedEcheance ? "opacity-100" : "opacity-0"} mr-2`} />
                      Par défaut
                    </CommandItem>
                    {echeances.map((e, idx) => (
                      <CommandItem
                        key={idx}
                        onSelect={() => {
                          setSelectedEcheance(e.ECH_CODE);
                          setEcheanceOpen(false); // ferme le Popover
                        }}
                      >
                        <Check
                          className={`${selectedEcheance === e.ECH_CODE ? "opacity-100" : "opacity-0"} mr-2`}
                        />
                        {e.ECH_LIBELLE}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Régies */}        
        {/* Filtre Régie : visible uniquement pour les utilisateurs sans régie */}
        {showRegieFilter && regies.length > 0 && (
          <Popover open={regieOpen} onOpenChange={setRegieOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="px-2 py-1 flex justify-between w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 text-gray-500" />

                <span className="text-gray-600 text-xs font-medium">
                  Filtre :
                </span>

                {selectedRegie
                  ? regies.find((r) => r.REG_CODE === selectedRegie)?.REG_SIGLE
                  : "Toutes les Régies"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-[220px] sm:w-[250px]">
              <Command className="min-w-[230px] sm:min-w-[260px] max-w-[380px]">
                <CommandInput placeholder="Rechercher..." />
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setSelectedRegie(null);
                        setRegieOpen(false);
                      }}
                    >
                      <Check className={`${!selectedRegie ? "opacity-100" : "opacity-0"} mr-2`} />
                      Par défaut
                    </CommandItem>
                    {regies.map((r, idx) => (
                      <CommandItem
                        key={idx}
                        onSelect={() => {
                          setSelectedRegie(r.REG_CODE);
                          setRegieOpen(false);
                        }}
                      >
                        <Check
                          className={`${selectedRegie === r.REG_CODE ? "opacity-100" : "opacity-0"} mr-2`}
                        />
                        {r.REG_SIGLE}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>     

      {/* CARDS STATISTIQUES */}
      <div className="grid gap-2 
                grid-cols-1 
                sm:grid-cols-2 
                md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">

        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="hover:shadow-sm transition-shadow rounded-xl"
            >
              <CardHeader className="p-2 pb-0">
                <div className="flex flex-row items-start justify-between">
                  
                  {/* Icône + taux */}
                  <div className="flex items-center gap-2">
                    <div className={`${stat.bgColor} p-1.5 rounded-md`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>

                    {stat.taux && (
                      <span className="text-[14px] font-semibold text-gray-600">
                        {stat.taux}
                      </span>
                    )}
                  </div>

                  {/* Titre */}
                  <CardTitle className="text-xs font-semibold text-right">
                    {stat.title}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="px-2 pb-2"> 
                <div className="text-lg font-bold text-right leading-tight">                  
                    {stat.value} 
                </div> 
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {mouvementsAvecTotaux.map((mvt) => (
          <Card key={mvt.titre} className="rounded-xl hover:shadow-sm transition-shadow">
            <CardHeader className="p-2">
              <CardTitle className="text-xs font-semibold text-center">
                {mvt.affichage}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="text-lg font-bold text-right">{mvt.total}</div>
            </CardContent>
          </Card>
        ))}
      </div> */}

      {/* GRAPHIQUE */}
      <div className="grid gap-2 
                grid-cols-1 
                sm:grid-cols-2 
                md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        {/* PIE – Total gain par régie */}
        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle className="text-center w-full">Répartition Montants bruts et nets par Régie</CardTitle>
          </CardHeader>

          <CardContent className="h-[calc(100%-60px)] flex items-center justify-center">
            {pieRegieData && (
              <Pie
                data={pieRegieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                      labels: {
                        boxWidth: 14,
                        padding: 14,

                        generateLabels: (chart) => {
                          const { data } = chart;
                          if (!data.labels || data.datasets.length < 2) return [];

                          const labels: any[] = [];

                          data.labels.forEach((regie: any, i: number) => {
                            data.datasets.forEach((dataset: any) => {
                              const value = Number(dataset.data[i] || 0);
                              const total = dataset.data.reduce(
                                (acc: number, v: number) => acc + Number(v || 0),
                                0
                              );
                              const percent = total ? ((value / total) * 100).toFixed(2) : "0.00";

                              const formatted = `${value.toLocaleString("fr-FR")} F CFA (${percent}%)`;

                              labels.push({
                                text: `${regie} – ${dataset.label} : ${formatted}`,
                                fillStyle: dataset.backgroundColor[i],
                                strokeStyle: "#fff",
                                lineWidth: 2,
                                hidden: false,
                              });
                            });
                          });

                          return labels;
                        },
                      },
                      title: {
                        display: true,
                        text: "Légendes",
                        color: "#374151",
                        font: {
                          size: 14,
                          weight: "bold",
                        },
                      },
                    },

                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const value = Number(ctx.raw).toLocaleString("fr-FR");

                          const total = ctx.dataset.data.reduce(
                            (acc: number, v: number) => acc + v,
                            0
                          );

                          const percent = total
                            ? ((Number(ctx.raw) / total) * 100).toFixed(2)
                            : "0.00";

                          return `${ctx.dataset.label} – ${ctx.label} : ${value} F CFA (${percent} %)`;
                        },
                      },
                    },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* PIE */}
        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle className="text-center w-full">Répartition Montants virés et restes à virer</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-60px)]">
            {chartData.datasets.length > 0 && (
              <Pie
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                      title: {
                        display: true,
                        text: "Légendes",
                        color: "#374151", // gris foncé (Tailwind gray-700)
                        font: {
                          size: 14,
                          weight: "bold",
                        },
                        padding: {
                          bottom: 10,
                        },
                      },
                      labels: {
                        boxWidth: 14,
                        padding: 12,
                      },
                    },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>        
      </div>
    </div>
  );
}