'use client';

export type AppTab = 'map' | 'ban' | 'my';

interface BottomNavProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { key: AppTab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'map',
    label: '지도',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    key: 'ban',
    label: '금지정보',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M6.5 6.5 Q9 9 12 9 Q15 9 17.5 6.5"/>
        <path d="M6.5 17.5 Q9 15 12 15 Q15 15 17.5 17.5"/>
        <ellipse cx="12" cy="12" rx="3" ry="6"/>
        <line x1="4" y1="4" x2="20" y2="20" strokeDasharray="3 2"/>
      </svg>
    ),
  },
  {
    key: 'my',
    label: '더보기',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
  },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="flex border-t bg-white flex-shrink-0 h-14 z-40">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors
            ${active === tab.key ? 'text-ocean-dark' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {tab.icon}
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
