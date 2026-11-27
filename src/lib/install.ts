/** True when running in the installed Home Screen app (or any standalone PWA). */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

export function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports itself as Mac; touch support tells them apart.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Show install instructions: an iPhone/iPad browser tab, not the installed app. */
export function shouldShowInstallBanner(): boolean {
  return isIos() && !isStandalone();
}
