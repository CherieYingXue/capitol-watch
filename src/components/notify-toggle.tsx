"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type State = "unsupported" | "default" | "granted" | "denied" | "loading";

const subscribe = () => () => {};
const readPermission = (): State => ("Notification" in window ? (Notification.permission as State) : "unsupported");

export function NotifyToggle() {
  const initial = useSyncExternalStore(subscribe, readPermission, () => "loading" as State);
  const [requested, setRequested] = useState<State | null>(null);
  const state = requested ?? initial;
  const setState = setRequested;

  if (state === "loading") return <Button variant="outline" disabled>Browser alerts</Button>;
  if (state === "unsupported")
    return (
      <p className="text-xs text-muted-foreground">This browser doesn&apos;t support notifications.</p>
    );
  if (state === "granted")
    return (
      <Button
        variant="outline"
        onClick={() => new Notification("Capitol Watch", { body: "Browser alerts are on. You'll be notified of new China-related items while this tab is open." })}
      >
        <BellRing data-icon="inline-start" className="text-green-600" />
        Browser alerts on — send test
      </Button>
    );
  if (state === "denied")
    return (
      <Button variant="outline" disabled>
        <BellOff data-icon="inline-start" />
        Notifications blocked in browser settings
      </Button>
    );
  return (
    <Button onClick={async () => setState((await Notification.requestPermission()) as State)}>
      <Bell data-icon="inline-start" />
      Enable browser alerts
    </Button>
  );
}
