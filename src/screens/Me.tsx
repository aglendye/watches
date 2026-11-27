import { useState, type FormEvent } from 'react';
import { useToast } from '../components/Toast';
import { Button, Card, Field, FormError } from '../components/ui';
import { errorMessage } from '../lib/api';
import { useAuth, useMe } from '../lib/auth';
import { useUpdateProfile } from '../lib/queries';

export function Me() {
  const me = useMe();
  const { signOut, setDisplayName } = useAuth();
  const toast = useToast();
  const update = useUpdateProfile();
  const [name, setName] = useState(me.displayName);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 40) {
      setError('Display name must be 1 to 40 characters.');
      return;
    }
    setError(null);
    try {
      await update.mutateAsync(trimmed);
      setDisplayName(trimmed);
      toast('Display name saved');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function doSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      toast(errorMessage(err), 'error');
      setSigningOut(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="display text-3xl">Me</h1>
      <Card className="p-4">
        <form onSubmit={save} noValidate className="space-y-3">
          <Field
            label="Display name"
            value={name}
            maxLength={40}
            autoComplete="nickname"
            onChange={(e) => setName(e.target.value)}
            hint="Shown to everyone next to your ratings."
          />
          <FormError message={error} />
          <Button type="submit" busy={update.isPending} disabled={name.trim() === me.displayName}>
            Save
          </Button>
        </form>
      </Card>
      <Card className="space-y-1 p-4">
        <p className="label">Signed in as</p>
        <p className="font-medium break-all">{me.email}</p>
        <p className="text-sm text-muted">Only you can see your email.{me.isAdmin && ' You’re an admin.'}</p>
      </Card>
      <Button kind="secondary" className="w-full" busy={signingOut} onClick={doSignOut}>
        Sign out
      </Button>
    </div>
  );
}
