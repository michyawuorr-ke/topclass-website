'use client';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const tabs = [
    { id: 'space', label: 'Space' },
    { id: 'identity', label: 'Identity' },
    { id: 'proximity', label: 'Proximity' }
  ];

  return (
    <div className="w-full max-w-md mx-auto px-6 pb-6 absolute bottom-0 left-0 right-0 z-50">
      <nav className="flex justify-around items-center bg-white/40 backdrop-blur-xl border border-[#f3ece3]/60 rounded-2xl p-2 shadow-sm selection:bg-transparent">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs tracking-widest uppercase transition-all duration-300 rounded-xl font-light text-center relative z-10 execution-touch ${
                isActive ? 'text-[#2c221e] font-medium' : 'text-[#a3978e] hover:text-[#5a4d46]'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 bg-[#f3ece3]/60 rounded-xl -z-10 layout-id-active transition-all duration-300" />
              )}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
