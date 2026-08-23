"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, Megaphone, X } from "lucide-react";
import { useAuth } from "@barakah/auth-web";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
}

const DISMISSED_KEY = "barakah-announcements-dismissed-v1";

function readDismissed(): string[] {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

const SEVERITY_STYLES: Record<Announcement["severity"], string> = {
  info: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const SEVERITY_ICON: Record<Announcement["severity"], typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  critical: Megaphone,
};

/**
 * Shows admin-published announcements to every signed-in user, on every
 * page. Dismissing one hides it for this browser only (tracked by id in
 * localStorage) — it reappears if the admin edits/republishes with a new id.
 */
export function AnnouncementBanner() {
  const { user, isLoading } = useAuth();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDismissed(readDismissed());
    setHydrated(true);
  }, []);

  const { data: announcements } = useQuery({
    queryKey: ["/api/announcements/active"],
    queryFn: () => apiRequest<Announcement[]>("/api/announcements/active"),
    enabled: Boolean(user) && !isLoading,
    staleTime: 60_000,
  });

  const dismiss = (id: string) => {
    setDismissed((current) => {
      const next = [...current, id];
      try {
        window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      } catch {
        // ignore storage failures (private mode, quota, etc.)
      }
      return next;
    });
  };

  if (!hydrated || !user || !announcements) return null;

  const visible = announcements.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="sticky top-0 z-[100] space-y-1 p-2">
      {visible.map((announcement) => {
        const Icon = SEVERITY_ICON[announcement.severity];
        return (
          <div
            key={announcement.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-sm",
              SEVERITY_STYLES[announcement.severity],
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{announcement.title}</p>
              <p className="text-sm opacity-90 whitespace-pre-wrap">{announcement.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(announcement.id)}
              className="shrink-0 rounded p-1 opacity-70 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
