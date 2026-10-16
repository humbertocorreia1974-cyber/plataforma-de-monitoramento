'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const LINKS = [{"href":"/operacao","label":"Operacao"},{"href":"/detection-rules","label":"Detection Rules"},{"href":"/motion-prefilter","label":"Motion Prefilter"},{"href":"/contratos","label":"Contratos"},{"href":"/estoque","label":"Estoque"}];
const HIDE = [/^\/$/, /^\/login/, /^\/register/, /^\/redefinir-senha/, /^\/esqueci-senha/, /^\/recuperar/, /^\/termos/, /^\/privacidade/, /^\/cookies/, /^\/verificar/];

export function AppNav() {
  const pathname = usePathname() || '/';
  if (HIDE.some((re) => re.test(pathname))) return null;
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-1 overflow-x-auto px-4">
        <Link href="/dashboard" className="mr-2 shrink-0 font-semibold tracking-tight">Plataforma de Monitoramento</Link>
        {LINKS.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + '/');
          return (
            <Link key={l.href} href={l.href} className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${active ? 'bg-brand/10 font-semibold text-brand' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'}`}>
              {l.label}
            </Link>
          );
        })}
        <button onClick={() => signOut({ callbackUrl: '/' })} className="ml-auto shrink-0 rounded-md px-3 py-1.5 text-sm text-fg-muted hover:text-fg">
          Sair
        </button>
      </nav>
    </header>
  );
}
