import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { MovementType, WatchDetail } from '../../shared/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { Button, ErrorState, Field, FormError, SkeletonRows } from '../components/ui';
import { errorMessage } from '../lib/api';
import { useDeleteWatch, useUpdateWatch, useWatch } from '../lib/queries';

interface Form {
  brand: string;
  model: string;
  reference: string;
  case_size_mm: string;
  movement_type: string;
  case_material: string;
  dial_color: string;
  water_resistance_m: string;
  year_introduced: string;
  nickname: string;
}

function toForm(w: WatchDetail): Form {
  const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
  return {
    brand: w.brand_name,
    model: w.model_name,
    reference: s(w.reference),
    case_size_mm: s(w.case_size_mm),
    movement_type: s(w.movement_type),
    case_material: s(w.case_material),
    dial_color: s(w.dial_color),
    water_resistance_m: s(w.water_resistance_m),
    year_introduced: s(w.year_introduced),
    nickname: typeof w.extras?.nickname === 'string' ? w.extras.nickname : '',
  };
}

const num = (s: string) => (s.trim() === '' ? null : Number(s));

export function validateSpecs(f: Form): string | null {
  const size = num(f.case_size_mm);
  if (size !== null && (!Number.isFinite(size) || size < 10 || size > 80)) return 'Case size must be between 10 and 80 mm.';
  const wr = num(f.water_resistance_m);
  if (wr !== null && (!Number.isInteger(wr) || wr < 0)) return 'Water resistance must be a whole number of meters.';
  const year = num(f.year_introduced);
  if (year !== null && (!Number.isInteger(year) || year < 1800 || year > 2100)) return 'Year must be between 1800 and 2100.';
  return null;
}

export function EditWatch() {
  const { id = '' } = useParams();
  const watch = useWatch(id);
  if (watch.isPending) return <SkeletonRows rows={6} />;
  if (watch.isError) return <ErrorState message={errorMessage(watch.error)} onRetry={() => void watch.refetch()} />;
  return <EditForm w={watch.data} />;
}

function EditForm({ w }: { w: WatchDetail }) {
  const navigate = useNavigate();
  const toast = useToast();
  const update = useUpdateWatch();
  const remove = useDeleteWatch();
  const movementId = useId();
  const [form, setForm] = useState<Form>(() => toForm(w));
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => setForm(toForm(w)), [w]);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const identityChanged =
    form.brand.trim() !== w.brand_name || form.model.trim() !== w.model_name || form.reference.trim() !== (w.reference ?? '');

  async function save(e: FormEvent) {
    e.preventDefault();
    const problem = validateSpecs(form);
    if (problem) return setError(problem);
    if (w.can_edit_identity && (!form.brand.trim() || !form.model.trim())) return setError('Brand and model are required.');
    setError(null);
    try {
      await update.mutateAsync({
        id: w.watch_id,
        case_size_mm: num(form.case_size_mm),
        movement_type: (form.movement_type || null) as MovementType | null,
        case_material: form.case_material,
        dial_color: form.dial_color,
        water_resistance_m: num(form.water_resistance_m),
        year_introduced: num(form.year_introduced),
        nickname: form.nickname.trim() || null,
        ...(w.can_edit_identity && identityChanged
          ? { brand: form.brand.trim(), model: form.model.trim(), reference: form.reference.trim() || null }
          : {}),
      });
      toast('Details saved');
      navigate(`/watch/${w.watch_id}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function doDelete() {
    try {
      await remove.mutateAsync(w.watch_id);
      toast('Watch deleted');
      navigate('/', { replace: true });
    } catch (err) {
      setConfirming(false);
      setError(errorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <Link to={`/watch/${w.watch_id}`} className="inline-flex min-h-11 items-center font-medium text-accent">
        ‹ Back
      </Link>
      <h1 className="text-2xl font-bold">Edit details</h1>
      <form onSubmit={save} noValidate className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="label mb-2">Identity</legend>
          {!w.can_edit_identity && (
            <p className="text-sm text-muted">
              Only the person who added this watch (or an admin) can change its brand, model, or reference.
            </p>
          )}
          <Field label="Brand" value={form.brand} onChange={set('brand')} disabled={!w.can_edit_identity} maxLength={80} />
          <Field label="Model" value={form.model} onChange={set('model')} disabled={!w.can_edit_identity} maxLength={120} />
          <Field
            label="Reference (optional)"
            value={form.reference}
            onChange={set('reference')}
            disabled={!w.can_edit_identity}
            maxLength={60}
            autoCapitalize="characters"
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="label mb-2">Specs (anyone can edit)</legend>
          <Field
            label="Nickname"
            value={form.nickname}
            onChange={set('nickname')}
            maxLength={80}
            autoCapitalize="words"
            hint="What collectors call it, like Batman or Hulk. Shown in search."
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Case size (mm)" inputMode="decimal" value={form.case_size_mm} onChange={set('case_size_mm')} />
            <Field label="Water resistance (m)" inputMode="numeric" value={form.water_resistance_m} onChange={set('water_resistance_m')} />
          </div>
          <div>
            <label htmlFor={movementId} className="mb-1 block text-sm font-medium">
              Movement
            </label>
            <select
              id={movementId}
              value={form.movement_type}
              onChange={set('movement_type')}
              className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink"
            >
              <option value="">Not specified</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual wind</option>
              <option value="quartz">Quartz</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Field label="Case material" value={form.case_material} onChange={set('case_material')} maxLength={80} />
          <Field label="Dial color" value={form.dial_color} onChange={set('dial_color')} maxLength={80} />
          <Field label="Year introduced" inputMode="numeric" value={form.year_introduced} onChange={set('year_introduced')} />
        </fieldset>

        <FormError message={error} />
        <div className="flex gap-2">
          <Button kind="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" busy={update.isPending} className="flex-1">
            Save
          </Button>
        </div>
      </form>

      {w.can_delete && (
        <div className="border-t border-line pt-5">
          <Button kind="danger" onClick={() => setConfirming(true)}>
            Delete this watch
          </Button>
          <p className="mt-2 text-sm text-muted">Possible only while nobody else has rated it.</p>
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        title="Delete this watch?"
        message="It will be removed from the catalog along with your own entries for it. This can’t be undone."
        confirmLabel="Delete"
        busy={remove.isPending}
        onConfirm={doDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
