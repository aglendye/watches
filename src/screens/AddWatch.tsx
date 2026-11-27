import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Autocomplete } from '../components/Autocomplete';
import { Button, Field, FormError } from '../components/ui';
import { call, errorMessage } from '../lib/api';
import { useAddWatch, useBrandSuggestions, useLookup, useModelSuggestions } from '../lib/queries';

function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Splits search text into brand + model when it starts with a known brand
 * ("omega speedmaster" → Omega / speedmaster). Otherwise it all goes in Model.
 */
export async function prefillFromSearch(q: string): Promise<{ brand: string; model: string }> {
  const text = q.trim().replace(/\s+/g, ' ');
  const words = text.split(' ');
  if (words.length < 2) return { brand: '', model: text };
  try {
    const brands = await call<string[]>('brands.suggest', { prefix: words[0] });
    // Longest brand name that the text starts with ("Grand Seiko" before "Grand").
    const match = brands
      .filter((b) => text.toLowerCase().startsWith(b.toLowerCase() + ' '))
      .sort((a, b) => b.length - a.length)[0];
    if (match) return { brand: match, model: text.slice(match.length).trim() };
  } catch {
    /* fall through */
  }
  return { brand: '', model: text };
}

export function AddWatch() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const add = useAddWatch();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = params.get('q');
    if (!q) return;
    let live = true;
    void prefillFromSearch(q).then((p) => {
      if (!live) return;
      setBrand((b) => b || p.brand);
      setModel((m) => m || p.model);
    });
    return () => {
      live = false;
    };
  }, [params]);

  const dBrand = useDebounced(brand);
  const dModel = useDebounced(model);
  const dRef = useDebounced(reference);
  const brands = useBrandSuggestions(dBrand);
  const models = useModelSuggestions(dBrand, dModel);
  const existing = useLookup(dBrand, dModel, dRef);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) {
      setError('Brand and model are required.');
      return;
    }
    setError(null);
    try {
      const { id } = await add.mutateAsync({ brand: brand.trim(), model: model.trim(), reference: reference.trim() });
      navigate(`/watch/${id}?rate=1`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Add a watch</h1>
        <p className="mt-1 text-muted">
          Tip: <Link to="/search" className="font-medium text-accent">search</Link> first. If it’s already here,
          just rate it.
        </p>
      </header>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Autocomplete
          label="Brand"
          required
          maxLength={80}
          value={brand}
          onChange={setBrand}
          suggestions={brand.trim() ? brands.data ?? [] : []}
          autoFocus={!params.get('q')}
        />
        <Autocomplete
          label="Model"
          required
          maxLength={120}
          value={model}
          onChange={setModel}
          suggestions={models.data ?? []}
        />
        <Field
          label="Reference (optional)"
          value={reference}
          maxLength={60}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setReference(e.target.value)}
          hint="Leave blank if you’re not sure. You can rate the model in general."
        />
        {existing.data?.id && (
          <p role="status" className="rounded-xl bg-accent-soft px-3 py-2 text-sm">
            This watch is already in the catalog.{' '}
            <Link to={`/watch/${existing.data.id}?rate=1`} className="font-semibold text-accent underline">
              Open it
            </Link>
          </p>
        )}
        <FormError message={error} />
        <Button type="submit" busy={add.isPending} className="w-full">
          {existing.data?.id ? 'Open and rate' : 'Save and rate'}
        </Button>
      </form>
    </div>
  );
}
