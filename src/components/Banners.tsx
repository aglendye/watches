import { useEffect, useState } from 'react';
import { shouldShowInstallBanner } from '../lib/install';

export function InstallBanner() {
  const [show] = useState(shouldShowInstallBanner);
  if (!show) return null;
  return (
    <div role="note" className="border border-accent bg-accent-soft px-4 py-3 text-sm text-ink">
      <p className="font-semibold">Install first</p>
      <p className="mt-1">
        Tap <span className="font-semibold">Share</span>
        <svg viewBox="0 0 24 24" className="mx-1 inline size-4 align-[-2px]" aria-hidden="true">
          <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        then <span className="font-semibold">Add to Home Screen</span>. Open the app from your Home Screen and
        create your account there.
      </p>
    </div>
  );
}

export function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  if (online) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-40 bg-ink px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-center text-sm font-medium text-bg"
    >
      You’re offline. Changes can’t be saved until you reconnect.
    </div>
  );
}
