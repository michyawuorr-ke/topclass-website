'use client';

import { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';
import Navbar from './components/Navbar';

interface Profile {
  name: string;
  title: string;
  focus: string;
  current_intent: string;
  node_hash: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('identity'); // Defaulting to Identity for onboarding focus
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    focus: '',
    current_intent: ''
  });

  // Mock a user ID session for MVP demonstration - in production, this maps to auth.uid()
  const mockUserId = '00000000-0000-0000-0000-000000000001';

  // 1. Check if profile already exists in Supabase on launch
  useEffect(() => {
    async function checkExistingProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', mockUserId)
        .single();
      
      if (data) {
        setProfile(data);
      }
    }
    checkExistingProfile();
  }, []);

  // 2. Write the profile data to Supabase
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setLoading(true);

    // Generate a beautiful procedural unique node serial hash for their broadcast identity
    const generatedHash = '0x' + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase();

    const newProfile = {
      id: mockUserId,
      name: formData.name,
      title: formData.title,
      focus: formData.focus,
      current_intent: formData.current_intent,
      node_hash: generatedHash
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(newProfile);

    if (!error) {
      setProfile(newProfile);
    } else {
      console.error('Error writing identity node:', error.message);
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col justify-between bg-[#fcfbf9] text-[#2c221e] p-6 pb-28 overflow-hidden relative selection:bg-[#f3ece3]">
      
      {/* 1. TOP 60% VISUAL VIEWPORT (Airy & Museum-Grade Minimal) */}
      <div className="flex flex-col items-start pt-12 max-w-md w-full mx-auto space-y-2 flex-1">
        <h1 className="text-3xl font-light tracking-wide text-[#2c221e]">
          Topclass Experience
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#a3978e]">
          {activeTab === 'space' && 'Presence & Identity'}
          {activeTab === 'identity' && (profile ? 'Sovereign Persona Active' : 'Initialize Identity Node')}
          {activeTab === 'proximity' && 'Encounter Engine Matrix'}
        </p>
      </div>

      {/* 2. BOTTOM 40% ERGONOMIC INTERACTION ZONE (Strict Thumb Law Compliance) */}
      <div className="w-full max-w-md mx-auto flex flex-col justify-end min-h-[46vh] space-y-6 mb-4">
        
        {/* IDENTITY TAB: CONDITIONAL ONBOARDING OR CARD DISPLAY */}
        {activeTab === 'identity' && (
          !profile ? (
            /* A. THE INITIALIZATION FORM SCREEN */
            <form onSubmit={handleCreateProfile} className="p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-[#f3ece3] shadow-md space-y-3.5 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-sm uppercase tracking-wider text-[#5a4d46] font-medium">Manifest Profile</h3>
                <p className="text-[11px] text-[#a3978e] font-light">Establish your persistent cryptographic operational presence.</p>
              </div>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 bg-[#fcfbf9] border border-[#f3ece3] rounded-xl text-xs placeholder-[#a3978e] focus:outline-none focus:border-[#2c221e] transition-colors"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Professional Title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-3 bg-[#fcfbf9] border border-[#f3ece3] rounded-xl text-xs placeholder-[#a3978e] focus:outline-none focus:border-[#2c221e] transition-colors"
                />
                <input 
                  type="text" 
                  placeholder="Focus Domain (e.g. Architectural Systems)"
                  value={formData.focus}
                  onChange={(e) => setFormData({...formData, focus: e.target.value})}
                  className="w-full p-3 bg-[#fcfbf9] border border-[#f3ece3] rounded-xl text-xs placeholder-[#a3978e] focus:outline-none focus:border-[#2c221e] transition-colors"
                />
                <input 
                  type="text" 
                  placeholder="Current Intent (e.g. Sourcing Rare Materials)"
                  value={formData.current_intent}
                  onChange={(e) => setFormData({...formData, current_intent: e.target.value})}
                  className="w-full p-3 bg-[#fcfbf9] border border-[#f3ece3] rounded-xl text-xs placeholder-[#a3978e] focus:outline-none focus:border-[#2c221e] transition-colors"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-[#2c221e] text-[#fcfbf9] text-xs font-light tracking-widest uppercase rounded-xl transition-all duration-150 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Securing Node...' : 'Save & Broadcast Node'}
              </button>
            </form>
          ) : (
            /* B. THE MATURED PREMIUM USER PROFILE CARD */
            <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-xl border border-[#f3ece3] shadow-md space-y-5 relative overflow-hidden animate-fadeIn">
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-[#f3ece3]/40 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-[#f3ece3] border border-[#e8ded3] flex items-center justify-center text-lg text-[#5a4d46] font-light shadow-inner">
                  {profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-normal tracking-wide text-[#2c221e]">{profile.name}</h3>
                  <p className="text-xs tracking-wider text-[#a3978e] font-light">{profile.title || 'Sovereign Node Partner'}</p>
                </div>
              </div>

              <hr className="border-t border-[#f3ece3]" />

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#a3978e] font-light tracking-wide">Focus Domain</span>
                  <span className="text-[#5a4d46] font-medium tracking-wide text-right max-w-[180px] truncate">{profile.focus || 'Unspecified'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#a3978e] font-light tracking-wide">Current Intent</span>
                  <span className="text-[#5a4d46] font-medium tracking-wide text-right max-w-[180px] truncate">{profile.current_intent || 'General Matrix Open'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#a3978e] font-light tracking-wide">Sovereign Hash</span>
                  <span className="text-[#5a4d46] font-mono tracking-wide">{profile.node_hash}</span>
                </div>
              </div>

              <div className="w-full py-3.5 bg-gradient-to-r from-[#2c221e] to-[#42352f] text-[#fcfbf9] text-center text-xs font-light tracking-widest uppercase rounded-xl shadow-sm relative cursor-pointer">
                <span className="opacity-80">Haptic Swipe to Share</span>
              </div>
            </div>
          )
        )}

        {/* FALLBACK FOR OTHER UNCONFIGURED LABELS */}
        {activeTab !== 'identity' && (
          <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-[#f3ece3] shadow-sm text-center py-12">
            <span className="text-xs uppercase tracking-widest text-[#a3978e] font-light">Aura Core Synchronization Required</span>
          </div>
        )}

      </div>

      {/* 3. NAVIGATION HOUSING */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  );
}
