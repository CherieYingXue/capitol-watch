import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import { PageHeader } from "@/components/blocks";
import { Badge } from "@/components/ui/badge";
import { getDigest } from "@/lib/digest";
import { CHINA_TERM_LABELS } from "@/lib/china";

export const metadata = { title: "Sources – Capitol Watch" };

export default async function SourcesPage() {
  const d = await getDigest();
  const congressKey = d.sources.some((s) => s.id.startsWith("congressgov"));
  return (
    <>
      <PageHeader
        title="Sources & health"
        description="Where Capitol Watch gets its information and whether each feed answered on the last refresh."
      />
      {!congressKey && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Optional: set a free <code className="font-mono">CONGRESS_API_KEY</code> from{" "}
          <a className="underline" href="https://api.congress.gov/sign-up/" target="_blank" rel="noopener noreferrer">
            api.congress.gov
          </a>{" "}
          to add the latest action on every bill and the full list of pending nominations.
        </div>
      )}
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="p-3 font-medium">Source</th>
              <th className="hidden p-3 font-medium sm:table-cell">Type</th>
              <th className="p-3 text-right font-medium">Items</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {d.sources.map((s) => (
              <tr key={s.id}>
                <td className="p-3">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                    {s.name}
                  </a>
                </td>
                <td className="hidden p-3 sm:table-cell">
                  <Badge variant={s.kind === "official" ? "default" : "secondary"}>{s.kind === "official" ? "Official" : "Media"}</Badge>
                </td>
                <td className="p-3 text-right tabular-nums">{s.count}</td>
                <td className="p-3">
                  {!s.ok ? (
                    <span className="flex items-center gap-1.5 text-red-700" title={s.error}>
                      <CircleAlert className="size-4" /> Unreachable
                    </span>
                  ) : s.count === 0 ? (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <CircleDashed className="size-4" /> No recent items
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-green-700">
                      <CheckCircle2 className="size-4" /> OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">China alert keywords</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Items are scanned for these signals in their title, summary, committee and attached documents.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CHINA_TERM_LABELS.map((t) => (
            <span key={t} className="rounded-full border px-2 py-0.5 text-xs">
              {t}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
