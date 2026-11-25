import { ArrowRight, Flame, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { ItemCard } from "@/components/item-card";
import type { Item, TopicStat, TrendingBill } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function Section({
  title,
  href,
  hrefLabel = "See all",
  children,
  className,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-sm text-primary hover:underline">
            {hrefLabel} <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function ItemList({ items, empty, compact }: { items: Item[]; empty: string; compact?: boolean }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="grid gap-2.5">
      {items.map((i) => (
        <ItemCard key={i.id} item={i} compact={compact} />
      ))}
    </div>
  );
}

export function ChinaBanner({ alerts }: { alerts: Item[] }) {
  if (alerts.length === 0) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl border bg-card p-4 text-sm">
        <ShieldAlert className="size-5 text-muted-foreground" />
        No active China-related alerts in the last 72 hours. Capitol Watch keeps checking every 10 minutes.
      </div>
    );
  }
  const high = alerts.filter((a) => a.china.level === "high");
  const top = (high.length ? high : alerts).slice(0, 3);
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
          <ShieldAlert className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-red-900">
            China alert: {alerts.length} active item{alerts.length > 1 ? "s" : ""} on Capitol Hill
            {high.length > 0 && ` · ${high.length} high priority`}
          </p>
          <ul className="mt-2 space-y-1.5">
            {top.map((a) => (
              <li key={a.id} className="text-sm">
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-medium text-red-950 hover:underline">
                  {a.title}
                </a>
                <span className="text-red-800/70"> — {a.committee ?? a.source}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/china"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700"
        >
          Open China Watch <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, href, tone }: { label: string; value: number; hint: string; href: string; tone?: "red" }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors hover:border-primary/40",
        tone === "red" && "border-red-200 bg-red-50/60 hover:border-red-400",
      )}
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={cn("mt-1 text-3xl font-semibold tabular-nums", tone === "red" && "text-red-700")}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}

export function TopicGrid({ topics }: { topics: TopicStat[] }) {
  if (topics.length === 0) return <p className="text-sm text-muted-foreground">Not enough activity to rank topics yet.</p>;
  const max = Math.max(...topics.map((t) => t.count));
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {topics.slice(0, 10).map((t, idx) => (
        <div key={t.id} className={cn("rounded-xl border bg-card p-3", t.chinaRelated && "border-red-200 bg-red-50/40")}>
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              {idx < 3 && <Flame className="size-4 text-orange-500" />}
              {t.label}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {t.count} items · {t.officialCount} official
            </p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", t.chinaRelated ? "bg-red-500" : "bg-primary")}
              style={{ width: `${Math.max(6, (t.count / max) * 100)}%` }}
            />
          </div>
          {t.sample[0] && (
            <a
              href={t.sample[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {t.sample[0].title}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export function TrendingBills({ bills }: { bills: TrendingBill[] }) {
  if (bills.length === 0) return <p className="text-sm text-muted-foreground">Congress.gov trending list is unavailable right now.</p>;
  return (
    <ol className="divide-y rounded-xl border bg-card">
      {bills.map((b, i) => (
        <li key={b.url} className="flex items-start gap-3 p-3 text-sm">
          <span className="w-5 shrink-0 text-right font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
          <a href={b.url} target="_blank" rel="noopener noreferrer" className="min-w-0 hover:underline">
            <span className="font-medium">{b.label}</span>
            {b.congress && <span className="text-muted-foreground"> ({b.congress}th)</span>} — {b.title}
          </a>
        </li>
      ))}
    </ol>
  );
}
