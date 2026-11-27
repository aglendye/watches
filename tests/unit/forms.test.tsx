import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RatingSheet, validateRating } from '../../src/components/RatingSheet';
import { ToastProvider } from '../../src/components/Toast';
import { Autocomplete } from '../../src/components/Autocomplete';
import { validateSignUp } from '../../src/screens/Auth';
import { AddWatch } from '../../src/screens/AddWatch';

function wrap(ui: React.ReactNode, route = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

/** Fake /api/rpc: returns handler(action, params). */
function mockApi(handler: (action: string, params: any) => unknown) {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const { action, params } = JSON.parse(String(init.body));
    return new Response(JSON.stringify({ data: handler(action, params) }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('sign-up validation', () => {
  it('requires email, 8+ char password, and a 1–40 char name', () => {
    expect(validateSignUp({ email: 'x', password: 'short', displayName: '' })).toEqual({
      email: 'Enter a valid email address.',
      password: 'Use at least 8 characters.',
      displayName: 'Enter a display name.',
    });
    expect(validateSignUp({ email: 'a@b.co', password: 'password1', displayName: 'x'.repeat(41) }).displayName).toMatch(/40/);
    expect(validateSignUp({ email: 'a@b.co', password: 'password1', displayName: 'Dad' })).toEqual({});
  });
});

describe('rating sheet validation', () => {
  it('requires a score and rejects future dates', () => {
    expect(validateRating(null, '2026-01-01', '2026-02-01')).toBe('Pick a score.');
    expect(validateRating(7, '2026-02-02', '2026-02-01')).toMatch(/future/);
    expect(validateRating(7, '2026-02-01', '2026-02-01')).toBeNull();
  });

  it('keeps Save disabled until a score is chosen, then saves a new entry', async () => {
    const fetchMock = mockApi(() => ({ id: 'r1' }));
    const onClose = vi.fn();
    wrap(<RatingSheet open onClose={onClose} watchId="w1" watchTitle="Omega Speedmaster" latest={{ score: 7, rated_on: '2026-03-01' }} />);
    expect(screen.getByText(/Your latest:/)).toHaveTextContent('7/10 on Mar 1');
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: 'Score 8 of 10' }));
    expect(save).toBeEnabled();
    expect(screen.getByLabelText('Date rated')).toHaveAttribute('max');
    await userEvent.click(save);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.action).toBe('ratings.create');
    expect(body.params).toMatchObject({ watchId: 'w1', score: 8 });
  });
});

describe('add-watch autocomplete', () => {
  it('suggests existing brands and picks one', async () => {
    function H() {
      const [v, setV] = useState('');
      return <Autocomplete label="Brand" required value={v} onChange={setV} suggestions={v ? ['Omega', 'Oris'] : []} />;
    }
    render(<H />);
    const input = screen.getByRole('combobox', { name: 'Brand' });
    await userEvent.type(input, 'o');
    expect(screen.getByRole('listbox')).toBeVisible();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(input).toHaveValue('Oris');
  });

  it('prefills brand and model from search text and shows an existing match', async () => {
    mockApi((action, params) => {
      if (action === 'brands.suggest') return String(params.prefix).toLowerCase().startsWith('om') ? ['Omega'] : [];
      if (action === 'models.suggest') return ['Speedmaster Professional'];
      if (action === 'watches.lookup') return { id: params.model === 'Speedmaster Professional' ? 'w9' : null };
      return null;
    });
    wrap(<AddWatch />, '/add?q=omega%20speedmaster');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Brand' })).toHaveValue('Omega'));
    const model = screen.getByRole('combobox', { name: 'Model' });
    expect(model).toHaveValue('speedmaster');
    await userEvent.clear(model);
    await userEvent.type(model, 'Speedmaster Professional');
    expect(await screen.findByText(/already in the catalog/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open it' })).toHaveAttribute('href', '/watch/w9?rate=1');
  });
});
