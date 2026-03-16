import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Filter, Check, ChevronDown, DollarSign, CheckCheck, Users, PieChart, BarChart3, CheckCircle, Building, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from "@/config/api";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSkeleton from "@/components/loaders/DashboardSkeleton";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

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

  const { user, isLoading } = useAuth();

  const showRegieFilter = user?.REG_CODE === null;

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
  }, []);

  const fetchTotals = async (ech_code: string | null = null, reg_code: string | null = null) => {
    try {
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
          icon: Users,
          color: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-50 dark:bg-purple-950/30",
        },
        {
          title: "Montant Total Brut",
          value: formatAmount(data.total_gain),
          icon: DollarSign,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-950/30",
        },
        {
          title: "Montant Total Net",
          value: formatAmount(data.total_net),
          icon: DollarSign,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
        },
        {
          title: "Montant déjà Viré",
          value: formatAmount(data.total_paye),
          icon: CheckCheck,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-950/30",
          taux: formatPercent(data.taux_paiement),
        },
        {
          title: "Montant non viré",
          value: formatAmount(data.reste_a_payer),
          icon: CheckCheck,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950/30",
          taux: formatPercent(data.taux_reste_a_payer),
        }
      ];

      setStats(newStats);

      setChartData({
        labels: [
          `Déjà Viré : ${formatAmount(data.total_paye)} (${formatPercent(data.taux_paiement)})`,
          `Non Viré : ${formatAmount(data.reste_a_payer)} (${formatPercent(data.taux_reste_a_payer)})`,
        ],
        datasets: [
          {
            data: [data.total_paye, data.reste_a_payer],
            backgroundColor: [
              "rgba(34,197,94,0.6)",
              "rgba(239,68,68,0.6)",
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
    { brut: "#046422ff", net: "#3db462ff" },
    { brut: "#2b1993ff", net: "#5199f2ff" },
    { brut: "#c03e06ff", net: "#e58359ff" },
    { brut: "#6328edff", net: "#8659efff" },
    { brut: "#3b3b3cff", net: "#7b7b7eff" },
    { brut: "#3b240eff", net: "#785636ff" },
  ];

  let regieColorMap: Record<string, { brut: string; net: string }> = {};

  const assignColors = (regies: string[]) => {
    regies.forEach((regie, i) => {
      if (!regieColorMap[regie]) {
        regieColorMap[regie] = BASE_COLORS[i % BASE_COLORS.length];
      }
    });
    return regieColorMap;
  };

  const fetchTotalsByRegie = async (ech_code: string | null = null, reg_code: string | null = null) => {
    try {
      const token = localStorage.getItem("token");

      const params: any = {};
      if (ech_code) params.ech_code = ech_code;
      if (reg_code) params.reg_code = reg_code;

      const { data } = await axios.get(`${API_URL}/totals-by-regie`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

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

  useEffect(() => {
    fetchTotals(selectedEcheance, selectedRegie);
    fetchTotalsByRegie(selectedEcheance, selectedRegie);
  }, [selectedEcheance, selectedRegie]);

  if (isLoadings) {
    return <DashboardSkeleton />;
  }

  const hasPieRegieData =
    pieRegieData &&
    pieRegieData.datasets?.length > 0 &&
    pieRegieData.datasets.some((ds: any) =>
      ds.data.some((v: number) => Number(v) > 0)
    );

  const hasChartData =
    chartData &&
    chartData.datasets?.length > 0 &&
    chartData.datasets.some((ds: any) =>
      ds.data.some((v: number) => Number(v) > 0)
    );

  const showGraphs = hasPieRegieData || hasChartData;

  return (
    <div className="space-y-6 animate-fade-in dark:bg-gray-900 dark:text-gray-100">
      {/* FILTRES */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Échéances */}
        {echeances.length > 0 && (
          <Popover open={echeanceOpen} onOpenChange={setEcheanceOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 px-4 py-2 h-auto shadow-sm hover:shadow-md dark:shadow-gray-900/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 dark:from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 transition-colors">
                    <Filter className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">Filtre</span>
                  
                  <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors"></div>
                  
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 max-w-[150px] truncate">
                    {selectedEcheance
                      ? echeances.find((e) => e.ECH_CODE === selectedEcheance)?.ECH_LIBELLE
                      : "Échéance en cours"}
                  </span>
                  
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                </div>
              </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-[280px] overflow-hidden rounded-xl border-0 shadow-xl dark:bg-gray-800 dark:shadow-gray-900/50" align="start">
              <Command className="rounded-xl dark:bg-gray-800">
                <div className="relative">
                  <CommandInput 
                    placeholder="Rechercher une échéance..." 
                    className="border-0 focus:ring-0 h-11 px-3 text-sm dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
                <CommandList className="max-h-[300px] dark:border-gray-700">
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setSelectedEcheance(null);
                        setEcheanceOpen(false);
                      }}
                      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors px-3 py-2.5 group dark:text-gray-300"
                    >
                      <div className="flex items-center w-full">
                        <Check 
                          className={`${!selectedEcheance ? "opacity-100 text-blue-600 dark:text-blue-400" : "opacity-0"} mr-3 h-4 w-4 transition-opacity`} 
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          Par défaut
                        </span>
                      </div>
                    </CommandItem>
                    
                    {echeances.map((e, idx) => (
                      <CommandItem
                        key={idx}
                        onSelect={() => {
                          setSelectedEcheance(e.ECH_CODE);
                          setEcheanceOpen(false);
                        }}
                        className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors px-3 py-2.5 group dark:text-gray-300"
                      >
                        <div className="flex items-center w-full">
                          <Check
                            className={`${selectedEcheance === e.ECH_CODE ? "opacity-100 text-blue-600 dark:text-blue-400" : "opacity-0"} mr-3 h-4 w-4 transition-opacity`}
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                              {e.ECH_LIBELLE}
                            </span>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
                
                <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {echeances.length} échéance{echeances.length > 1 ? 's' : ''} disponible{echeances.length > 1 ? 's' : ''}
                  </p>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Régies */}
        {showRegieFilter && regies.length > 0 && (
          <Popover open={regieOpen} onOpenChange={setRegieOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 px-4 py-2 h-auto shadow-sm hover:shadow-md dark:shadow-gray-900/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 dark:from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-900/30 group-hover:bg-purple-100 dark:group-hover:bg-purple-800/50 transition-colors">
                    <Filter className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  
                  <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">Filtre</span>
                  
                  <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors"></div>
                  
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 max-w-[150px] truncate">
                    {selectedRegie
                      ? regies.find((r) => r.REG_CODE === selectedRegie)?.REG_SIGLE
                      : "Toutes les régies"}
                  </span>
                  
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300" />
                </div>
              </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-[280px] overflow-hidden rounded-xl border-0 shadow-xl dark:bg-gray-800 dark:shadow-gray-900/50" align="start">
              <Command className="rounded-xl dark:bg-gray-800">
                <div className="relative">
                  <CommandInput 
                    placeholder="Rechercher une régie..." 
                    className="border-0 focus:ring-0 h-11 px-3 text-sm dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
                <CommandList className="max-h-[300px] dark:border-gray-700">
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setSelectedRegie(null);
                        setRegieOpen(false);
                      }}
                      className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors px-3 py-2.5 group dark:text-gray-300"
                    >
                      <div className="flex items-center w-full">
                        <Check 
                          className={`${!selectedRegie ? "opacity-100 text-purple-600 dark:text-purple-400" : "opacity-0"} mr-3 h-4 w-4 transition-opacity`} 
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                          Toutes les régies
                        </span>
                      </div>
                    </CommandItem>
                    
                    {regies.map((r, idx) => (
                      <CommandItem
                        key={idx}
                        onSelect={() => {
                          setSelectedRegie(r.REG_CODE);
                          setRegieOpen(false);
                        }}
                        className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors px-3 py-2.5 group dark:text-gray-300"
                      >
                        <div className="flex items-center w-full">
                          <Check
                            className={`${selectedRegie === r.REG_CODE ? "opacity-100 text-purple-600 dark:text-purple-400" : "opacity-0"} mr-3 h-4 w-4 transition-opacity`}
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                              {r.REG_SIGLE}
                            </span>
                            {r.REG_LIBELLE && (
                              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                                {r.REG_LIBELLE}
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
                
                <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {regies.length} régie{regies.length > 1 ? 's' : ''} disponible{regies.length > 1 ? 's' : ''}
                  </p>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div> 

      {/* CARDS STATISTIQUES */}
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="bg-sky-100 dark:bg-sky-950/20 hover:shadow-sm dark:hover:shadow-gray-900/50 transition-shadow rounded-xl border-gray-200 dark:border-gray-800"
            >
              <CardHeader className="p-2 pb-0">
                <div className="flex flex-row items-start justify-between">
                  
                  <div className="flex items-center gap-2">
                    <div className={`${stat.bgColor} p-1.5 rounded-md`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>

                    {stat.taux && (
                      <span className="text-[14px] font-semibold text-gray-600 dark:text-gray-400">
                        {stat.taux}
                      </span>
                    )}
                  </div>

                  <CardTitle className="text-xs font-semibold text-right text-gray-700 dark:text-gray-300">
                    {stat.title}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="px-2 pb-2"> 
                <div className="text-lg font-bold text-right leading-tight text-gray-800 dark:text-gray-200">                  
                    {stat.value} 
                </div> 
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* GRAPHIQUE */}
      {showGraphs && (
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
          {/* PIE – Total gain par régie */}
          {hasPieRegieData && (
            <div className="backdrop-blur-sm bg-sky-100 dark:bg-sky-950/20 rounded-2xl border border-white/20 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/30 hover:shadow-2xl transition-all duration-300">
              <div className="relative p-6 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-sky-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                      <div className="relative w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <PieChart className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        Répartition par Régie
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <span className="w-1 h-1 bg-sky-500 rounded-full"></span>
                        Montants bruts et nets
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 rounded-full blur-sm"></div>
                    <span className="relative px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                      {user?.regie
                        ? user.regie.REG_SIGLE
                        : `${pieRegieData?.labels?.length || 0} régie${
                            (pieRegieData?.labels?.length || 0) > 1 ? "s" : ""
                          }`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 h-[380px] dark:text-gray-200">
                {pieRegieData && (
                  <Pie
                    data={pieRegieData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            boxWidth: 10,
                            padding: 10,
                            font: { size: 10 },
                            color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
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
                                  const percent = total
                                    ? ((value / total) * 100).toFixed(1)
                                    : "0.0";

                                  const formattedValue = value.toLocaleString('fr-FR');

                                  labels.push({
                                    text: `${regie} – ${dataset.label} : ${formattedValue} F CFA (${percent}%)`,
                                    fillStyle: dataset.backgroundColor[i],
                                    strokeStyle: document.documentElement.classList.contains('dark') ? '#1f2937' : "#fff",
                                    lineWidth: 1,
                                    hidden: false,
                                    datasetIndex: 0,
                                    index: i,
                                  });
                                });
                              });

                              return labels;
                            },
                          },
                        },
                        tooltip: {
                          backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : 'rgba(17, 24, 39, 0.9)',
                          titleColor: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#fff',
                          bodyColor: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#fff',
                          callbacks: {
                            label: (context) => {
                              const value = context.raw as number;
                              const formattedValue = value.toLocaleString('fr-FR');
                              const datasetLabel = context.dataset.label || '';
                              const regie = context.label || '';
                              
                              return `${regie} – ${datasetLabel} : ${formattedValue} F CFA`;
                            }
                          }
                        }
                      },
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* PIE – Paiements */}
          {hasChartData && (
            <div className="backdrop-blur-sm bg-sky-100 dark:bg-sky-950/20 rounded-2xl border border-white/20 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/30 hover:shadow-2xl transition-all duration-300">
              <div className="relative p-6 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                      <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        Situation des Paiements
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                        Montants virés et non virés
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 rounded-full blur-sm"></div>
                    <span className="relative px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      {user?.regie
                        ? user.regie.REG_SIGLE
                        : "Global"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 h-[380px] dark:text-gray-200">
                {chartData.datasets.length > 0 && (
                  <Pie
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            boxWidth: 10,
                            padding: 10,
                            font: { size: 10 },
                            color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
                            generateLabels: (chart) => {
                              const { data } = chart;
                              if (!data.labels) return [];
                              
                              return data.labels.map((label, i) => {
                                const value = data.datasets[0]?.data[i] as number || 0;
                                const formattedValue = value.toLocaleString('fr-FR');
                                const total = (data.datasets[0]?.data as number[]).reduce((a, b) => a + b, 0);
                                const percent = total ? ((value / total) * 100).toFixed(1) : "0.0";
                                
                                return {
                                  text: `${label}`,
                                  fillStyle: data.datasets[0]?.backgroundColor[i],
                                  strokeStyle: document.documentElement.classList.contains('dark') ? '#1f2937' : "#fff",
                                  lineWidth: 1,
                                  hidden: false,
                                  index: i,
                                };
                              });
                            },
                          },
                        },
                        tooltip: {
                          backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : 'rgba(17, 24, 39, 0.9)',
                          titleColor: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#fff',
                          bodyColor: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#fff',
                          callbacks: {
                            label: (context) => {
                              const value = context.raw as number;
                              const formattedValue = value.toLocaleString('fr-FR');
                              return `${context.label}`;
                            }
                          }
                        }
                      },
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}