'use client';

export type Tab = 'draw' | 'rank';

type Props = { tab: Tab; onChange: (tab: Tab) => void };

const TABS: { id: Tab; label: string }[] = [
  { id: 'draw', label: '뽑기' },
  { id: 'rank', label: '랭킹' },
];

export default function TopBar({ tab, onChange }: Props) {
  return (
    <nav className="topbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`topbar-tab${t.id === tab ? ' is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
