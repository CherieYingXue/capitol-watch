import { BellRing, Mail, MonitorSmartphone } from "lucide-react";
import { ChinaBanner, ItemList, PageHeader, Section } from "@/components/blocks";
import { ItemExplorer } from "@/components/item-explorer";
import { NotifyToggle } from "@/components/notify-toggle";
import { getDigest } from "@/lib/digest";
import { activeChinaAlerts, chinaItems, upcoming } from "@/lib/select";

export const metadata = { title: "China Watch – Capitol Watch" };

export default async function ChinaPage() {
  const d = await getDigest();
  const alerts = activeChinaAlerts(d);
  const all = chinaItems(d.items);
  const hearings = upcoming(d, 21).filter((i) => i.china.level);
  const official = all.filter((i) => i.sourceKind === "official");

  const termCounts = new Map<string, number>();
  for (const i of all) for (const t of i.china.terms) termCounts.set(t, (termCounts.get(t) ?? 0) + 1);
  const terms = [...termCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);

  return (
    <>
      <PageHeader
        title="China Watch"
        description="Every hearing, bill, investigation, nomination and news report on Capitol Hill that touches China, the CCP, Taiwan, Hong Kong, export controls, Chinese tech firms and related policy."
      >
        <NotifyToggle />
      </PageHeader>

      <ChinaBanner alerts={alerts} />

      <div className="mb-8 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">How priority works</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <span className="mr-1.5 rounded bg-red-600 px-1.5 py-0.5 text-xs font-medium text-white">high</span>
              Official congressional action naming China, or several strong signals
            </li>
            <li>
              <span className="mr-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">medium</span>
              Direct China reference in news, or multiple policy signals
            </li>
            <li>
              <span className="mr-1.5 rounded bg-yellow-50 px-1.5 py-0.5 text-xs font-medium text-yellow-800">low</span>
              China-adjacent policy (export controls, rare earths…) only
            </li>
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Most-mentioned signals</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {terms.length === 0 && <span className="text-sm text-muted-foreground">No matches yet.</span>}
            {terms.map(([t, n]) => (
              <span key={t} className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-900">
                {t} <span className="opacity-60">{n}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">How alerts reach you</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li className="flex gap-2">
              <MonitorSmartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              A pop-up in any open Capitol Watch tab, checked every 5 minutes
            </li>
            <li className="flex gap-2">
              <BellRing className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              Desktop notifications once browser alerts are enabled
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              Email, Slack or Discord from the hourly scheduled check (see README)
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title={`All China-related items (${all.length})`}>
            <ItemExplorer items={all} hideChinaToggle emptyText="No China-related items in the current feeds." />
          </Section>
        </div>
        <div className="space-y-8">
          <Section title="China on the committee calendar">
            <ItemList items={hearings} compact empty="No China-related hearings or markups on the schedule for the next 3 weeks." />
          </Section>
          <Section title="Official actions">
            <ItemList items={official.slice(0, 8)} compact empty="No official China-related records right now." />
          </Section>
        </div>
      </div>
    </>
  );
}
