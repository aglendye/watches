import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Kind = 'success' | 'error';
interface ToastMsg {
  id: number;
  text: string;
  kind: Kind;
}

const ToastContext = createContext<(text: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastMsg[]>([]);
  const next = useRef(1);

  const show = useCallback((text: string, kind: Kind = 'success') => {
    const id = next.current++;
    setItems((xs) => [...xs, { id, text, kind }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto max-w-md px-4 py-3 text-sm font-semibold ${
              t.kind === 'error' ? 'bg-danger text-bg' : 'bg-accent text-on-accent'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
