import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, CreditCard, TrendingUp } from "lucide-react";

// const stats = [
//   {
//     title: "Total Bénéficiaires",
//     value: "1,234",
//     description: "+12% ce mois",
//     icon: Users,
//     color: "text-primary",
//     bgColor: "bg-primary-light",
//   },
//   {
//     title: "Montant Total Payé",
//     value: "45.2M DA",
//     description: "+8% ce mois",
//     icon: DollarSign,
//     color: "text-green-600",
//     bgColor: "bg-green-50",
//   },
//   {
//     title: "Paiements en cours",
//     value: "156",
//     description: "En attente de validation",
//     icon: CreditCard,
//     color: "text-orange-600",
//     bgColor: "bg-orange-50",
//   },
//   {
//     title: "Taux de traitement",
//     value: "94.5%",
//     description: "+2.3% ce mois",
//     icon: TrendingUp,
//     color: "text-blue-600",
//     bgColor: "bg-blue-50",
//   },
// ];

// const recentPayments = [
//   { id: 1, beneficiary: "Ahmed Bensalem", amount: "45,000 DA", status: "Validé", date: "12/10/2025" },
//   { id: 2, beneficiary: "Fatima Zahra", amount: "38,500 DA", status: "En attente", date: "12/10/2025" },
//   { id: 3, beneficiary: "Mohammed Karim", amount: "42,000 DA", status: "Validé", date: "11/10/2025" },
//   { id: 4, beneficiary: "Amina Larbi", amount: "39,800 DA", status: "Validé", date: "11/10/2025" },
//   { id: 5, beneficiary: "Yacine Meziane", amount: "41,200 DA", status: "Rejeté", date: "10/10/2025" },
// ];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble du système de gestion des quotes-parts
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
          <CardDescription>
            Cette page sera bientôt disponible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Le module est en cours de développement.
          </p>
        </CardContent>
      </Card>
    </div>
  );



  // return (
  //   <div className="space-y-6">
  //     {/* En-tête */}
  //     <div>
  //       <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
  //       <p className="text-muted-foreground mt-1">
  //         Vue d'ensemble du système de gestion des quotes-parts
  //       </p>
  //     </div>

  //     {/* Statistiques */}
  //     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  //       {stats.map((stat) => {
  //         const Icon = stat.icon;
  //         return (
  //           <Card key={stat.title} className="hover:shadow-md transition-shadow">
  //             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //               <CardTitle className="text-sm font-medium">
  //                 {stat.title}
  //               </CardTitle>
  //               <div className={`${stat.bgColor} p-2 rounded-lg`}>
  //                 <Icon className={`h-4 w-4 ${stat.color}`} />
  //               </div>
  //             </CardHeader>
  //             <CardContent>
  //               <div className="text-2xl font-bold">{stat.value}</div>
  //               <p className="text-xs text-muted-foreground mt-1">
  //                 {stat.description}
  //               </p>
  //             </CardContent>
  //           </Card>
  //         );
  //       })}
  //     </div>

  //     {/* Paiements récents */}
  //     <div className="grid gap-4 md:grid-cols-2">
  //       <Card className="md:col-span-2">
  //         <CardHeader>
  //           <CardTitle>Paiements récents</CardTitle>
  //           <CardDescription>
  //             Les 5 derniers paiements effectués
  //           </CardDescription>
  //         </CardHeader>
  //         <CardContent>
  //           <div className="space-y-4">
  //             {recentPayments.map((payment) => (
  //               <div
  //                 key={payment.id}
  //                 className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
  //               >
  //                 <div className="flex-1">
  //                   <p className="font-medium text-foreground">{payment.beneficiary}</p>
  //                   <p className="text-sm text-muted-foreground">{payment.date}</p>
  //                 </div>
  //                 <div className="text-right">
  //                   <p className="font-semibold text-foreground">{payment.amount}</p>
  //                   <span
  //                     className={`text-xs px-2 py-1 rounded-full ${
  //                       payment.status === "Validé"
  //                         ? "bg-green-100 text-green-700"
  //                         : payment.status === "En attente"
  //                         ? "bg-orange-100 text-orange-700"
  //                         : "bg-red-100 text-red-700"
  //                     }`}
  //                   >
  //                     {payment.status}
  //                   </span>
  //                 </div>
  //               </div>
  //             ))}
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   </div>
  // );
}
