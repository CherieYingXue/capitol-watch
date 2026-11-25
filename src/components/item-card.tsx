import { Building2, CalendarClock, ExternalLink, FileText, MapPin, Newspaper, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABEL, CHAMBER_STYLE, CHINA_STYLE, formatDateTime } from "@/lib/format";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ItemCard({ item, compact = false }: { item: Item; compact?: boolean }) {
  const when = item.eventDate ?? item.date;
  const isChina = item.china.level === "high" || item.china.level === "medium";
  return (
    <article
      className={cn(
        "group rounded-xl border bg-card p-4 transition-colors hover:border-primary/30",
        isChina && "border-l-4 border-l-red-500",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge variant="outline" className={CHAMBER_STYLE[item.chamber]}>
          {item.chamber}
        </Badge>
        <Badge variant="secondary">{CATEGORY_LABEL[item.category]}</Badge>
        {item.stage && <Badge variant="outline">{item.stage}</Badge>}
        {item.china.level && (
          <Badge variant="outline" className={CHINA_STYLE[item.china.level]}>
            <ShieldAlert data-icon="inline-start" />
            China · {item.china.level}
          </Badge>
        )}
        <span className="ml-auto flex items-center gap-1 text-muted-foreground">
          {item.eventDate ? <CalendarClock className="size-3.5" /> : null}
          {formatDateTime(when)}
        </span>
      </div>

      <h3 className={cn("mt-2 font-medium leading-snug text-pretty", compact ? "text-sm" : "text-[15px]")}>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2">
          {item.title}
          <ExternalLink className="ml-1 inline size-3 opacity-0 transition-opacity group-hover:opacity-60" />
        </a>
      </h3>

      {!compact && item.summary && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">{item.summary}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {item.committee && (
          <span className="flex items-center gap-1">
            <Building2 className="size-3.5" />
            {item.committee}
          </span>
        )}
        {item.location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {item.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          {item.sourceKind === "official" ? <FileText className="size-3.5" /> : <Newspaper className="size-3.5" />}
          {item.source}
        </span>
      </div>

      {!compact && item.china.terms.length > 0 && (
        <p className="mt-2 text-xs text-red-700">Matched: {item.china.terms.join(", ")}</p>
      )}

      {!compact && item.documents && item.documents.length > 0 && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {item.documents.length} related document{item.documents.length > 1 ? "s" : ""}
          </summary>
          <ul className="mt-1.5 space-y-1 pl-4 list-disc">
            {item.documents.slice(0, 12).map((d, idx) => (
              <li key={idx}>
                {d.url ? (
                  <a className="underline underline-offset-2" href={d.url} target="_blank" rel="noopener noreferrer">
                    {d.label}
                  </a>
                ) : (
                  d.label
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
