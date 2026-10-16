"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Email ou senha inválidos.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* painel de marca */}
      <div className="relative hidden overflow-hidden bg-brand text-brand-fg lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(40rem_30rem_at_20%_10%,hsl(var(--brand-fg)/0.18),transparent_60%),radial-gradient(30rem_24rem_at_90%_90%,hsl(var(--brand-fg)/0.12),transparent_60%)]"
        />
        <Link href="/" className="relative text-lg font-semibold tracking-tight">
          Plataforma de Monitoramento
        </Link>
        <div className="relative">
          <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight">
            Bem-vindo de volta.
          </h2>
          <p className="mt-3 max-w-sm text-brand-fg/75">
            Entre para continuar de onde parou.
          </p>
        </div>
        <p className="relative text-sm text-brand-fg/60">© {new Date().getFullYear()}</p>
      </div>

      {/* formulário */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block text-base font-semibold tracking-tight lg:hidden">
            Plataforma de Monitoramento
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-1 text-sm text-fg-muted">Use seu email e senha.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
              <Input id="email" type="email" required placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium">Senha</label>
                <Link href="/esqueci-senha" className="text-xs text-fg-muted hover:text-fg">Esqueci a senha</Link>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-fg-muted">
            Não tem conta?{" "}
            <Link href="/register" className="font-medium text-brand hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
