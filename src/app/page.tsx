'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface Networker {
  id: string;
  name: string;
  title: string;
  org: string;
  intent: string;
  ring_color: string;
  timestamp: string;
  notes?: string;
}

export default function OreetiSovereignEngine() {
  // System UI States
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('presence');
  const [isVisible, setIsVisible] = useState(false);
  const [blackoutMode, setBlackoutMode] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Presence Engine Initialized');
  
  // Profile & Session States
  const [profile, setProfile] = useState({ name: 'Michy', title: 'Principal Architecture Lead', org: 'Oreeti Labs' });
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [sessionAnchor, setSessionAnchor] = useState('OFFLINE');
  const [showIntentModal, setShowIntentModal] = useState(false);

  // Mock Active Session Data for Ephemeral Feed (Tab 1) & Vault (Tab 2)
  const [activeUsers, setActiveUsers] = useState<Networker[]>([
    { id: '1', name: 'Alex', title: 'Design Director', org: 'Minimalist Studio', intent: 'Looking for container framework engineers', ring_color: '#E6A15C', timestamp: new Date().toISOString() },
    { id: '2', name: 'Elena', title: 'Materials Curator', org: 'Silk & Stone Co', intent: 'Sourcing organic textures for digital showroom design', ring_color: '#D9C3B0', timestamp: new Date(Date.now() - 50 * 3600 * 1000).toISOString() } // > 48hrs
  ]);

  const [vaultNotes, setVaultNotes] = useState<Record<string, string>>({
    '1': 'Met near the structural concrete exhibition booth.'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        setSessionAnchor(`SESSION: ${room.toUpperCase()}`);
      }
    }
  }, []);

  // Visibility Toggle & Intent Prompt Rule
  const handleVisibilityToggle = () => {
    if (!isVisible) {
      setShowIntentModal(true);
    } else {
      setIsVisible(false);
      setSystemStatus('Node Invisible. Discovery Locked.');
    }
  };

  const confirmVisibility = async () => {
    if (!currentIntent.trim()) return;
    setShowIntentModal(false);
    setIsVisible(true);
    setSystemStatus('Broadcasting Active Node...');
    
    try {
      await supabase.from('encounters').insert([{ node_anchor: sessionAnchor, status: 'visible_broadcast' }]);
    } catch (e) {}
  };

  // Connection Request -> Blackout Protocol Trigger
  const triggerConnection = async (targetName: string) => {
    setBlackoutMode(true);
    setSystemStatus(`Connection established with ${targetName}`);
    try {
      await supabase.from('encounters').insert([{ node_anchor: sessionAnchor, status: `handshake:${targetName}` }]);
    } catch (e) {}
  };

  // Helper to determine 48-Hour Momentum Engine priority
  const isWithin48Hours = (timestampString: string) => {
    const hours = (Date.now() - new Date(timestampString).getTime()) / (1000 * 60 * 60);
    return hours <= 48;
  };

  // --- SCREEN BLACKOUT PROTOCOL VIEW ---
  if (blackoutMode) {
    return (
      <div onClick={() => setBlackoutMode(false)} style={{
        width: '100vw', height: '100vh', backgroundColor: '#0E0908',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px', textAlign: 'center', boxSizing: 'border-box'
      }}>
        <div style={{
          border: '1px solid rgba(245, 230, 211, 0.15)', padding: '48px 24px', borderRadius: '32px', backgroundColor: 'rgba(38, 25, 22, 0.3)', backdropFilter: 'blur(20px)'
        }}>
          <h1 style={{ fontSize: '36px', fontWeight: '200', color: '#F5E6D3', letterSpacing: '-1px', margin: '0 0 16px 0' }}>Connection Made.</h1>
          <p style={{ fontSize: '16px', color: '#A68F81', fontWeight: '300', letterSpacing: '0.5px', lineHeight: '1.6', margin: 0 }}>Look up and meet.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#140D0C', color: '#FDFBF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      
      {/* UPPER 60%: Dynamic Contextual Feed & Vault Space */}
      <div style={{ flex: 1, padding: '24px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* TAB 1: THE ROOM VIEW */}
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase', marginBottom: '24px' }}>
              {sessionAnchor}
            </div>
            
            {!isVisible ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#6E5950', fontSize: '14px', fontWeight: '300', padding: '0 24px' }}>
                Anti-Lurker Reciprocity Active.<br />Toggle "Visible Mode" in Presence to unlock discovery.
              </div>
            ) : activeUsers.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#A68F81', fontSize: '14px', fontWeight: '300', padding: '0 24px' }}>
                You are the first anchor node in this room. Keep your screen active or review the Vault while the room fills.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeUsers.map(user => (
                  <div key={user.id} style={{
                    backgroundColor: 'rgba(38, 25, 22, 0.4)', borderRadius: '24px', padding: '20px',
                    border: `1px solid ${user.ring_color}`, boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: '400', color: '#F5E6D3' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#A68F81', marginTop: '2px' }}>{user.title} — {user.org}</div>
                    <div style={{ fontSize: '13px', color: '#D9C3B0', marginTop: '12px', fontStyle: 'italic', fontWeight: '300' }}>"{user.intent}"</div>
                    <div onClick={() => triggerConnection(user.name)} style={{
                      marginTop: '16px', padding: '10px', borderRadius: '12px', border: '1px solid rgba(245, 230, 211, 0.2)',
                      textAlign: 'center', fontSize: '12px', letterSpacing: '1px', color: '#F5E6D3', cursor: 'pointer', backgroundColor: 'rgba(20, 13, 12, 0.5)'
                    }}>CONNECT</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: THE VAULT VIEW */}
        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase', marginBottom: '24px' }}>
              Relationship Vault
            </div>
            
            {/* Split view into 48h Momentum Engine vs History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#E6A15C', letterSpacing: '1.5px', marginBottom: '10px', fontWeight: '600' }}>48-HOUR MOMENTUM FEED</div>
                {activeUsers.filter(u => isWithin48Hours(u.timestamp)).map(user => (
                  <div key={user.id} style={{ backgroundColor: 'rgba(38, 25, 22, 0.25)', border: '1px solid rgba(245, 230, 211, 0.08)', borderRadius: '20px', padding: '16px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#F5E6D3', fontWeight: '400' }}>{user.name}</span>
                      <span style={{ fontSize: '11px', color: '#E6A15C' }}>Active Momentum</span>
                    </div>
                    <textarea 
                      placeholder="Add safe contextual notes here..."
                      value={vaultNotes[user.id] || ''}
                      onChange={(e) => setVaultNotes({...vaultNotes, [user.id]: e.target.value})}
                      style={{ width: '100%', background: '#0E0908', border: '1px solid rgba(245, 230, 211, 0.05)', borderRadius: '8px', color: '#D9C3B0', padding: '8px', marginTop: '10px', fontSize: '12px', resize: 'none' }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: '10px', color: '#6E5950', letterSpacing: '1.5px', marginBottom: '10px' }}>ARCHIVED CONNECTIONS</div>
                {activeUsers.filter(u => !isWithin48Hours(u.timestamp)).map(user => (
                  <div key={user.id} style={{ backgroundColor: 'rgba(20, 13, 12, 0.3)', border: '1px solid rgba(245, 230, 211, 0.03)', borderRadius: '20px', padding: '16px', opacity: 0.7 }}>
                    <div style={{ color: '#A68F81' }}>{user.name} — <span style={{ fontSize: '11px' }}>Archived</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRESENCE VIEW */}
        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>
              Identity Matrix
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '10px', color: '#6E5950', letterSpacing: '1px' }}>IDENTITY HANDLE</label>
              <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} style={{ background: '#1C1211', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '12px', padding: '14px', color: '#F5E6D3', fontSize: '14px' }} />
              
              <label style={{ fontSize: '10px', color: '#6E5950', letterSpacing: '1px' }}>DESIGNATION / ROLE</label>
              <input type="text" value={profile.title} onChange={(e) => setProfile({...profile, title: e.target.value})} style={{ background: '#1C1211', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '12px', padding: '14px', color: '#F5E6D3', fontSize: '14px' }} />
              
              <label style={{ fontSize: '10px', color: '#6E5950', letterSpacing: '1px' }}>ORGANIZATION</label>
              <input type="text" value={profile.org} onChange={(e) => setProfile({...profile, org: e.target.value})} style={{ background: '#1C1211', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '12px', padding: '14px', color: '#F5E6D3', fontSize: '14px' }} />
            </div>

            <div style={{ marginTop: '12px', padding: '16px', borderRadius: '20px', backgroundColor: 'rgba(38,25,22,0.2)', border: '1px solid rgba(245, 230, 211, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#F5E6D3' }}>Node Broadcasting</div>
                <div style={{ fontSize: '11px', color: '#A68F81', marginTop: '2px' }}>{isVisible ? 'Visible to Room Network' : 'Invisible (Vault Only)'}</div>
              </div>
              <div onClick={handleVisibilityToggle} style={{
                width: '50px', height: '28px', backgroundColor: isVisible ? '#E6A15C' : '#2E1E1B', borderRadius: '14px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <div style={{ width: '22px', height: '22px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '25px' : '3px', transition: 'all 0.2s' }} />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* LOWER 40%: Strict Ergonomic Control Hub & 3-Tab Dock */}
      <div style={{
        height: '38%', background: 'linear-gradient(to top, #0E0908 85%, rgba(20, 13, 12, 0))',
        padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box'
      }}>
        
        {/* Dynamic Context Intent Modal Overlay (Anchored in Thumb Zone) */}
        {showIntentModal && (
          <div style={{ backgroundColor: '#1C1211', border: '1px solid rgba(245, 230, 211, 0.15)', borderRadius: '24px', padding: '20px', marginBottom: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '11px', color: '#D9C3B0', letterSpacing: '1px', marginBottom: '8px' }}>MANDATORY SESSION INTENT</div>
            <input 
              type="text" 
              placeholder="What is your current active intent?" 
              value={currentIntent} 
              onChange={(e) => setCurrentUrlIntent(e.target.value)} 
              style={{ width: '100%', background: '#0E0908', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '12px', padding: '12px', color: '#F5E6D3', marginBottom: '12px', boxSizing: 'border-box' }}
            />
            <div onClick={confirmVisibility} style={{ backgroundColor: '#E6A15C', color: '#140D0C', padding: '12px', borderRadius: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              BROADCAST IDENTITY
            </div>
          </div>
        )}

        {/* Operational System Diagnostics Status Bar */}
        <div style={{ textAlign: 'center', marginBottom: '24px', fontSize: '10px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {systemStatus}
        </div>

        {/* The Three-Tab Museum Grade Dock */}
        <div style={{
          height: '64px', backgroundColor: 'rgba(28, 18, 17, 0.85)', borderRadius: '20px', border: '1px solid rgba(245, 230, 211, 0.08)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)'
        }}>
          <div onClick={() => setActiveTab('room')} style={{ fontSize: '11px', letterSpacing: '1.5px', color: activeTab === 'room' ? '#F5E6D3' : '#6E5950', fontWeight: activeTab === 'room' ? '600' : '400', cursor: 'pointer', padding: '12px' }}>THE ROOM</div>
          <div onClick={() => setActiveTab('vault')} style={{ fontSize: '11px', letterSpacing: '1.5px', color: activeTab === 'vault' ? '#F5E6D3' : '#6E5950', fontWeight: activeTab === 'vault' ? '600' : '400', cursor: 'pointer', padding: '12px' }}>THE VAULT</div>
          <div onClick={() => setActiveTab('presence')} style={{ fontSize: '11px', letterSpacing: '1.5px', color: activeTab === 'presence' ? '#F5E6D3' : '#6E5950', fontWeight: activeTab === 'presence' ? '600' : '400', cursor: 'pointer', padding: '12px' }}>PRESENCE</div>
        </div>

      </div>

    </div>
  );
}
