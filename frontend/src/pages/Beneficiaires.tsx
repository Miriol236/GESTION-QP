import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";

const mockBeneficiaires = [
  { id: 1, code: "BEN001", nom: "Bensalem", prenom: "Ahmed", fonction: "Ingénieur", grade: "A", statut: "Actif", rib: "00799999123456789012" },
  { id: 2, code: "BEN002", nom: "Zahra", prenom: "Fatima", fonction: "Comptable", grade: "B", statut: "Actif", rib: "00799999234567890123" },
  { id: 3, code: "BEN003", nom: "Karim", prenom: "Mohammed", fonction: "Technicien", grade: "C", statut: "Actif", rib: "00799999345678901234" },
  { id: 4, code: "BEN004", nom: "Larbi", prenom: "Amina", fonction: "Secrétaire", grade: "D", statut: "Inactif", rib: "00799999456789012345" },
  { id: 5, code: "BEN005", nom: "Meziane", prenom: "Yacine", fonction: "Analyste", grade: "A", statut: "Actif", rib: "00799999567890123456" },
];

export default function Beneficiaires() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBeneficiaires = mockBeneficiaires.filter(
    (b) =>
      b.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bénéficiaires</h1>
          <p className="text-muted-foreground mt-1">
            Gestion des bénéficiaires des quotes-parts
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau bénéficiaire
        </Button>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des bénéficiaires</CardTitle>
          <CardDescription>
            {filteredBeneficiaires.length} bénéficiaire(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Fonction</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>RIB</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBeneficiaires.map((beneficiaire) => (
                  <TableRow key={beneficiaire.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{beneficiaire.code}</TableCell>
                    <TableCell>{beneficiaire.nom}</TableCell>
                    <TableCell>{beneficiaire.prenom}</TableCell>
                    <TableCell>{beneficiaire.fonction}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{beneficiaire.grade}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{beneficiaire.rib}</TableCell>
                    <TableCell>
                      <Badge
                        variant={beneficiaire.statut === "Actif" ? "default" : "secondary"}
                      >
                        {beneficiaire.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
