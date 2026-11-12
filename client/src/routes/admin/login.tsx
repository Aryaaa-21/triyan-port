import { useRouter } from '@/lib/navigation';
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
  const [shown, setShown] = useState(false);

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
        <div className="relative">
          <TextField
            label="Password"
            type={shown ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="[&_input]:pr-16"
          />
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-pressed={shown}
            aria-label={shown ? 'Hide password' : 'Show password'}
            className="absolute right-0 bottom-3.5 font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase transition-colors hover:text-fg"
          >
            {shown ? 'Hide' : 'Show'}
          </button>
        </div>

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
