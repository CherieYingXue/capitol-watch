"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/", label: "Overview" },
  { href: "/china", label: "China Watch" },
  { href: "/hearings", label: "Hearings" },
  { href: "/legislation", label: "Bills & Resolutions" },
  { href: "/appointments", label: "Appointments" },
  { href: "/investigations", label: "Investigations" },
  { href: "/news", label: "Media" },
  { href: "/sources", label: "Sources" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteNav({ chinaCount }: { chinaCount: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (onNavigate?: () => void, vertical = false) =>
    NAV.map((n) => (
      <Link
        key={n.href}
        href={n.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          vertical && "py-2.5 text-base",
          isActive(pathname, n.href) ? "bg-primary text-primary-foreground" : "text-foreground/75 hover:bg-muted hover:text-foreground",
        )}
      >
        {n.label}
        {n.href === "/china" && chinaCount > 0 && (
          <span className="rounded-full bg-red-600 px-1.5 text-[11px] leading-4 font-semibold text-white">{chinaCount}</span>
        )}
      </Link>
    ));

  return (
    <>
      <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
        {links()}
      </nav>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />}>
          <Menu />
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>Capitol Watch</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4" aria-label="Main mobile">
            {links(() => setOpen(false), true)}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
