"use client";

import { Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemCard } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CATEGORY_LABEL, dayKey, formatDayLong } from "@/lib/format";
import type { Category, Chamber, Item } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  items: Item[];
  groupByDay?: boolean;
  pageSize?: number;
  defaultChinaOnly?: boolean;
  hideChinaToggle?: boolean;
  emptyText?: string;
}

const CHAMBERS: (Chamber | "All")[] = ["All", "House", "Senate", "Congress"];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-7 rounded-full border px-3 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function ItemExplorer({
  items,
  groupByDay = false,
  pageSize = 30,
  defaultChinaOnly = false,
  hideChinaToggle = false,
  emptyText = "Nothing here right now.",
}: Props) {
  const [query, setQuery] = useState("");
  const [chamber, setChamber] = useState<Chamber | "All">("All");
  const [category, setCategory] = useState<Category | "All">("All");
  const [chinaOnly, setChinaOnly] = useState(defaultChinaOnly);
  const [limit, setLimit] = useState(pageSize);

  const categories = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const i of items) counts.set(i.category, (counts.get(i.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const chambers = useMemo(() => CHAMBERS.filter((c) => c === "All" || items.some((i) => i.chamber === c)), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (chamber !== "All" && i.chamber !== chamber) return false;
      if (category !== "All" && i.category !== category) return false;
      if (chinaOnly && !i.china.level) return false;
      if (q) {
        const hay = `${i.title} ${i.summary ?? ""} ${i.committee ?? ""} ${i.source} ${i.stage ?? ""}`.toLowerCase();
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }, [items, query, chamber, category, chinaOnly]);

  const visible = filtered.slice(0, limit);
  const groups = useMemo(() => {
    if (!groupByDay) return null;
    const map = new Map<string, Item[]>();
    for (const i of visible) {
      const k = dayKey(i.eventDate ?? i.date);
      map.set(k, [...(map.get(k) ?? []), i]);
    }
    return [...map.entries()];
  }, [visible, groupByDay]);

  const reset = () => {
    setQuery("");
    setChamber("All");
    setCategory("All");
    setChinaOnly(defaultChinaOnly);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(pageSize);
              }}
              placeholder="Search titles, committees, sources…"
              className="pl-8"
              aria-label="Search"
            />
          </div>
          {!hideChinaToggle && (
            <label className="flex items-center gap-2 text-sm whitespace-nowrap">
              <Switch checked={chinaOnly} onCheckedChange={(v) => setChinaOnly(Boolean(v))} />
              China-related only
            </label>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chambers.map((c) => (
            <Chip key={c} active={chamber === c} onClick={() => setChamber(c)}>
              {c === "Congress" ? "Both / general" : c}
            </Chip>
          ))}
          {categories.length > 1 && <span className="mx-1 hidden w-px self-stretch bg-border sm:block" />}
          {categories.length > 1 && (
            <Chip active={category === "All"} onClick={() => setCategory("All")}>
              All types
            </Chip>
          )}
          {categories.length > 1 &&
            categories.map(([c, n]) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {CATEGORY_LABEL[c]} <span className="opacity-60">{n}</span>
              </Chip>
            ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {visible.length} of {filtered.length}
        {filtered.length !== items.length ? ` (filtered from ${items.length})` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
          <SearchX className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {items.length === 0 ? emptyText : "No items match these filters."}
          </p>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={reset}>
              Clear filters
            </Button>
          )}
        </div>
      ) : groups ? (
        <div className="space-y-6">
          {groups.map(([k, list]) => (
            <section key={k}>
              <h3 className="sticky top-14 z-10 -mx-1 mb-2 bg-background/95 px-1 py-1.5 text-sm font-semibold backdrop-blur">
                {formatDayLong(list[0].eventDate ?? list[0].date)}
                <span className="ml-2 font-normal text-muted-foreground">{list.length} event{list.length > 1 ? "s" : ""}</span>
              </h3>
              <div className="grid gap-3">
                {list.map((i) => (
                  <ItemCard key={i.id} item={i} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((i) => (
            <ItemCard key={i.id} item={i} />
          ))}
        </div>
      )}

      {filtered.length > limit && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + pageSize)}>
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}
