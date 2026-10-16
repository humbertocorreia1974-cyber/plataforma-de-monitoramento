'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '1rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Erro inesperado</h1>
        <p style={{ marginTop: '0.5rem', maxWidth: '28rem', color: '#666' }}>
          O aplicativo encontrou um problema. Tente recarregar a página.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: '1.5rem',
            height: '2.5rem',
            padding: '0 1rem',
            borderRadius: '0.375rem',
            border: '1px solid #ccc',
            background: '#111',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
