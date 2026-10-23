'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function OperatorFormClient({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/sites/${siteId}/operators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Falha ao liberar acesso.');
      return;
    }
    setEmail('');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-fg-muted">
        Liberar operador por e-mail
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-64"
          placeholder="operador@empresa.com"
        />
      </label>
      <Button type="submit" variant="secondary" size="sm" disabled={loading}>
        {loading ? 'Liberando…' : 'Liberar acesso a este site'}
      </Button>
      {error && <p className="w-full text-sm text-red-500">{error}</p>}
    </form>
  );
}
