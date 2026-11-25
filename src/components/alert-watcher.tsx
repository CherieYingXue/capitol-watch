"use client";

import { BellRing, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface Alert {
  id: string;
  title: string;
  url: string;
  level: "high" | "medium";
  committee?: string;
  source: string;
}

const SEEN_KEY = "capitolwatch.seenChinaAlerts";
const POLL_MS = 5 * 60 * 1000;

function loadSeen(): Set<string> | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

function saveSeen(ids: Iterable<string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-1500)));
}

/** Polls /api/china while the tab is open; surfaces new China-related items in a toast and as browser notifications. */
export function AlertWatcher() {
  const [fresh, setFresh] = useState<Alert[]>([]);
  const firstRun = useRef(true);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/china", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { alerts: Alert[] };
      const seen = loadSeen();
      if (!seen) {
        saveSeen(data.alerts.map((a) => a.id));
        return;
      }
      const newOnes = data.alerts.filter((a) => !seen.has(a.id));
      if (newOnes.length === 0) return;
      setFresh(newOnes);
      if (!firstRun.current && "Notification" in window && Notification.permission === "granted") {
        const top = newOnes[0];
        const n = new Notification(`China alert: ${newOnes.length} new item${newOnes.length > 1 ? "s" : ""} on Capitol Hill`, {
          body: top.title,
          tag: "capitolwatch-china",
        });
        n.onclick = () => window.open(top.url, "_blank", "noopener");
      }
    } catch {
      /* network hiccup: try again on the next poll */
    } finally {
      firstRun.current = false;
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(check, 1500);
    const id = setInterval(check, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [check]);

  const dismiss = () => {
    const seen = loadSeen() ?? new Set<string>();
    for (const a of fresh) seen.add(a.id);
    saveSeen(seen);
    setFresh([]);
  };

  if (fresh.length === 0) return null;
  const high = fresh.filter((a) => a.level === "high").length;

  return (
    <div role="status" className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96">
      <div className="rounded-xl border border-red-200 bg-white p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-100 p-2 text-red-700">
            <BellRing className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {fresh.length} new China-related item{fresh.length > 1 ? "s" : ""}
              {high > 0 && <span className="text-red-700"> · {high} high priority</span>}
            </p>
            <ul className="mt-1.5 space-y-1">
              {fresh.slice(0, 3).map((a) => (
                <li key={a.id} className="truncate text-xs">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {a.title}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button size="sm" nativeButton={false} render={<Link href="/china" onClick={dismiss} />}>
                Open China Watch
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Mark as seen
              </Button>
            </div>
          </div>
          <button type="button" onClick={dismiss} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
