"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAppLocale } from "@/lib/i18n";

type NotePage = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

export function Notes() {
  const { t } = useAppLocale();
  const { toast } = useToast();
  const [pages, setPages] = useState<NotePage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiRequest<NotePage[]>("/api/notes")
      .then(async (savedPages) => {
        if (cancelled) return;
        if (savedPages.length > 0) {
          setPages(savedPages);
          setActiveId(savedPages[0].id);
          return;
        }
        const firstPage = await apiRequest<NotePage>("/api/notes", {
          method: "POST",
          body: JSON.stringify({ title: "Untitled page", content: "" }),
        });
        if (!cancelled) {
          setPages([firstPage]);
          setActiveId(firstPage.id);
        }
      })
      .catch(() => {
        if (!cancelled) toast({ title: t("notes.loadFailed"), description: t("notes.tryAgain"), variant: "destructive" });
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => { cancelled = true; };
  }, [t, toast]);

  const activePage = pages.find((page) => page.id === activeId) ?? null;

  const updateActivePage = (updates: Partial<NotePage>) => {
    if (!activeId) return;
    setPages((current) => current.map((page) => (
      page.id === activeId
        ? { ...page, ...updates, updatedAt: new Date().toISOString() }
        : page
    )));
    setIsDirty(true);
  };

  const handleNewPage = async () => {
    try {
      const page = await apiRequest<NotePage>("/api/notes", {
        method: "POST",
        body: JSON.stringify({ title: `${t("notes.page")} ${pages.length + 1}`, content: "" }),
      });
      setPages((current) => [page, ...current]);
      setActiveId(page.id);
      setIsDirty(false);
    } catch (error) {
      toast({ title: t("notes.saveFailed"), description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  const handleDeletePage = async () => {
    if (!activePage || pages.length === 1) return;
    try {
      await apiRequest(`/api/notes/${activePage.id}`, { method: "DELETE" });
      const nextPages = pages.filter((page) => page.id !== activePage.id);
      setPages(nextPages);
      setActiveId(nextPages[0].id);
      setIsDirty(false);
    } catch (error) {
      toast({ title: t("notes.deleteFailed"), description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!activePage || !isDirty || isSaving) return;
    setIsSaving(true);
    try {
      const savedPage = await apiRequest<NotePage>(`/api/notes/${activePage.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: activePage.title.trim() || t("notes.untitled"), content: activePage.content }),
      });
      setPages((current) => current.map((page) => page.id === savedPage.id ? savedPage : page));
      setIsDirty(false);
      toast({ title: t("notes.saved"), description: t("notes.savedDescription") });
    } catch (error) {
      toast({ title: t("notes.saveFailed"), description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("notes.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("notes.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void handleNewPage()}>
            <Plus className="mr-2 h-4 w-4" />{t("notes.newPage")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={!isReady || !isDirty || isSaving}>
            <Save className="mr-2 h-4 w-4" />{isSaving ? t("notes.saving") : t("notes.save")}
          </Button>
        </div>
      </div>

      <div className="grid min-h-[560px] overflow-hidden rounded-xl border border-border bg-card md:grid-cols-[220px_1fr]">
        <aside className="border-b border-border bg-muted/30 p-3 md:border-b-0 md:border-r">
          <div className="mb-3 flex items-center gap-2 px-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            {t("notes.pages")}
          </div>
          <div className="space-y-1">
            {pages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setActiveId(page.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${page.id === activeId ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              >
                <span className="block truncate">{page.title || t("notes.untitled")}</span>
                <span className={`mt-1 block text-xs ${page.id === activeId ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(page.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col p-5 md:p-8">
          {activePage ? (
            <>
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Input
                  value={activePage.title}
                  onChange={(event) => updateActivePage({ title: event.target.value })}
                  aria-label={t("notes.pageTitle")}
                  placeholder={t("notes.untitled")}
                  className="border-0 px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void handleDeletePage()}
                  disabled={pages.length === 1}
                  aria-label={t("notes.deletePage")}
                  title={t("notes.deletePage")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <textarea
                value={activePage.content}
                onChange={(event) => updateActivePage({ content: event.target.value })}
                placeholder={t("notes.placeholder")}
                aria-label={t("notes.content")}
                className="min-h-[430px] flex-1 resize-none border-0 bg-transparent pt-6 text-base leading-7 outline-none placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                {isDirty ? t("notes.unsaved") : t("notes.allSaved")}
              </p>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
