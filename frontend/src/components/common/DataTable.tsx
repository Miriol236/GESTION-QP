import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  Search, Plus, Power, Edit, Trash2, Eye, Tags, Check,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ChevronUp, ChevronDown, ArrowUpDown, Printer, Filter, PowerOff, Send,
  CheckCheck, X,
  ZapIcon,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiFilterSelect } from "@/components/ui/MultiFilterSelect";

type SortDirection = "asc" | "desc";

export interface Column {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface DataTableProps {
  title?: string;
  columns: Column[];
  data: any[];
  searchable?: boolean;
  searchPlaceholder?: string;
  onAdd?: () => void;
  onGenerate?: () => void;
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
  onValidateVirement?: (rows: any[]) => void;
  onValidate?: (rows: any[]) => void;
  onValidate2?: (rows: any[]) => void;
  onRejet?: (rows: any[]) => void;
  onStatusUpdate?: (rows: any[]) => void;
  onViews?: (rows: any[]) => void;
  loading?: boolean;
  addButtonText?: string;
  addButtonTextGenerate?: string;
  filterItems?: any[];
  filterItems2?: any[];
  filterItems3?: any[];
  filterItems4?: any[];
  filterDisplay?: (item: any) => string;
  filterDisplay2?: (item: any) => string;
  filterDisplay3?: (item: any) => string;
  filterDisplay4?: (item: any) => string;
  onFilterSelect?: (item: any | null) => void;
  onFilterSelect2?: (item: any | null) => void;
  onFilterSelect3?: (item: any | null) => void;
  onFilterSelect4?: (item: any | null) => void;
  filterPlaceholder?: string;
  filterPlaceholder2?: string;
  filterPlaceholder3?: string;
  filterPlaceholder4?: string;
  appliedFilter?: React.ReactNode;
  rowKey?: string;
  rowKey2?: string;
  rowKey3?: string;
  rowKey4?: string;
}

export function DataTable({
  title,
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Rechercher...",
  onAdd,
  onGenerate,
  onDeleteAll,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  onStatut,
  onManageRoles,
  onPrint,
  onSearchChange,
  onValidateVirement,
  onValidate,
  onValidate2,
  onRejet,
  onStatusUpdate,
  onViews,
  loading = false,
  addButtonText = "Ajouter",
  addButtonTextGenerate = "Générer",
  filterItems = [],
  filterItems2 = [],
  filterItems3 = [],
  filterItems4 = [],
  filterDisplay,
  filterDisplay2,
  filterDisplay3,
  filterDisplay4,
  onFilterSelect,
  onFilterSelect2,
  onFilterSelect3,
  onFilterSelect4,
  filterPlaceholder = "Filtrer...",
  filterPlaceholder2 = "Filtrer...",
  filterPlaceholder3 = "Filtrer...",
  filterPlaceholder4 = "Filtrer...",
  appliedFilter,
  rowKey,
  rowKey2,
  rowKey3,
  rowKey4,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState<any | null>(null);
  const [selectedFilter2, setSelectedFilter2] = React.useState<any | null>(null);
  const [selectedFilter3, setSelectedFilter3] = React.useState<any | null>(null);
  const [selectedFilter4, setSelectedFilter4] = React.useState<any | null>(null);

  const stableRowKey = React.useMemo(() => rowKey ?? (columns && columns.length > 0 ? columns[0].key : "id"), [rowKey, columns]);
  
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

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

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const maxPage = Math.ceil(sortedData.length / rowsPerPage);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage);
    } else if (currentPage > maxPage && maxPage === 0) {
      setCurrentPage(1);
    }
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, rowsPerPage]);

  const getSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground dark:text-gray-500 ml-1" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const toggleRowSelection = (row: any) => {
    const id = String(row?.[stableRowKey] ?? JSON.stringify(row));
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      return [...prev, id];
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedData.map((r) => String(r?.[stableRowKey] ?? JSON.stringify(r)));
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const isRowSelected = (row: any) => {
    const id = String(row?.[stableRowKey] ?? JSON.stringify(row));
    return selectedIds.includes(id);
  };

  const selectedRows = React.useMemo(() => {
    const setIds = new Set(selectedIds);
    return data.filter((r) => setIds.has(String(r?.[stableRowKey] ?? JSON.stringify(r))));
  }, [selectedIds, data, stableRowKey]);

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filterOpen2, setFilterOpen2] = React.useState(false);
  const [filterOpen3, setFilterOpen3] = React.useState(false);
  const [filterOpen4, setFilterOpen4] = React.useState(false);

  return (
    <Card className="bg-sky-100 dark:bg-sky-950/20 shadow-card dark:shadow-gray-900/30 hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          {title && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{title}</span>

              {appliedFilter && (
                <span className="flex items-center gap-1 text-xs font-medium text-black dark:text-gray-200 bg-sky-100 dark:bg-sky-900/50 px-2 py-0.5 rounded-full">
                  <Filter className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                  {appliedFilter}
                </span>
              )}

              {searchable && (
                <div className="relative ml-auto w-full sm:w-[18rem]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground dark:text-gray-500" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTerm(value);
                      onSearchChange?.(value);
                    }}
                    className="h-8 pl-8 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-4">         

            {onDeleteAll && selectedRows.length >= 2 && (
              <Button
                onClick={() => onDeleteAll(selectedRows)}
                variant="destructive"
                className="gap-2 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-100"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Supprimer ({selectedRows.length})</span>
              </Button>
            )}

            {onValidateVirement && selectedRows.length >= 1 && (
              <Button
                onClick={() => onValidateVirement(selectedRows)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Valider virement ({selectedRows.length})</span>
              </Button>
            )}

            {onValidate && selectedRows.length >= 1 && (
              <Button
                onClick={() => onValidate(selectedRows)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white sm:w-auto sm:px-3 sm:gap-1 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Soumettre ({selectedRows.length})</span>
              </Button>
            )}

            {onValidate2 && selectedRows.length >= 1 && (
              <Button
                onClick={() => onValidate2(selectedRows)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Approuver ({selectedRows.length})</span>
              </Button>
            )}

            {onRejet && selectedRows.length >= 1 && (
              <Button
                onClick={() => onRejet(selectedRows)}
                variant="destructive"
                className="gap-2 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-100"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Rejeter ({selectedRows.length})</span>
              </Button>
            )}

            {onStatusUpdate && selectedRows.length >= 1 && (
              <Button
                onClick={() => onStatusUpdate(selectedRows)}
                className="gap-2 bg-amber-400 hover:bg-amber-500 text-black dark:bg-amber-600 dark:hover:bg-amber-700 dark:text-white"
              >
                <Power className="h-4 w-4" />
                <span className="hidden sm:inline">Mettre à jour statut ({selectedRows.length})</span>
              </Button>
            )}

            {onViews && selectedRows.length === 1 && (
              <Button
                onClick={() => onViews(selectedRows)}
                className="gap-2 bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-700 dark:hover:bg-sky-800"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Voir détails</span>
              </Button>
            )}

            {onPrint && (
              <Button
                onClick={onPrint}
                variant="default"
                className="gap-2 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Exporter</span>
              </Button>
            )}

            {onAdd && (
              <Button
                onClick={onAdd}
                size="icon"
                variant="default"
                className="sm:w-auto sm:px-3 sm:gap-1 dark:bg-primary-700 dark:hover:bg-primary-800"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">
                  {addButtonText}
                </span>
              </Button>
            )}

            {onGenerate && (
              <Button
                onClick={onGenerate}
                size="icon"
                className="bg-sky-600 hover:bg-sky-700 text-white sm:w-auto sm:px-3 sm:gap-1 dark:bg-sky-700 dark:hover:bg-sky-800"
              >
                <ZapIcon className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">
                  {addButtonTextGenerate}
                </span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Mobile: cards view */}
          <div className="sm:hidden">
            {loading ? (
              <div className="p-4 text-center text-gray-600 dark:text-gray-400">Chargement...</div>
            ) : sortedData.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground dark:text-gray-500">Aucune donnée trouvée</div>
              ) : (
              <div
                className="flex flex-col gap-3 p-2 max-h-[60vh] overflow-y-auto touch-pan-y pb-4"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {paginatedData.map((row, index) => (
                  <div key={index} className={`p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 ${isRowSelected(row) ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`} onClick={() => toggleRowSelection(row)}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isRowSelected(row)}
                          onChange={(e) => { e.stopPropagation(); toggleRowSelection(row); }}
                          className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div>
                          {columns.map((col) => (
                            <div key={col.key} className="text-sm">
                              <div className="text-xs text-muted-foreground dark:text-gray-500">{col.title}</div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {onView && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onView(row); }} title="Détails" className="dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(row); }} title="Modifier" className="dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(row); }} title="Supprimer" className="text-destructive dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700">
                            <Trash2 className="h-4 w-4" />
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
          <div className="hidden sm:block max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-200/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md text-gray-800 dark:text-gray-200">
                <tr>
                  <th className="px-2 py-1">
                    <input
                      type="checkbox"
                      checked={
                        paginatedData.length > 0 && paginatedData.every((r) => isRowSelected(r))
                      }
                      onChange={toggleSelectAll}
                      className="dark:bg-gray-700 dark:border-gray-600"
                    />
                  </th>
                  {columns.map((column) => (
                    <th key={column.key} className="px-2 py-1 text-left text-[12px] font-semibold">
                      {column.sortable ? (
                        <Button
                          variant="ghost"
                          onClick={() => handleSort(column.key)}
                          className="p-0 h-auto font-semibold hover:bg-transparent dark:text-gray-300 dark:hover:text-white"
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
                    <th className="px-4 py-2 text-left text-[12px] font-semibold">ACTIONS</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                      className="text-center py-6 text-gray-600 dark:text-gray-400"
                    >
                      <div className="animate-pulse-glow">Chargement...</div>
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                      className="text-center py-6 text-muted-foreground dark:text-gray-500"
                    >
                      Aucune donnée trouvée
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr
                      key={index}
                      onClick={() => toggleRowSelection(row)}
                      className={`cursor-pointer border-t border-gray-200 dark:border-gray-700 transition-all ${
                        isRowSelected(row)
                          ? "bg-gray-400 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600"
                          : "odd:bg-gray-50 dark:odd:bg-gray-800/50 hover:bg-gray-400 dark:hover:bg-gray-700"
                      }`}
                    >
                      <td className="px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isRowSelected(row)}
                          onChange={() => toggleRowSelection(row)}
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </td>
                      {columns.map((column) => (
                        <td key={column.key} className="px-2 py-1 text-[12px] text-gray-800 dark:text-gray-300">
                          {column.render
                            ? column.render(row[column.key], row)
                            : row[column.key]}
                        </td>
                      ))}

                      {(onEdit || onDelete || onView || onToggleStatus || onManageRoles || onStatut) && (
                        <td className="px-2 py-1">
                          <div className="flex items-center gap-2">
                            {onView && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); onView(row) }}
                                className="h-8 w-8 p-0 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                                title="Détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); onEdit(row) }}
                                className="h-8 w-8 p-0 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); onDelete(row) }}
                                className="h-8 w-8 p-0 text-destructive dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {onToggleStatus && (
                              <Button
                                variant={row.UTI_STATUT ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => onToggleStatus(row)}
                                className="h-8 w-8 p-0 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                title={row.UTI_STATUT ? "Désactiver" : "Activer"}
                              >
                                {row.UTI_STATUT ? (
                                  <PowerOff className="h-4 w-4 text-red-500 dark:text-red-400" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
                                )}
                              </Button>
                            )}
                            {onManageRoles && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onManageRoles(row)}
                                className="h-8 px-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-gray-700 flex items-center gap-1"
                              >
                                <Tags className="h-4 w-4" />
                                <span className="text-sm hidden sm:inline lg:inline">Gérer les droits</span>
                              </Button>
                            )}
                            {onStatut && (
                              <Button
                                variant={row.ECH_STATUT ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => onStatut(row)}
                                className="h-8 w-8 p-0 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                title={row.ECH_STATUT ? "Désactiver" : "Activer"}
                              >
                                {row.ECH_STATUT ? (
                                  <PowerOff className="h-4 w-4 text-red-500 dark:text-red-400" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
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
            
            {/* Pagination */}
            <div className="flex items-center justify-between mb-4 px-2 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-muted-foreground dark:text-gray-500">
                Page {currentPage} sur {Math.ceil(sortedData.length / rowsPerPage) || 1}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground dark:text-gray-500">Lignes :</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
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

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="Première page"
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  title="Page précédente"
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
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
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
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
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
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