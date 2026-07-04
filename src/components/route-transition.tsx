"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAppLocale } from "@/lib/i18n";

type RouteTransitionContextValue = {
  isTransitioning: boolean;
  beginTransition: () => void;
};

const RouteTransitionContext = createContext<RouteTransitionContextValue | null>(
  null,
);

export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setIsTransitioning(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const beginTransition = useCallback(() => {
    setIsTransitioning(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 2000);
  }, []);

  const value = useMemo(
    () => ({ isTransitioning, beginTransition }),
    [isTransitioning, beginTransition],
  );

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
      {isTransitioning ? <RouteTransitionOverlay /> : null}
    </RouteTransitionContext.Provider>
  );
}

function RouteTransitionOverlay() {
  const { t } = useAppLocale();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-5 shadow-2xl">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <div className="text-sm font-medium">{t("route.loading")}</div>
      </div>
    </div>
  );
}

export function useRouteTransition() {
  const context = useContext(RouteTransitionContext);

  if (!context) {
    throw new Error("useRouteTransition must be used within RouteTransitionProvider");
  }

  return context;
}

type AppLinkProps = LinkProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: ReactNode;
    className?: string;
  };

export function AppLink({
  href,
  onClick,
  className,
  children,
  ...props
}: AppLinkProps) {
  const { beginTransition } = useRouteTransition();

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          !props.target
        ) {
          beginTransition();
        }
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
