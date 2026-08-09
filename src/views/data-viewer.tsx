"use client";

import { useMemo, useRef, useState } from "react";
import { Database, Table2, Upload, X, FileSpreadsheet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { readWorkbookFile } from "@/lib/export-data";
import { useAppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type SheetData = Record<string, Record<string, unknown>[]>;

/**
 * A pgAdmin-style browser for an exported .xlsx file. Everything lives in
 * this component's state only — nothing is uploaded to a server, nothing
 * is written to localStorage/sessionStorage/a database. Navigating away or
 * reloading the page discards it; this is by design, not a bug.
 */
export function DataViewer() {
  const { t } = useAppLocale();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sheets, setSheets] = useState<SheetData | null>(null);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setSheets(null);
    setActiveSheet(null);
    setFileName(null);
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
            <Button type="button" variant="outline" onClick={clearData}>
              <X className="w-4 h-4 mr-2" /> {t("dataViewer.clearButton")}
            </Button>
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
              <p className="font-medium">{activeSheet}</p>
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
                    {activeRows.map((row, index) => (
                      <TableRow key={index}>
                        {columns.map((column) => (
                          <TableCell key={column} className="whitespace-nowrap text-sm">
                            {String(row[column] ?? "")}
                          </TableCell>
                        ))}
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
