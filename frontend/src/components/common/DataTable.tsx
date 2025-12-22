import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  Search, Plus, Power, Edit, Trash2, Eye, Tags, Check,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ChevronUp, ChevronDown, ArrowUpDown, Printer, Filter, PowerOff // Ajouté ArrowUpDown pour l'icône de tri
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
  onDeleteAll?: (rows: any[]) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  onToggleStatus?: (row: any) => void;
  onStatut?: (row: any) => void;
  onManageRoles?: (row: any) => void;
  onPrint?: () => void;
  onSearchChange?: (value: string) => void;
  onSearchChange2?: (value: string) => void;
  onSearchChange3?: (value: string) => void;
  // Callback when the user validates virement for selected rows (receives selected rows)
  onValidateVirement?: (rows: any[]) => void;
  // Callback when the user requests a status update for selected rows (receives selected rows)
  onStatusUpdate?: (rows: any[]) => void;
  // Callback to view selected rows in bulk
  onViews?: (rows: any[]) => void;
  loading?: boolean;
  addButtonText?: string;
  // Optional filter items to show a small combo next to title
  filterItems?: any[];
  filterItems2?: any[];
  filterItems3?: any[];
  // Optional function to get a display string for an item
  filterDisplay?: (item: any) => string;
  filterDisplay2?: (item: any) => string;
  filterDisplay3?: (item: any) => string;
  // Called when an item is selected (or null when cleared)
  onFilterSelect?: (item: any | null) => void;
  onFilterSelect2?: (item: any | null) => void;
  onFilterSelect3?: (item: any | null) => void;
  // placeholder label for the filter combo
  filterPlaceholder?: string;
  filterPlaceholder2?: string;
  filterPlaceholder3?: string;
  // Key to use as stable row id for selection (defaults to first column key)
  rowKey?: string;
  rowKey2?: string;
  rowKey3?: string;
}

export function DataTable({
  title,
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Rechercher...",
  onAdd,
  onDeleteAll,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  onStatut,
  onManageRoles,
  onPrint,
  onSearchChange,
  onSearchChange2,
  onSearchChange3,
  onValidateVirement,
  onStatusUpdate,
  onViews,
  loading = false,
  addButtonText = "Ajouter",
  filterItems = [],
  filterItems2 = [],
  filterItems3 = [],
  filterDisplay,
  filterDisplay2,
  filterDisplay3,
  onFilterSelect,
  onFilterSelect2,
  onFilterSelect3,
  filterPlaceholder = "Filtrer...",
  filterPlaceholder2 = "Filtrer...",
  filterPlaceholder3 = "Filtrer...",
  rowKey,
  rowKey2,
  rowKey3,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState<any | null>(null);
  const [selectedFilter2, setSelectedFilter2] = React.useState<any | null>(null);
  const [selectedFilter3, setSelectedFilter3] = React.useState<any | null>(null);

  // stable key used to identify rows
  const stableRowKey = React.useMemo(() => rowKey ?? (columns && columns.length > 0 ? columns[0].key : "id"), [rowKey, columns]);
  
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
  const [rowsPerPage, setRowsPerPage] = React.useState(50);

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

  // Selected ids (strings) to track selection reliably across renders
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Fonction pour cocher/décocher une ligne (utilise stableRowKey)
  const toggleRowSelection = (row: any) => {
    const id = String(row?.[stableRowKey] ?? JSON.stringify(row));
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      return [...prev, id];
    });
  };

  // Tout sélectionner / désélectionner sur la page courante
  const toggleSelectAll = () => {
    const pageIds = paginatedData.map((r) => String(r?.[stableRowKey] ?? JSON.stringify(r)));
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      // remove page ids
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      // add missing page ids
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Vérifie si une ligne est sélectionnée
  const isRowSelected = (row: any) => {
    const id = String(row?.[stableRowKey] ?? JSON.stringify(row));
    return selectedIds.includes(id);
  };

  // Derived selected rows (full objects) from the full data set
  const selectedRows = React.useMemo(() => {
    const setIds = new Set(selectedIds);
    return data.filter((r) => setIds.has(String(r?.[stableRowKey] ?? JSON.stringify(r))));
  }, [selectedIds, data, stableRowKey]);

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filterOpen2, setFilterOpen2] = React.useState(false);
  const [filterOpen3, setFilterOpen3] = React.useState(false);

  return (
    <Card className="shadow-card hover-lift">
      {/* CardHeader (inchangé) */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          {title && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <CardTitle className="text-lg font-semibold text-foreground">
                {title}
              </CardTitle>

              {/* Pour Échéances */}
              {filterItems && filterItems.length > 0 && (
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 py-1 w-full sm:w-auto flex justify-between"
                    >
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 text-xs font-medium">
                        Filtre :
                      </span>
                      {selectedFilter
                        ? filterDisplay
                          ? filterDisplay(selectedFilter)
                          : String(selectedFilter)
                        : filterPlaceholder}
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
                              setSelectedFilter(null);
                              onFilterSelect?.(null);
                              setFilterOpen(false);
                            }}
                            className="whitespace-nowrap"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${selectedFilter === null ? "opacity-100 text-blue-600" : "opacity-0"}`}
                            />
                            Par défaut
                          </CommandItem>

                          {filterItems.map((it: any, idx: number) => {
                            const isSelected = JSON.stringify(selectedFilter) === JSON.stringify(it);
                            return (
                              <CommandItem
                                key={idx}
                                onSelect={() => {
                                  setSelectedFilter(it);
                                  onFilterSelect?.(it);
                                  setFilterOpen(false);
                                }}
                                className="whitespace-nowrap"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100 text-blue-600" : "opacity-0"}`}
                                />
                                {filterDisplay ? filterDisplay(it) : String(it)}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}

              {/* Pour régies */}
              {filterItems2 && filterItems2.length > 0 && (
                <Popover open={filterOpen2} onOpenChange={setFilterOpen2}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 py-1 w-full sm:w-auto flex justify-between"
                    >
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 text-xs font-medium">
                        Filtre :
                      </span>
                      {selectedFilter2
                        ? filterDisplay2
                          ? filterDisplay2(selectedFilter2)
                          : String(selectedFilter2)
                        : filterPlaceholder2}
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
                              setSelectedFilter2(null);
                              onFilterSelect2?.(null);
                              setFilterOpen2(false);
                            }}
                            className="whitespace-nowrap"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${selectedFilter2 === null ? "opacity-100 text-blue-600" : "opacity-0"}`}
                            />
                            Par défaut
                          </CommandItem>

                          {filterItems2.map((it: any, idx: number) => {
                            const isSelected = JSON.stringify(selectedFilter2) === JSON.stringify(it);
                            return (
                              <CommandItem
                                key={idx}
                                onSelect={() => {
                                  setSelectedFilter2(it);
                                  onFilterSelect2?.(it);
                                  setFilterOpen2(false);
                                }}
                                className="whitespace-nowrap"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100 text-blue-600" : "opacity-0"}`}
                                />
                                {filterDisplay2 ? filterDisplay2(it) : String(it)}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}

              {/* Pour statut */}
              {filterItems3 && filterItems3.length > 0 && (
                <Popover open={filterOpen3} onOpenChange={setFilterOpen3}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 py-1 w-full sm:w-auto flex justify-between"
                    >
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 text-xs font-medium">
                        Filtre :
                      </span>
                      {selectedFilter3
                        ? filterDisplay3
                          ? filterDisplay3(selectedFilter3)
                          : String(selectedFilter3)
                        : filterPlaceholder3}
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
                              setSelectedFilter3(null);
                              onFilterSelect3?.(null);
                              setFilterOpen3(false);
                            }}
                            className="whitespace-nowrap"
                          >
                          </CommandItem>

                          {filterItems3.map((it: any, idx: number) => {
                            const isSelected = JSON.stringify(selectedFilter3) === JSON.stringify(it);
                            return (
                              <CommandItem
                                key={idx}
                                onSelect={() => {
                                  setSelectedFilter3(it);
                                  onFilterSelect3?.(it);
                                  setFilterOpen3(false);
                                }}
                                className="whitespace-nowrap"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100 text-blue-600" : "opacity-0"}`}
                                />
                                {filterDisplay3 ? filterDisplay3(it) : String(it)}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {searchable && (
                <div className="relative ml-auto w-full sm:w-[25rem]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTerm(value);
                      onSearchChange?.(value);
                    }}
                    className="pl-10 w-full"
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-4">         

            {/*  Bouton "Supprimer la sélection" */}
            {onDeleteAll && selectedRows.length >= 2 && (
              <Button
                onClick={() => onDeleteAll(selectedRows)}
                variant="destructive"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Supprimer ({selectedRows.length})</span>
              </Button>
            )}

            {/*  Bouton "Valider virement" (vert) — visible si au moins une ligne sélectionnée */}
            {onValidateVirement && selectedRows.length >= 1 && (
              <Button
                onClick={() => onValidateVirement(selectedRows)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Valider virement ({selectedRows.length})</span>
              </Button>
            )}

            {/*  Bouton "Mettre à jour statut" (jaune) — visible si au moins une ligne sélectionnée */}
            {onStatusUpdate && selectedRows.length >= 1 && (
              <Button
                onClick={() => onStatusUpdate(selectedRows)}
                className="gap-2 bg-amber-400 hover:bg-amber-500 text-black"
              >
                <Power className="h-4 w-4" />
                <span className="hidden sm:inline">Mettre à jour statut ({selectedRows.length})</span>
              </Button>
            )}

            {/*  Bouton "Voir sélection" (bleu) — visible seulement si exactement 1 ligne sélectionnée */}
            {onViews && selectedRows.length === 1 && (
              <Button
                onClick={() => onViews(selectedRows)}
                className="gap-2 bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Voir détails</span>
              </Button>
            )}

            {/*  Bouton "Imprimer" */}
            {onPrint && (
              <Button
                onClick={onPrint}
                variant="secondary"
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimer</span>
              </Button>
            )}

            {onAdd && (
              <Button onClick={onAdd} variant="default" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{addButtonText}</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>

        {/* Tableau principal */}
        <div className="rounded-md border overflow-hidden">
          {/* Mobile: cards view */}
          <div className="sm:hidden">
            {loading ? (
              <div className="p-4 text-center">Chargement...</div>
            ) : sortedData.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">Aucune donnée trouvée</div>
              ) : (
              <div
                className="flex flex-col gap-3 p-2 max-h-[60vh] overflow-y-auto touch-pan-y pb-4"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {paginatedData.map((row, index) => (
                  <div key={index} className={`p-3 bg-white rounded-md border ${isRowSelected(row) ? 'ring-2 ring-blue-200' : ''}`} onClick={() => toggleRowSelection(row)}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isRowSelected(row)}
                          onChange={(e) => { e.stopPropagation(); toggleRowSelection(row); }}
                          className="mt-1"
                        />
                        <div>
                          {columns.map((col) => (
                            <div key={col.key} className="text-sm">
                              <div className="text-xs text-muted-foreground">{col.title}</div>
                              <div className="font-medium">{col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {onView && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onView(row); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(row); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(row); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop / tablet: table view */}
          <div className="hidden sm:block max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-200/90 backdrop-blur-sm shadow-md text-gray-800">
                <tr>
                  <th className="px-4 py-0">
                    <input
                      type="checkbox"
                      checked={
                        paginatedData.length > 0 && paginatedData.every((r) => isRowSelected(r))
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-2 text-left text-sm font-semibold">
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
                        column.title
                      )}
                    </th>
                  ))}
                  {(onEdit || onDelete || onView || onToggleStatus || onManageRoles || onStatut) && (
                    <th className="px-4 py-2 text-left text-sm font-semibold">ACTIONS</th>
                  )}
                </tr>
              </thead>

              <tbody>
                { /* Desktop table rows */ }
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                      className="text-center py-6"
                    >
                      <div className="animate-pulse-glow">Chargement...</div>
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucune donnée trouvée
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr
                      key={index}
                      onClick={() => toggleRowSelection(row)}
                      className={`cursor-pointer border-t transition-all ${
                        isRowSelected(row)
                          ? "bg-blue-50 hover:bg-blue-50"
                          : "odd:bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isRowSelected(row)}
                          onChange={() => toggleRowSelection(row)}
                        />
                      </td>
                      {columns.map((column) => (
                        <td key={column.key} className="px-3 py-2 text-sm">
                          {column.render
                            ? column.render(row[column.key], row)
                            : row[column.key]}
                        </td>
                      ))}

                      {(onEdit || onDelete || onView || onToggleStatus || onManageRoles || onStatut) && (
                        <td className="px-3 py-2">
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
                                variant={row.UTI_STATUT ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => onToggleStatus(row)}
                                className="h-8 w-8 p-0"
                                title={row.UTI_STATUT ? "Désactiver" : "Activer"}
                              >
                                {row.UTI_STATUT ? (
                                  <PowerOff className="h-4 w-4 text-red-500" />  // icône pour désactiver
                                ) : (
                                  <Power className="h-4 w-4 text-green-600" /> // icône pour activer
                                )}
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
                                {/* Le texte est caché sur mobile, visible à partir de lg */}
                                <span className="text-sm hidden sm:inline lg:inline">Gérer les droits</span>
                              </Button>
                            )}
                            {/* Activer/Désactiver */}
                            {onStatut && (
                              <Button
                                variant={row.ECH_STATUT ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => onStatut(row)}
                                className="h-8 w-8 p-0"
                                title={row.ECH_STATUT ? "Désactiver" : "Activer"}
                              >
                                {row.ECH_STATUT ? (
                                  <PowerOff className="h-4 w-4 text-red-500" />  // icône pour désactiver
                                ) : (
                                  <Power className="h-4 w-4 text-green-600" />  // icône pour activer
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                  <option value={30}>30</option>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                  <option value={60}>60</option>
                  <option value={70}>70</option>
                  <option value={80}>80</option>
                  <option value={90}>90</option>
                  <option value={100}>100</option>
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
          </div>
        </div>
      </CardContent>      
    </Card>
  );
}