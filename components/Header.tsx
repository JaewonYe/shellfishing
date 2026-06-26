'use client';

export default function Header() {
  return (
    <header className="relative flex items-center h-14 px-4 bg-ocean-dark text-white flex-shrink-0 z-40">
      <div className="flex items-center gap-2">
        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" fill="#4fc3f7" opacity="0.3"/>
          <path d="M6 18c2-3 5-4 7-2s5 2 7 0 4-1 6 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6 22c2-3 5-4 7-2s5 2 7 0 4-1 6 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          <path d="M16 8v7M13 11l3 4 3-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 className="text-lg font-bold tracking-tight">공유해</h1>
      </div>
    </header>
  );
}
