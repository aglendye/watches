import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Field, FormError } from '../components/ui';
import { useToast } from '../components/Toast';
import { call, errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';

// The step survives leaving the app to read the email (sessionStorage).
const KEY = 'watch-app.reset';
type Step = 'email' | 'code' | 'password';
interface Saved {
  step: Step;
  email: string;
  code: string;
}

function load(): Saved {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    /* ignore */
  }
  return { step: 'email', email: '', code: '' };
}

function save(s: Saved) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function Reset() {
  const { refresh } = useAuth();
  const toast = useToast();
  const [state, setState] = useState<Saved>(load);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => save(state), [state]);

  async function run(fn: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function requestCode(e?: FormEvent) {
    e?.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    void run(async () => {
      await call('auth.requestReset', { email: state.email.trim() });
      setState((s) => ({ ...s, step: 'code', code: '' }));
      if (e === undefined) toast('A new code is on its way');
    });
  }

  function verify(e: FormEvent) {
    e.preventDefault();
    const code = state.code.replace(/\D/g, '');
    if (code.length !== 6) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    void run(async () => {
      await call('auth.verifyReset', { email: state.email.trim(), code });
      setState((s) => ({ ...s, code, step: 'password' }));
    });
  }

  function finish(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    void run(async () => {
      await call('auth.completeReset', { email: state.email.trim(), code: state.code, password });
      sessionStorage.removeItem(KEY);
      toast('Password updated. You’re signed in.');
      await refresh();
    });
  }

  function startOver() {
    sessionStorage.removeItem(KEY);
    setState({ step: 'email', email: state.email, code: '' });
    setError(null);
  }

  return (
    <div className="space-y-6">
      <Link to="/auth" className="inline-flex min-h-11 items-center font-medium text-accent">
        ‹ Back to sign in
      </Link>
      <h1 className="text-2xl font-bold">Reset your password</h1>

      {state.step === 'email' && (
        <form onSubmit={requestCode} noValidate className="space-y-4">
          <p className="text-muted">We’ll email you a 6-digit code. Keep this app open, or come back to it.</p>
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            inputMode="email"
            value={state.email}
            onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
          />
          <FormError message={error} />
          <Button type="submit" busy={busy} className="w-full">
            Send code
          </Button>
        </form>
      )}

      {state.step === 'code' && (
        <form onSubmit={verify} noValidate className="space-y-4">
          <p className="text-muted">
            If an account exists for <span className="font-semibold text-ink">{state.email}</span>, we sent it a
            6-digit code. Copy it from the email and come back here.
          </p>
          <Field
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            className="tabular"
            value={state.code}
            onChange={(e) => setState((s) => ({ ...s, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
          />
          <FormError message={error} />
          <Button type="submit" busy={busy} className="w-full">
            Continue
          </Button>
          <div className="flex justify-between">
            <Button kind="ghost" onClick={() => requestCode()} disabled={busy}>
              Send a new code
            </Button>
            <Button kind="ghost" onClick={startOver}>
              Different email
            </Button>
          </div>
        </form>
      )}

      {state.step === 'password' && (
        <form onSubmit={finish} noValidate className="space-y-4">
          {/* Lets password managers save the new password against the right account. */}
          <input type="email" name="email" autoComplete="username" value={state.email} readOnly hidden />
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="At least 8 characters."
          />
          <FormError message={error} />
          <Button type="submit" busy={busy} className="w-full">
            Save password and sign in
          </Button>
          <Button kind="ghost" onClick={startOver} className="w-full">
            Start over
          </Button>
        </form>
      )}
    </div>
  );
}
