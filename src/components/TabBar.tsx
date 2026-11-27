import { NavLink } from 'react-router-dom';

const ICONS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  add: 'M12 5v14M5 12h14',
  diary: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8h7M8 12h7M8 16h4',
  me: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
};

const TABS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/add', label: 'Add', icon: 'add', end: false },
  { to: '/diary', label: 'My Diary', icon: 'diary', end: false },
  { to: '/me', label: 'Me', icon: 'me', end: false },
];

export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  isActive ? 'text-accent' : 'text-muted'
                }`
              }
            >
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
                <path
                  d={ICONS[t.icon]}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={t.icon === 'add' ? 2.4 : 1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
