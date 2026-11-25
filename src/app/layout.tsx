import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AlertWatcher } from "@/components/alert-watcher";
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Capitol Watch – Congressional committee tracker & China alerts",
  description:
    "Track U.S. House and Senate committee hearings, bills, resolutions, investigations, nominations and committee appointments, with alerts for China-related activity on Capitol Hill.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<SiteHeaderFallback />}>
          <SiteHeader />
        </Suspense>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          <p className="mx-auto max-w-3xl px-4">
            Data from Senate.gov, docs.house.gov, GovInfo, Congress.gov, committee press feeds, and news reports (Politico, The
            Hill, Roll Call, Google News). Refreshed every 10 minutes. Media items are reports, not official records; always
            check the linked source.
          </p>
        </footer>
        <AlertWatcher />
      </body>
    </html>
  );
}
