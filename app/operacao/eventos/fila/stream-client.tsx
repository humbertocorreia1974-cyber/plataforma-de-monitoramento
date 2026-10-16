"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function StreamStatus() {
  const router = useRouter();
  const [state, setState] = useState<"conectando" | "online" | "offline">(
    "conectando"
  );

  useEffect(() => {
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      setState("conectando");
      es = new EventSource("/api/events/stream");
      es.onopen = () => setState("online");
      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === "event") router.refresh();
        } catch {}
      };
      es.onerror = () => {
        setState("offline");
        es?.close();
        retry = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      es?.close();
      if (retry) clearTimeout(retry);
    };
  }, [router]);

  const tone =
    state === "online"
      ? "bg-brand/10 text-brand"
      : state === "conectando"
      ? "bg-fg-muted/10 text-fg-muted"
      : "bg-accent/10 text-accent";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {state === "online" ? "Tempo real" : state === "conectando" ? "Conectando…" : "Reconectando…"}
    </span>
  );
}
