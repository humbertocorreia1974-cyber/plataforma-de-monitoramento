'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Tivemos um problema ao carregar esta página. Você pode tentar de novo — se
        persistir, volte mais tarde ou fale com o suporte.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Tentar de novo
        </button>
        <a
          href="/"
          className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
        >
          Ir para o início
        </a>
      </div>
      {error?.digest ? (
        <p className="mt-4 text-xs text-muted-foreground">Código do erro: {error.digest}</p>
      ) : null}
    </div>
  );
}
