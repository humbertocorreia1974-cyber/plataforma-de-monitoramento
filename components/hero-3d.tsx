import { ShieldCheck, Camera, User, Car } from "lucide-react";

const EVENTOS = [
  { icon: User, titulo: "Pessoa detectada", local: "Portaria principal", hora: "há 1 min", estado: "Novo" },
  { icon: Car, titulo: "Veículo detectado", local: "Garagem", hora: "há 6 min", estado: "Em análise" },
  { icon: ShieldCheck, titulo: "Incidente aberto", local: "Estacionamento", hora: "há 14 min", estado: "Escalado" },
];

// Destaque da landing: mostra a central de operação (o produto) em vez de uma forma abstrata.
export function Hero3D() {
  return (
    <div className="w-full max-w-md" role="img" aria-label="Exemplo ilustrativo da central de operação com a fila de eventos das câmeras">
      <div className="rounded-2xl border border-border bg-surface/80 p-4 shadow-xl backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Camera className="h-4 w-4 text-brand" aria-hidden />
            Central de operação
          </div>
          <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs text-brand">Exemplo ilustrativo</span>
        </div>
        <ul className="space-y-2">
          {EVENTOS.map((e) => (
            <li key={e.titulo} className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15">
                <e.icon className="h-4 w-4 text-brand" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{e.titulo}</span>
                <span className="block truncate text-xs text-fg-muted">{e.local} · {e.hora}</span>
              </span>
              <span className="rounded-md border border-border px-2 py-0.5 text-xs text-fg-muted">{e.estado}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2 text-xs text-fg-muted">
          <span className="rounded-md border border-border px-2.5 py-1">Classificar</span>
          <span className="rounded-md border border-border px-2.5 py-1">Descartar</span>
          <span className="rounded-md border border-border px-2.5 py-1">Escalar</span>
        </div>
      </div>
    </div>
  );
}
