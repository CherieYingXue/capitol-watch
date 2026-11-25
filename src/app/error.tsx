"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <TriangleAlert className="size-10 text-amber-500" />
      <h1 className="text-xl font-semibold">Couldn&apos;t load the congressional feeds</h1>
      <p className="text-sm text-muted-foreground">
        One of the official or media sources may be slow or down. Try again in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
