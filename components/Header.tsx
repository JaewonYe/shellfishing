'use client';

export default function Header() {
  return (
    <header className="relative flex items-center h-14 px-4 bg-ocean-dark text-white flex-shrink-0 z-40">
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none">🦪</span>
        <h1 className="text-lg font-bold tracking-tight">해루질 맵</h1>
      </div>
    </header>
  );
}
