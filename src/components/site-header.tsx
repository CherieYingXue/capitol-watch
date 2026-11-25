import { Landmark } from "lucide-react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { UpdatedAt } from "@/components/updated-at";
import { getDigest } from "@/lib/digest";
import { activeChinaAlerts } from "@/lib/select";

export async function SiteHeader() {
  const digest = await getDigest();
  const chinaCount = activeChinaAlerts(digest).length;
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="size-4" />
          </span>
          <span className="leading-tight">
            Capitol Watch
            <span className="block text-[11px] font-normal text-muted-foreground">
              Updated <UpdatedAt iso={digest.generatedAt} />
            </span>
          </span>
        </Link>
        <div className="ml-auto">
          <SiteNav chinaCount={chinaCount} />
        </div>
      </div>
    </header>
  );
}

export function SiteHeaderFallback() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 font-semibold">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Landmark className="size-4" />
        </span>
        Capitol Watch
      </div>
    </header>
  );
}
