'use client';
import React, { useState } from 'react';

export default function Home() {
  const [activeField, setActiveField] = useState<string | null>(null);

  return (
    <main className="relative min-h-screen bg-[#1C1613] text-[#F7F4EF] flex flex-col justify-between overflow-hidden font-sans select-none antialiased">
      
      {/* Dynamic Ambient Canopy (Upper 60%) */}
      <div className="relative flex-1 flex flex-col justify-center px-8 pt-16 pb-8 max-w-md mx-auto w-full z-10 transition-all duration-700">
        
        {/* Living Aura Engine - Dynamic Glowing Core */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-tr from-[#4A3B32] to-[#2C221E] opacity-30 blur-[60px] pointer-events-none mix-blend-screen animate-[pulse_8s_infinite_ease-in-out]" />
        
        <div className="relative space-y-4 border-l-[3px] border-[#4A3B32]/40 pl-6 transition-transform duration-500 transform translate-y-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#F2ECE7] animate-ping opacity-75" />
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#F2ECE7]/60 font-semibold">System Active</p>
          </div>
          
          <h1 className="text-4xl font-extralight tracking-tight leading-none text-[#F7F4EF]">
            Topclass <span className="font-serif italic text-[#F2ECE7] font-normal block mt-1">Experience</span>
          </h1>
          
          <p className="text-sm text-[#F2ECE7]/60 leading-relaxed font-light max-w-[260px] pt-2">
            Initialize your identity node to manifest a persistent cryptographic operational presence.
          </p>
        </div>
      </div>

      {/* Layered Kinetic Card Architecture (Bottom 40% Ergonomic Thumb Zone) */}
      <div className="relative h-[46vh] bg-gradient-to-b from-[#FDFDFD] to-[#F7F4EF] text-[#2C221E] rounded-t-[2.75rem] shadow-[0_-25px_60px_rgba(28,22,19,0.25)] border-t border-[#F2ECE7]/80 px-8 pt-8 pb-10 flex flex-col justify-between max-w-md mx-auto w-full z-20 transition-all duration-500">
        
        {/* Kinetic Accent Bar */}
        <div className="w-12 h-1 bg-[#2C221E]/10 rounded-full mx-auto -mt-2 mb-6" />

        {/* Structured Field Modules */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          
          {/* Full Name Field */}
          <div 
            className={`group relative rounded-xl p-3 border transition-all duration-300 ${
              activeField === 'name' 
                ? 'bg-white border-[#2C221E] shadow-[0_4px_20px_rgba(44,34,30,0.06)]' 
                : 'bg-[#F2ECE7]/40 border-transparent hover:bg-[#F2ECE7]/60'
            }`}
          >
            <label className="block text-[10px] uppercase tracking-wider text-[#2C221E]/50 font-bold transition-colors duration-300 group-hover:text-[#2C221E]/70">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Alexander Vance"
              onFocus={() => setActiveField('name')}
              onBlur={() => setActiveField(null)}
              className="w-full bg-transparent border-none p-0 pt-1 text-sm text-[#2C221E] focus:outline-none placeholder-[#2C221E]/30 font-semibold"
            />
          </div>

          {/* Professional Title Field */}
          <div 
            className={`group relative rounded-xl p-3 border transition-all duration-300 ${
              activeField === 'title' 
                ? 'bg-white border-[#2C221E] shadow-[0_4px_20px_rgba(44,34,30,0.06)]' 
                : 'bg-[#F2ECE7]/40 border-transparent hover:bg-[#F2ECE7]/60'
            }`}
          >
            <label className="block text-[10px] uppercase tracking-wider text-[#2C221E]/50 font-bold">Professional Title</label>
            <input 
              type="text" 
              placeholder="e.g. Principal Systems Designer"
              onFocus={() => setActiveField('title')}
              onBlur={() => setActiveField(null)}
              className="w-full bg-transparent border-none p-0 pt-1 text-sm text-[#2C221E] focus:outline-none placeholder-[#2C221E]/30 font-semibold"
            />
          </div>

          {/* Split Domain & Intent row wrapped in structured spacing */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              className={`group relative rounded-xl p-3 border transition-all duration-300 ${
                activeField === 'domain' 
                  ? 'bg-white border-[#2C221E] shadow-[0_4px_20px_rgba(44,34,30,0.06)]' 
                  : 'bg-[#F2ECE7]/40 border-transparent hover:bg-[#F2ECE7]/60'
              }`}
            >
              <label className="block text-[10px] uppercase tracking-wider text-[#2C221E]/50 font-bold">Focus Domain</label>
              <input 
                type="text" 
                placeholder="Architectural"
                onFocus={() => setActiveField('domain')}
                onBlur={() => setActiveField(null)}
                className="w-full bg-transparent border-none p-0 pt-1 text-xs text-[#2C221E] focus:outline-none placeholder-[#2C221E]/30 font-semibold"
              />
            </div>

            <div 
              className={`group relative rounded-xl p-3 border transition-all duration-300 ${
                activeField === 'intent' 
                  ? 'bg-white border-[#2C221E] shadow-[0_4px_20px_rgba(44,34,30,0.06)]' 
                  : 'bg-[#F2ECE7]/40 border-transparent hover:bg-[#F2ECE7]/60'
              }`}
            >
              <label className="block text-[10px] uppercase tracking-wider text-[#2C221E]/50 font-bold">Current Intent</label>
              <input 
                type="text" 
                placeholder="Sourcing Nodes"
                onFocus={() => setActiveField('intent')}
                onBlur={() => setActiveField(null)}
                className="w-full bg-transparent border-none p-0 pt-1 text-xs text-[#2C221E] focus:outline-none placeholder-[#2C221E]/30 font-semibold"
              />
            </div>
          </div>

        </div>

        {/* Intelligent Feedback Action Trigger */}
        <button className="w-full bg-[#2C221E] text-[#F7F4EF] text-xs uppercase tracking-[0.15em] py-4 rounded-xl font-bold shadow-xl hover:bg-[#4A3B32] active:bg-[#1C1613] active:scale-[0.99] transition-all duration-300 mt-4 outline-none">
          Save & Broadcast Node
        </button>

      </div>
    </main>
  );
}
