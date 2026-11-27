import { useState, type FormEvent } from 'react';
import { InstallBanner } from '../components/Banners';
import { DialFace } from '../components/Dial';
import { Button, Field, FormError } from '../components/ui';
import { call, errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';

type Mode = 'signIn' | 'signUp';

export interface SignUpValues {
  email: string;
  password: string;
  displayName: string;
}

export function validateSignUp(v: SignUpValues): Partial<Record<keyof SignUpValues, string>> {
  const errors: Partial<Record<keyof SignUpValues, string>> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'Enter a valid email address.';
  if (v.password.length < 8) errors.password = 'Use at least 8 characters.';
  const name = v.displayName.trim();
  if (name.length < 1) errors.displayName = 'Enter a display name.';
  else if (name.length > 40) errors.displayName = 'Keep it to 40 characters or fewer.';
  return errors;
}

export function Auth() {
  const { refresh } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (mode === 'signUp') {
      const found = validateSignUp({ email, password, displayName });
      setErrors(found);
      if (Object.keys(found).length) return;
    } else {
      setErrors({});
      if (!email.trim() || !password) {
        setFormError('Enter your email and password.');
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === 'signUp') {
        await call('auth.signUp', { email: email.trim(), password, displayName: displayName.trim() });
      } else {
        await call('auth.signIn', { email: email.trim(), password });
      }
      await refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function switchTo(m: Mode) {
    setMode(m);
    setErrors({});
    setFormError(null);
  }

  return (
    <div className="space-y-6">
      <InstallBanner />
      <header className="flex items-center gap-3">
        <div className="w-14">
          <DialFace hand={8} centerText="" showNumbers={false} />
        </div>
        <div>
          <h1 className="display text-3xl">Watch Ratings</h1>
          <p className="text-muted">Rate watches. Keep a diary. Compare notes.</p>
        </div>
      </header>

      <div role="tablist" aria-label="Account" className="grid grid-cols-2 rounded-xl bg-surface-2 p-1">
        {(['signIn', 'signUp'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => switchTo(m)}
            className={`min-h-11 rounded-lg font-semibold ${mode === m ? 'bg-surface shadow-sm' : 'text-muted'}`}
          >
            {m === 'signIn' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        {mode === 'signUp' && (
          <Field
            label="Display name"
            name="nickname"
            autoComplete="nickname"
            maxLength={40}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            hint="Shown to other people next to your ratings."
            error={errors.displayName}
          />
        )}
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete={mode === 'signIn' ? 'username' : 'email'}
          autoCapitalize="none"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={mode === 'signUp' ? 'At least 8 characters.' : undefined}
          error={errors.password}
        />
        <FormError message={formError} />
        <Button type="submit" busy={busy} className="w-full">
          {mode === 'signIn' ? 'Sign in' : 'Create account'}
        </Button>
        {mode === 'signUp' && (
          <p className="text-center text-sm text-muted">
            Everything you rate, list, or add is visible to everyone who signs in.
          </p>
        )}
      </form>
    </div>
  );
}
