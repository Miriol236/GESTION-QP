import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Filter, Check, ChevronDown, DollarSign, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from "@/config/api";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { useAuth } from "@/contexts/AuthContext";

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

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
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

  // Fetch statistiques
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
          title: "Montant Total Net à Payer",
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
          title: "Reste à virer",
          value: formatAmount(data.reste_a_payer),
          icon: CheckCheck,
          color: "text-red-600",
          bgColor: "bg-red-50",
          taux: formatPercent(data.taux_reste_a_payer),
        },
      ];

      setStats(newStats);

      // Pie Chart uniquement avec Net à Payer, Déjà Viré et Reste à Virer
      setChartData({
        labels: [
          `Net à Payer (${formatAmount(data.total_net)})`,
          `Déjà Viré (${formatPercent(data.taux_paiement)})`,
          `Reste à Virer (${formatPercent(data.taux_reste_a_payer)})`,
        ],
        datasets: [
          {
            data: [data.total_net, data.total_paye, data.reste_a_payer],
            backgroundColor: [
              "rgba(59,130,246,0.6)",  // bleu pour Net à payer
              "rgba(34,197,94,0.6)",   // vert pour déjà vire
              "rgba(239,68,68,0.6)",   // rouge pour reste à virer
            ],
            borderColor: [
              "rgba(59,130,246,1)",
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
    }
  };

  // Re-fetch stats à chaque filtre
  useEffect(() => {
    fetchTotals(selectedEcheance, selectedRegie);
  }, [selectedEcheance, selectedRegie]);

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
                className="px-2 py-1 flex justify-between w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 text-gray-500" />
                {selectedEcheance
                  ? echeances.find((e) => e.ECH_CODE === selectedEcheance)?.ECH_LIBELLE
                  : "Filtrer par Échéance"}
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
                        setSelectedEcheance(null);
                        setEcheanceOpen(false); // ferme le Popover
                      }}
                    >
                      <Check className={`${!selectedEcheance ? "opacity-100" : "opacity-0"} mr-2`} />
                      Afficher tout
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
                {selectedRegie
                  ? regies.find((r) => r.REG_CODE === selectedRegie)?.REG_SIGLE
                  : "Filtrer par Régie"}
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
                      Afficher tout
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

      {/* GRAPHIQUE */}
      <div className="grid gap-2 
                grid-cols-1 
                sm:grid-cols-2 
                md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        <Card className="h-[300px] sm:h-[400px] lg:h-[500px] mt-4">
          <CardHeader>
            <CardTitle>Statistiques financières</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-60px)] w-full flex items-center justify-center">
            {chartData.datasets.length > 0 && (
              <Pie
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                      labels: {
                        generateLabels: (chart) => {
                          const dataset = chart.data.datasets[0];
                          const data = dataset.data as number[]; // TypeScript
                          const total = data.reduce((sum, v) => sum + (v || 0), 0);

                          return chart.data.labels?.map((label, i) => {
                            const value = data[i] || 0;
                            return {
                              text: `${label}`,
                              fillStyle: Array.isArray(dataset.backgroundColor)
                                ? dataset.backgroundColor[i]
                                : (dataset.backgroundColor as string),
                              strokeStyle: Array.isArray(dataset.borderColor)
                                ? dataset.borderColor[i]
                                : (dataset.borderColor as string),
                              lineWidth: 1,
                              hidden: false,
                              index: i,
                            };
                          }) || [];
                        },
                      },
                    },
                    title: {
                      display: true,
                      text: "Répartition financière",
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