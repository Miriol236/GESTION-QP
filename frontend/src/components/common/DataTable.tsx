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
import { Search, Plus, Edit, Trash2, Eye, Tags } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  return (
    <Card className="shadow-card hover-lift">
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
              <Button onClick={onAdd} variant="premium" className="gap-2">
                <Plus className="h-4 w-4" />
                {addButtonText}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((column) => (
                  <TableHead key={column.key} className="font-semibold">
                    {column.title}
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
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Aucune donnée trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row, index) => (
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
    </Card>
  );
}