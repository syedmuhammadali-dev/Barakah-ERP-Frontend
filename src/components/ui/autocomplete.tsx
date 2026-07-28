"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  id?: string;
  emptyText?: string;
  /** Max number of suggestions rendered at once (default 50). */
  maxResults?: number;
  className?: string;
  name?: string;
}

/**
 * A free-text input with a filter-as-you-type suggestions dropdown.
 * Unlike a plain <select>, any typed value is allowed — the suggestions
 * are only there to speed up entry of common items. Works inside dialogs
 * because it does not steal focus via a portal/popover.
 */
export function Autocomplete({
  value,
  onChange,
  suggestions,
  placeholder,
  id,
  emptyText = "No matches — press Enter to keep what you typed",
  maxResults = 50,
  className,
  name,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const query = value.trim().toLowerCase();
    const list = query
      ? suggestions.filter((s) => s.toLowerCase().includes(query))
      : suggestions;
    return list.slice(0, maxResults);
  }, [value, suggestions, maxResults]);

  React.useEffect(() => {
    setHighlight(0);
  }, [value, open]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const select = (item: string) => {
    onChange(item);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) {
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
        break;
      case "Enter":
        if (filtered[highlight]) {
          e.preventDefault();
          select(filtered[highlight]);
        } else {
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className="pr-8"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle suggestions"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </div>
      {open ? (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
          {filtered.length === 0 ? (
            <div className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</div>
          ) : (
            filtered.map((item, index) => (
              <button
                type="button"
                key={item}
                // Prevent the input from blurring before the click registers.
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => select(item)}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm",
                  index === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                )}
              >
                <span>{item}</span>
                {value.trim().toLowerCase() === item.toLowerCase() ? (
                  <Check className="h-4 w-4 opacity-70" />
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
