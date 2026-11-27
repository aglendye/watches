// The Home Screen app can stay open in the background for days, so it may keep
// running an old version after a deploy. When it comes back to the foreground,
// compare the app bundle the server now serves with the one that is running;
// if they differ, reload once to pick up the new version.

function scriptSrc(html: string): string | null {
  const m = /<script[^>]+type="module"[^>]+src="([^"]+)"/.exec(html);
  return m ? m[1] : null;
}

function runningSrc(): string | null {
  const el = document.querySelector<HTMLScriptElement>('script[type="module"][src]');
  return el ? new URL(el.src, location.href).pathname : null;
}

let checking = false;

export async function reloadIfNewVersion(): Promise<boolean> {
  if (!import.meta.env.PROD || checking || !navigator.onLine) return false;
  checking = true;
  try {
    const res = await fetch('/', { cache: 'no-store' });
    if (!res.ok) return false;
    const latest = scriptSrc(await res.text());
    const current = runningSrc();
    if (latest && current && latest !== current) {
      location.reload();
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    checking = false;
  }
}

export { scriptSrc };
