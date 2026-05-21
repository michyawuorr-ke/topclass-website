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
}

export default function OreetiSovereignEngine() {
  // System UI States
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('presence');
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [blackoutMode, setBlackoutMode] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Presence Engine Initialized');
  
  // Profile Profile Data & Domain Settings
  const [profile, setProfile] = useState({
    name: 'Michy',
    title: 'Principal Architecture Lead',
    domain: 'Digital Infrastructure & Spatial Design'
  });
  
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [sessionAnchor, setSessionAnchor] = useState('OFFLINE');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const [activeUsers] = useState<Networker[]>([
    { id: '1', name: 'Alex', title: 'Design Director', org: 'Minimalist Studio', intent: 'Looking for container framework engineers', ring_color: '#E6A15C', timestamp: new Date().toISOString() },
    { id: '2', name: 'Elena', title: 'Materials Curator', org: 'Silk & Stone Co', intent: 'Sourcing organic textures for digital showroom design', ring_color: '#D9C3B0', timestamp: new Date(Date.now() - 50 * 3600 * 1000).toISOString() }
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        setSessionAnchor(`SESSION: ${room.toUpperCase()}`);
      }
    }
  }, []);

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

  const triggerConnection = async (targetName: string) => {
    setBlackoutMode(true);
    setSystemStatus(`Connection established with ${targetName}`);
    try {
      await supabase.from('encounters').insert([{ node_anchor: sessionAnchor, status: `handshake:${targetName}` }]);
    } catch (e) {}
  };

  const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(currentUrl)}&chco=F5E6D3&chf=bg,s,65432100`;

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
      
      {/* UPPER 60%: Interaction Area */}
      <div style={{ flex: 1, padding: '24px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* TAB 1: THE ROOM */}
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase', marginBottom: '24px' }}>
              {sessionAnchor}
            </div>
            {!isVisible ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#6E5950', fontSize: '14px', fontWeight: '300', padding: '0 24px' }}>
                Anti-Lurker Reciprocity Active.<br />Toggle "Visible Mode" in Presence to unlock discovery.
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

        {/* TAB 2: THE VAULT */}
        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase', marginBottom: '24px' }}>
              Relationship Vault
            </div>
            <div style={{ backgroundColor: 'rgba(38, 25, 22, 0.25)', border: '1px solid rgba(245, 230, 211, 0.08)', borderRadius: '20px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#F5E6D3', fontWeight: '400' }}>Alex</span>
                <span style={{ fontSize: '11px', color: '#E6A15C' }}>Active Momentum</span>
              </div>
              <div style={{ fontSize: '12px', color: '#A68F81', marginTop: '6px' }}>Met near the structural concrete exhibition booth.</div>
            </div>
          </div>
        )}

        {/* TAB 3: PRESENCE (Premium Card Realization) */}
        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase', marginBottom: '8px' }}>
              Identity Matrix
            </div>
            
            {/* Museum-Grade Glassmorphism Identity Card */}
            <div style={{
              width: '100%',
              backgroundColor: 'rgba(38, 25, 22, 0.45)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderRadius: '28px',
              padding: '32px 24px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(245, 230, 211, 0.12)',
              border: '1px solid rgba(245, 230, 211, 0.06)',
              position: 'relative',
              boxSizing: 'border-box'
            }}>
              
              {/* Management/Edit Icon Overlay Node */}
              <div 
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  position: 'absolute', top: '24px', right: '24px', cursor: 'pointer',
                  padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(20, 13, 12, 0.5)',
                  border: '1px solid rgba(245, 230, 211, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {isEditing ? (
                  /* Clean Checkmark for Save state */
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8CE65C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  /* Premium Minimal Edit Node Matrix Vector */
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9C3B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
                )}
              </div>

              {/* Identity Details Content Loop */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#6E5950', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>IDENTITY HANDLE</div>
                  {isEditing ? (
                    <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} style={{ width: '100%', background: 'rgba(20, 13, 12, 0.6)', border: 'none', borderBottom: '1px solid #E6A15C', color: '#F5E6D3', fontSize: '22px', fontWeight: '300', padding: '4px 0', outline: 'none' }} />
                  ) : (
                    <div style={{ fontSize: '24px', fontWeight: '300', color: '#F5E6D3', letterSpacing: '-0.5px' }}>{profile.name}</div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '9px', color: '#6E5950', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>DESIGNATION</div>
                  {isEditing ? (
                    <input type="text" value={profile.title} onChange={(e) => setProfile({...profile, title: e.target.value})} style={{ width: '100%', background: 'rgba(20, 13, 12, 0.6)', border: 'none', borderBottom: '1px solid #E6A15C', color: '#D9C3B0', fontSize: '14px', padding: '4px 0', outline: 'none' }} />
                  ) : (
                    <div style={{ fontSize: '14px', color: '#D9C3B0', fontWeight: '400', letterSpacing: '0.5px' }}>{profile.title}</div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '9px', color: '#6E5950', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>PROFESSIONAL DOMAIN</div>
                  {isEditing ? (
                    <input type="text" value={profile.domain} onChange={(e) => setProfile({...profile, domain: e.target.value})} style={{ width: '100%', background: 'rgba(20, 13, 12, 0.6)', border: 'none', borderBottom: '1px solid #E6A15C', color: '#A68F81', fontSize: '13px', padding: '4px 0', outline: 'none' }} />
                  ) : (
                    <div style={{ fontSize: '13px', color: '#A68F81', fontWeight: '400', lineHeight: '1.4' }}>{profile.domain}</div>
                  )}
                </div>
              </div>

            </div>

            {/* Visibility Dashboard Controller */}
            <div style={{ padding: '16px', borderRadius: '20px', backgroundColor: 'rgba(38,25,22,0.2)', border: '1px solid rgba(245, 230, 211, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#F5E6D3' }}>Visible Mode</div>
                <div style={{ fontSize: '11px', color: '#A68F81', marginTop: '2px' }}>{isVisible ? 'Broadcasting Proximity Node' : 'Invisible'}</div>
              </div>
              <div onClick={handleVisibilityToggle} style={{
                width: '46px', height: '24px', backgroundColor: isVisible ? '#E6A15C' : '#2E1E1B', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <div style={{ width: '18px', height: '18px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '25px' : '3px', transition: 'all 0.2s' }} />
              </div>
            </div>

            {/* Proximity Target Code Display */}
            {isVisible && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', 
                backgroundColor: 'rgba(38, 25, 22, 0.45)', backdropFilter: 'blur(30px)', borderRadius: '24px',
                border: '1px solid rgba(245, 230, 211, 0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
              }}>
                <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '2px', color: '#D9C3B0', textTransform: 'uppercase', marginBottom: '14px' }}>
                  PROXIMITY RADAR QR
                </div>
                <img 
                  src={qrCodeUrl} 
                  alt="Proximity Node QR" 
                  style={{ width: '130px', height: '130px', display: 'block', padding: '8px', backgroundColor: 'rgba(20, 13, 12, 0.4)', borderRadius: '16px' }}
                />
              </div>
            )}
          </div>
        )}

      </div>

      {/* LOWER 40%: Control Hub & 3-Tab Navigation Dock */}
      <div style={{
        height: '38%', background: 'linear-gradient(to top, #0E0908 85%, rgba(20, 13, 12, 0))',
        padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box'
      }}>
        
        {/* Dynamic Context Intent Modal Overlay */}
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

        {/* Operational Status Diagnostics */}
        <div style={{ textAlign: 'center', marginBottom: '24px', fontSize: '10px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {systemStatus}
        </div>

        {/* The Three-Tab Dock */}
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
