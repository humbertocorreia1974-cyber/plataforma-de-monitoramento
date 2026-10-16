"use client";

import { SessionProvider } from "next-auth/react";

// 🩹 2026-09-05: em preview de sandbox o app roda sob um sub-caminho
// (/sbx/<hash>/) via proxy reverso — sem basePath explícito o NextAuth
// busca sessão/csrf na RAIZ do domínio (`/api/auth/session`), o que dá 404
// (ou pior, acerta a rota de outro app rodando na raiz real). Em deploy
// real de cliente essa env var não existe, então basePath cai pro padrão
// `/api/auth` normalmente.
const basePath = `${process.env.NEXT_PUBLIC_SANDBOX_BASE_PATH || ""}/api/auth`;

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath={basePath}>{children}</SessionProvider>;
}
