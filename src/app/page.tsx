'use client';

import { useState } from 'react';
import Navbar from './components/Navbar';

export default function Home() {
  const [activeTab, setActiveTab] = useState('space');

  return (
    <main className="flex min-h-screen flex-col justify-between bg-[#fcfbf9] text-[#2c221e] p-6 pb-28 overflow-hidden selection:bg-[#f3ece3] relative">
      
      {/* Dynamic Keyframe Injection for the Minimal Radar Sweep */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes radar-pulse {
          0% { transform: scale(0.95); opacity: 0.1; }
          50% { opacity: 0.4; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        .animate-radar { animation: radar-pulse 4s cubic-bezier(0.25, 1, 0.5, 1) infinite; }
      `}} />

      {/* 1. TOP 60% VISUAL VIEWPORT (Airy & Museum-Grade Minimal) */}
      <div className="flex flex-col items-start pt-12 max-w-md w-full mx-auto space-y-2 flex-1">
        <h1 className="text-3xl font-light tracking-wide text-[#2c221e]">
          Topclass Experience
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#a3978e]">
          {activeTab === 'space' && 'Presence & Identity'}
          {activeTab === 'identity' && 'Sovereign Persona'}
          {activeTab === 'proximity' && 'Encounter Engine Matrix'}
        </p>
      </div>

      {/* 2. BOTTOM 40% ERGONOMIC INTERACTION ZONE (Strict Thumb Law Compliance) */}
      <div className="w-full max-w-md mx-auto flex flex-col justify-end h-[48vh] space-y-6 mb-4">
        
        {/* TAB LAYER A: SPACE WORKSPACE */}
        {activeTab === 'space' && (
          <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-[#f3ece3] shadow-sm space-y-4">
            <p className="text-sm font-light text-[#5a4d46] leading-relaxed">
              Welcome to your premium application framework. The workspace environmental node is currently active and secure.
            </p>
            <div className="w-full py-4 bg-[#2c221e] text-[#fcfbf9] text-center text-sm font-medium tracking-wide rounded-xl active:scale-[0.98] transition-transform duration-150 cursor-pointer">
              Initialize Workspace
            </div>
          </div>
        )}

        {/* TAB LAYER B: IDENTITY PROFILE CARD SYSTEM */}
        {activeTab === 'identity' && (
          <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-xl border border-[#f3ece3] shadow-md space-y-5 relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-[#f3ece3]/40 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-[#f3ece3] border border-[#e8ded3] flex items-center justify-center text-lg text-[#5a4d46] font-light shadow-inner">
                MW
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-normal tracking-wide text-[#2c221e]">Michya Wuorr</h3>
                <p className="text-xs tracking-wider text-[#a3978e] font-light">Creative Director & Founder</p>
              </div>
            </div>

            <hr className="border-t border-[#f3ece3]" />

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#a3978e] font-light tracking-wide">Focus</span>
                <span className="text-[#5a4d46] font-medium tracking-wide">Architectural Systems</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#a3978e] font-light tracking-wide">Aura Node</span>
                <span className="text-[#5a4d46] font-mono tracking-wide">0x7F...89A2</span>
              </div>
            </div>

            <div className="w-full py-3.5 bg-gradient-to-r from-[#2c221e] to-[#42352f] text-[#fcfbf9] text-center text-xs font-light tracking-widest uppercase rounded-xl shadow-sm active:scale-[0.99] transition-all duration-150 relative cursor-pointer">
              <span className="opacity-80">Haptic Swipe to Share</span>
            </div>
          </div>
        )}

        {/* TAB LAYER C: PROXIMITY SCANNED NODES */}
        {activeTab === 'proximity' && (
          <div className="space-y-4">
            
            {/* Minimal Architectural Radar Display Panel */}
            <div className="h-28 w-full rounded-2xl bg-white/40 border border-[#f3ece3]/80 relative flex items-center justify-center overflow-hidden">
              {/* Concentric radar line pulses */}
              <div className="absolute w-20 h-20 border border-[#2c221e]/10 rounded-full animate-radar" />
              <div className="absolute w-36 h-36 border border-[#2c221e]/5 rounded-full animate-radar [animation-delay:1.5s]" />
              <div className="absolute w-52 h-52 border border-[#2c221e]/5 rounded-full animate-radar [animation-delay:3s]" />
              
              {/* Core scanning ping indicator */}
              <div className="flex flex-col items-center space-y-1.5 z-10">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-[#2c221e] rounded-full animate-ping" />
                  <span className="text-[10px] tracking-widest uppercase font-light text-[#a3978e]">Aura Scan Active</span>
                </div>
                <span className="text-xs font-light text-[#5a4d46]">1 Secure Node Discovered</span>
              </div>
            </div>

            {/* Encounter Card Stack Surface */}
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-[#f3ece3] shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform duration-150 cursor-pointer">
              <div className="flex items-center space-x-3.5">
                {/* Minimalist target indicator frame */}
                <div className="w-10 h-10 rounded-xl bg-[#fcfbf9] border border-[#f3ece3] flex items-center justify-center text-xs text-[#a3978e] font-light">
                  LF
                </div>
                <div className="flex flex-col">
                  <h4 className="text-sm font-normal tracking-wide text-[#2c221e]">Lorine's Fresh Fish</h4>
                  <p className="text-[11px] text-[#a3978e] font-light tracking-wide">Brand & Premium Supply Node</p>
                </div>
              </div>
              
              {/* Handshake prompt chevron marker */}
              <div className="text-xs uppercase tracking-widest font-medium text-[#2c221e] px-3 py-2 bg-[#f3ece3]/50 rounded-lg">
                Connect
              </div>
            </div>
            
          </div>
        )}

      </div>

      {/* 3. NAVIGATION HOUSING */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  );
}
