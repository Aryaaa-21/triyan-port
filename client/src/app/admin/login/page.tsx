'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminApi, AdminError } from '@/features/admin/client';
import { TextField } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.login(email, password);
      router.push('/admin');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof AdminError ? cause.message : 'Could not sign in. Try again.');
      setBusy(false);
    }
  };

  return (
    <main id="main" className="gutter mx-auto flex min-h-dvh max-w-sm flex-col justify-center">
      <h1 className="font-display text-3xl font-light tracking-tight">Sign in</h1>
      <p className="mt-2 font-ui text-xs text-fg-subtle">Triyan Writes — administration</p>

      <form onSubmit={(e) => void submit(e)} className="mt-10 flex flex-col gap-6" noValidate>
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className="font-ui text-xs text-ember">
            {error}
          </p>
        )}

        <Button type="submit" variant="solid" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </main>
  );
}
