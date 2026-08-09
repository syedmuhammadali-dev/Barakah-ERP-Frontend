"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Database, Table2, Upload, X, FileSpreadsheet, Save, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { readWorkbookFile, downloadSheetsAsExcel } from "@/lib/export-data";
import { useAppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type SheetData = Record<string, Record<string, unknown>[]>;

/**
 * A pgAdmin-style, editable browser for an exported .xlsx file. Everything
 * lives in this component's state only — nothing is uploaded to a server,
 * nothing is written to localStorage/sessionStorage/a database. Navigating
 * away or reloading the page discards it; this is by design, not a bug.
 *
 * Edits are only ever saved back into a downloaded file, never anywhere
 * else — browsers don't allow a page to silently trigger a download when
 * its tab closes, so we ask for one explicit click ("Save Updated File")
 * instead, and warn on tab-close/navigation if there are unsaved edits.
 */
export function DataViewer() {
  const { t } = useAppLocale();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sheets, setSheets] = useState<SheetData | null>(null);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; column: string } | null>(null);

  const columns = useMemo(() => {
    if (!sheets || !activeSheet) return [];
    const rows = sheets[activeSheet] ?? [];
    const keys = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) keys.add(key);
    }
    return Array.from(keys);
  }, [sheets, activeSheet]);

  const activeRows = activeSheet ? sheets?.[activeSheet] ?? [] : [];

  // Native browser warning if the user tries to close/reload/navigate away
  // with unsaved edits — the only part of "warn before losing edits" a
  // browser will actually let a page do.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsLoading(true);
    try {
      const parsed = await readWorkbookFile(file);
      const sheetNames = Object.keys(parsed);
      if (sheetNames.length === 0) {
        throw new Error(t("dataViewer.emptyFileError"));
      }
      setSheets(parsed);
      setActiveSheet(sheetNames[0]);
      setFileName(file.name);
      setIsDirty(false);
    } catch (error) {
      toast({
        title: t("dataViewer.loadFailed"),
        description: getApiErrorMessage(error, t("dataViewer.loadFailedDescription")),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    if (isDirty && !window.confirm(t("dataViewer.discardConfirm"))) {
      return;
    }
    setSheets(null);
    setActiveSheet(null);
    setFileName(null);
    setEditingCell(null);
    setIsDirty(false);
  };

  const commitCellEdit = (rowIndex: number, column: string, value: string) => {
    if (!sheets || !activeSheet) return;
    setSheets((prev) => {
      if (!prev) return prev;
      const rows = [...(prev[activeSheet] ?? [])];
      rows[rowIndex] = { ...rows[rowIndex], [column]: value };
      return { ...prev, [activeSheet]: rows };
    });
    setIsDirty(true);
    setEditingCell(null);
  };

  const handleSaveUpdatedFile = () => {
    if (!sheets) return;
    const baseName = fileName?.replace(/\.xlsx?$/i, "") || "barakah-data";
    downloadSheetsAsExcel(sheets, `${baseName}-updated.xlsx`);
    setIsDirty(false);
    toast({ title: t("dataViewer.saveSuccess") });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="w-7 h-7 text-primary" /> {t("dataViewer.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("dataViewer.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <Upload className="w-4 h-4 mr-2" />
            {isLoading ? t("dataViewer.loading") : t("dataViewer.uploadButton")}
          </Button>
          {sheets ? (
            <>
              <Button type="button" variant={isDirty ? "default" : "outline"} onClick={handleSaveUpdatedFile}>
                <Save className="w-4 h-4 mr-2" />
                {isDirty ? t("dataViewer.saveButtonDirty") : t("dataViewer.saveButton")}
              </Button>
              <Button type="button" variant="outline" onClick={clearData}>
                <X className="w-4 h-4 mr-2" /> {t("dataViewer.clearButton")}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {!sheets ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-3">
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground" />
            <p className="font-medium">{t("dataViewer.emptyTitle")}</p>
            <p className="text-sm text-muted-foreground max-w-md">{t("dataViewer.emptyHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          <Card className="md:h-[calc(100vh-16rem)]">
            <div className="px-4 py-3 border-b border-border/50">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{fileName}</p>
              <p className="text-sm font-medium">{t("dataViewer.tables")}</p>
            </div>
            <ScrollArea className="h-[calc(100%-3.5rem)]">
              <div className="p-2 space-y-1">
                {Object.entries(sheets).map(([name, rows]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setActiveSheet(name)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors",
                      activeSheet === name ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Table2 className="w-4 h-4 shrink-0" /> {name}
                    </span>
                    <span className="text-xs opacity-70">{rows.length}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <Card className="md:h-[calc(100vh-16rem)] flex flex-col">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <p className="font-medium flex items-center gap-2">
                {activeSheet}
                {isDirty ? <span className="text-xs text-primary">{t("dataViewer.unsavedBadge")}</span> : null}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("dataViewer.rowCount").replace("{count}", String(activeRows.length))}
              </p>
            </div>
            <ScrollArea className="flex-1">
              {activeRows.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">{t("dataViewer.noRows")}</p>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0">
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column} className="whitespace-nowrap">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columns.map((column) => {
                          const isEditing =
                            editingCell?.row === rowIndex && editingCell?.column === column;
                          return (
                            <TableCell
                              key={column}
                              className="whitespace-nowrap text-sm cursor-text group"
                              onClick={() => !isEditing && setEditingCell({ row: rowIndex, column })}
                            >
                              {isEditing ? (
                                <Input
                                  autoFocus
                                  defaultValue={String(row[column] ?? "")}
                                  className="h-7 px-1 py-0"
                                  onBlur={(event) => commitCellEdit(rowIndex, column, event.target.value)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      commitCellEdit(rowIndex, column, event.currentTarget.value);
                                    } else if (event.key === "Escape") {
                                      setEditingCell(null);
                                    }
                                  }}
                                />
                              ) : (
                                <span className="inline-flex items-center gap-1.5">
                                  {String(row[column] ?? "")}
                                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40" />
                                </span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </Card>
        </div>
      )}
    </div>
  );
}
