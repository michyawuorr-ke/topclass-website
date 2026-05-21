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
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-[#2c221e]/95 backdrop-blur-md px-2 py-2 rounded-2xl shadow-xl border border-[#42352f] z-50">
      <div className="flex justify-between items-center w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center text-xs font-light tracking-widest uppercase transition-all duration-200 rounded-xl ${
                isActive 
                  ? 'bg-[#fcfbf9] text-[#2c221e] font-normal shadow-sm' 
                  : 'text-[#a3978e] hover:text-[#fcfbf9]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
