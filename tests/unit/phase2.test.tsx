import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OwnershipSheet, validateOwnership } from '../../src/components/OwnershipSheet';
import { ToastProvider } from '../../src/components/Toast';

export function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

export function mockApi(handler: (action: string, params: any) => unknown) {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const { action, params } = JSON.parse(String(init.body));
    return new Response(JSON.stringify({ data: handler(action, params) }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('ownership sheet', () => {
  it('validates dates and notes', () => {
    const today = '2026-11-27';
    expect(validateOwnership('', '', '', today)).toBeNull();
    expect(validateOwnership('2026-11-28', '', '', today)).toMatch(/acquired date can’t be in the future/);
    expect(validateOwnership('', '2026-12-01', '', today)).toMatch(/sold date can’t be in the future/);
    expect(validateOwnership('2020-02-02', '2020-02-01', '', today)).toMatch(/before the acquired/);
    expect(validateOwnership('2020-02-02', '2020-02-02', '', today)).toBeNull();
    expect(validateOwnership('', '', 'x'.repeat(1001), today)).toMatch(/1000/);
  });

  it('shows an error instead of saving a sold date before the acquired date', async () => {
    const fetchMock = mockApi(() => ({ id: 'o1' }));
    wrap(<OwnershipSheet open onClose={() => {}} watchId="w1" title="Rolex GMT-Master II" />);
    await userEvent.type(screen.getByLabelText('Acquired'), '2021-03-01');
    await userEvent.type(screen.getByLabelText('Sold'), '2020-03-01');
    await userEvent.click(screen.getByRole('button', { name: 'Add to collection' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('before the acquired');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('saves a new ownership and closes', async () => {
    const fetchMock = mockApi(() => ({ id: 'o1' }));
    const onClose = vi.fn();
    wrap(<OwnershipSheet open onClose={onClose} watchId="w1" title="Rolex GMT-Master II" />);
    await userEvent.type(screen.getByLabelText('Acquired'), '2021-03-01');
    await userEvent.type(screen.getByLabelText('Notes (optional)'), 'Christmas');
    await userEvent.click(screen.getByRole('button', { name: 'Add to collection' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body).toMatchObject({ action: 'ownerships.create', params: { watchId: 'w1', acquiredOn: '2021-03-01', soldOn: '', notes: 'Christmas' } });
  });

  it('in edit mode offers Mark as sold and Remove', async () => {
    mockApi(() => ({ ok: true }));
    const o = { id: 'o1', user_id: 'u', watch_id: 'w1', acquired_on: '2020-01-01', sold_on: null, notes: null, created_at: '' };
    wrap(<OwnershipSheet open onClose={() => {}} watchId="w1" title="X" ownership={o} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mark as sold today' }));
    expect((screen.getByLabelText('Sold') as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });
});
