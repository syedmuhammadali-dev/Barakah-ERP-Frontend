"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@barakah/auth-web";
import { Button } from "@/components/ui/button";
import { useAppLocale } from "@/lib/i18n";

const TOUR_STORAGE_PREFIX = "barakah-tour-seen-v1:";
const DEMO_EMAIL = "local@barakah.dev";

interface TourStep {
  selector: string;
  titleKey: string;
  descKey: string;
}

const STEPS: TourStep[] = [
  { selector: '[data-tour="nav-dashboard"]', titleKey: "tour.dashboardTitle", descKey: "tour.dashboardDesc" },
  { selector: '[data-tour="nav-inventory"]', titleKey: "tour.inventoryTitle", descKey: "tour.inventoryDesc" },
  { selector: '[data-tour="nav-sales"]', titleKey: "tour.salesTitle", descKey: "tour.salesDesc" },
  { selector: '[data-tour="nav-bills"]', titleKey: "tour.billsTitle", descKey: "tour.billsDesc" },
  { selector: '[data-tour="nav-zakat"]', titleKey: "tour.zakatTitle", descKey: "tour.zakatDesc" },
  { selector: '[data-tour="nav-salesmen"]', titleKey: "tour.salesmenTitle", descKey: "tour.salesmenDesc" },
  { selector: '[data-tour="nav-suppliers"]', titleKey: "tour.suppliersTitle", descKey: "tour.suppliersDesc" },
  { selector: '[data-tour="nav-settings"]', titleKey: "tour.settingsTitle", descKey: "tour.settingsDesc" },
];

/**
 * A lightweight, dependency-free product tour. Shows automatically once per
 * browser for the shared demo account (every visitor who tries it) and once
 * per real account after their first sign-in. Skipping or finishing marks it
 * seen in localStorage so it never shows again on that browser/account.
 */
export function ProductTour() {
  const { user } = useAuth();
  const { t } = useAppLocale();
  const [stepIndex, setStepIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const storageKey = useMemo(() => {
    if (!user?.id) return null;
    return `${TOUR_STORAGE_PREFIX}${user.id}`;
  }, [user?.id]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const seen = window.localStorage.getItem(storageKey);
      if (!seen) {
        setActive(true);
        setStepIndex(0);
      }
    } catch {
      // ignore storage access issues
    }
  }, [storageKey]);

  useEffect(() => {
    if (!active) return;
    const step = STEPS[stepIndex];
    if (!step) return;

    const update = () => {
      const el = document.querySelector(step.selector);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, stepIndex]);

  const finish = () => {
    setActive(false);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, "1");
      } catch {
        // ignore storage failures
      }
    }
  };

  if (!active || !user) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const isDemo = user.email === DEMO_EMAIL;

  const tooltipTop = rect ? Math.min(rect.bottom + 12, window.innerHeight - 200) : window.innerHeight / 2 - 80;
  const tooltipLeft = rect ? Math.min(Math.max(rect.left, 16), window.innerWidth - 340) : window.innerWidth / 2 - 160;

  return (
    <div className="fixed inset-0 z-[300]">
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-lg ring-2 ring-primary transition-all duration-200"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/55" />
      )}

      <div
        className="fixed w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-4 shadow-2xl"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <p className="text-xs font-medium text-primary mb-1">
          {isDemo ? t("tour.demoBadge") : t("tour.welcomeBadge")} · {stepIndex + 1}/{STEPS.length}
        </p>
        <h3 className="text-sm font-semibold mb-1">{t(step.titleKey)}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t(step.descKey)}</p>
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={finish}>
            {t("tour.skip")}
          </Button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setStepIndex((i) => i - 1)}>
                {t("tour.back")}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
            >
              {isLast ? t("tour.finish") : t("tour.next")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
