'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

const PRIMARY_LINKS = [{"href":"/clientes","label":"Clientes"},{"href":"/sites","label":"Sites"},{"href":"/cameras","label":"Câmeras"},{"href":"/operacao","label":"Operação"}];
const MORE_LINKS = [{"href":"/detection-rules","label":"Detection Rules"},{"href":"/motion-prefilter","label":"Motion Prefilter"},{"href":"/contratos","label":"Contratos"},{"href":"/estoque","label":"Estoque"}];
const HIDE = [/^\/$/, /^\/login/, /^\/register/, /^\/redefinir-senha/, /^\/esqueci-senha/, /^\/recuperar/, /^\/termos/, /^\/privacidade/, /^\/cookies/, /^\/verificar/];

export function AppNav() {
  const pathname = usePathname() || '/';
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (HIDE.some((re) => re.test(pathname))) return null;

  const isMoreActive = MORE_LINKS.some((l) => pathname === l.href || pathname.startsWith(l.href + '/'));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4">
        <Link href="/dashboard" className="mr-2 shrink-0 font-semibold tracking-tight">Plataforma de Monitoramento</Link>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {PRIMARY_LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + '/');
            return (
              <Link key={l.href} href={l.href} className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${active ? 'bg-brand/10 font-semibold text-brand' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'}`}>
                {l.label}
              </Link>
            );
          })}
        </div>
        <div ref={moreRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${isMoreActive ? 'bg-brand/10 font-semibold text-brand' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'}`}
          >
            Mais {moreOpen ? '▴' : '▾'}
          </button>
          {moreOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-md border border-border bg-surface shadow-lg">
              {MORE_LINKS.map((l) => {
                const active = pathname === l.href || pathname.startsWith(l.href + '/');
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors ${active ? 'font-semibold text-brand' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'}`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="ml-1 shrink-0 rounded-md px-3 py-1.5 text-sm text-fg-muted hover:text-fg">
          Sair
        </button>
      </nav>
    </header>
  );
}
