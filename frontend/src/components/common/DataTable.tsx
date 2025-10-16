import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Plus, Edit, Trash2, Eye, Tags, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ChevronUp, ChevronDown, ArrowUpDown // Ajouté ArrowUpDown pour l'icône de tri
} from "lucide-react"; // Import mis à jour
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Définition du type de direction de tri
type SortDirection = "asc" | "desc";

export interface Column {
  key: string;
  title: string;
  sortable?: boolean; // Utilisé pour activer/désactiver le tri
  render?: (value: any, row: any) => React.ReactNode;
}

export interface DataTableProps {
  // ... (DataTableProps reste inchangé)
  title?: string;
  columns: Column[];
  data: any[];
  searchable?: boolean;
  searchPlaceholder?: string;
  onAdd?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  onToggleStatus?: (row: any) => void;
  onManageRoles?: (row: any) => void;
  loading?: boolean;
  addButtonText?: string;
}

export function DataTable({
  title,
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Rechercher...",
  onAdd,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  onManageRoles,
  loading = false,
  addButtonText = "Ajouter",
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  
  // Nouveaux états pour la gestion du tri
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  // Logique de tri
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    // Remettre à la première page après un changement de tri
    setCurrentPage(1);
  };

  // 1. Filtrage (Recherche globale)
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // 2. Tri des données filtrées
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      // Gestion des valeurs nulles/indéfinies et conversion en chaîne pour comparaison
      const valA = String(aValue ?? "").toLowerCase();
      const valB = String(bValue ?? "").toLowerCase();

      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }

      return sortDirection === "desc" ? comparison * -1 : comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Calcul des données à afficher sur la page actuelle
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    // Ajustement de la page si les données triées/filtrées changent
    const maxPage = Math.ceil(sortedData.length / rowsPerPage);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage);
    } else if (currentPage > maxPage && maxPage === 0) {
      setCurrentPage(1);
    }
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, rowsPerPage]);


  // Fonction utilitaire pour choisir l'icône de tri
  const getSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground ml-1" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <Card className="shadow-card hover-lift">
      {/* CardHeader (inchangé) */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          {title && (
            <CardTitle className="text-xl font-semibold text-foreground">
              {title}
            </CardTitle>
          )}
          <div className="flex items-center gap-4">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            )}
            {onAdd && (
              <Button onClick={onAdd} variant="default" className="gap-2">
                <Plus className="h-4 w-4" />
                {addButtonText}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>

        {/* Tableau principal */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((column) => (
                  <TableHead key={column.key}>
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(column.key)}
                        className="p-0 h-auto font-semibold hover:bg-transparent"
                      >
                        {column.title}
                        {getSortIcon(column.key)}
                      </Button>
                    ) : (
                      <span className="font-semibold">{column.title}</span>
                    )}
                  </TableHead>
                ))}
                {(onEdit || onDelete || onView || onToggleStatus || onManageRoles) && (
                  <TableHead className="font-semibold">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                    className="text-center py-8"
                  >
                    <div className="animate-pulse-glow">Chargement...</div>
                  </TableCell>
                </TableRow>
              ) : sortedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Aucune donnée trouvée
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-muted/30 transition-smooth"
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]}
                      </TableCell>
                    ))}
                    {(onEdit || onDelete || onView || onToggleStatus || onManageRoles) && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(row)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(row)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(row)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {onToggleStatus && (
                            <Button
                              variant={row.UTI_STATUT ? "destructive" : "default"} // Rouge si actif
                              size="sm"
                              onClick={() => onToggleStatus(row)}
                              className="h-8 px-2"
                            >
                              {row.UTI_STATUT ? "Désactiver" : "Activer"}
                            </Button>
                          )}
                          {onManageRoles && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onManageRoles(row)}
                              className="h-8 px-2 text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Tags className="h-4 w-4" />
                              <span className="text-sm">Gérer les droits</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {/* Pagination (utilisant sortedData.length) */}
        <div className="flex items-center justify-between mb-4 px-2">
          {/* Indicateur de page */}
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {Math.ceil(sortedData.length / rowsPerPage) || 1}
          </p>

          {/* Sélecteur du nombre de lignes (inchangé) */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Lignes :</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          {/* Boutons de navigation (inchangés) */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="Première page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              title="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === Math.ceil(sortedData.length / rowsPerPage) || sortedData.length === 0}
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(sortedData.length / rowsPerPage))
                )
              }
              title="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === Math.ceil(sortedData.length / rowsPerPage) || sortedData.length === 0}
              onClick={() =>
                setCurrentPage(Math.ceil(sortedData.length / rowsPerPage))
              }
              title="Dernière page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
    </Card>
  );
}