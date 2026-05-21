'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface Networker {
  id: string;
  name: string;
  title: string;
  domain: string;
  intent: string;
  ring_color: string;
  timestamp: string;
  contact_cleared: boolean;
  email?: string;
  phone?: string;
}

export default function OreetiSovereignEngine() {
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('vault');
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [blackoutMode, setBlackoutMode] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Vault Core Loaded');
  
  const [profile, setProfile] = useState({
    name: 'Michy',
    title: 'Principal Architecture Lead',
    domain: 'Digital Infrastructure & Spatial Design'
  });
  
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [sessionAnchor, setSessionAnchor] = useState('OFFLINE');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // Hydrated mock network links to pass security clearance checks
  const [vaultUsers, setVaultUsers] = useState<Networker[]>([
    { 
      id: '1', 
      name: 'Alex', 
      title: 'Design Director', 
      domain: 'Modular Structures & Container Housing', 
      intent: 'Sourcing 40ft engineering schematics', 
      ring_color: '#E6A15C', 
      timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(), 
      contact_cleared: false,
      email: 'alex@modularmatrix.io',
      phone: '+254700000000'
    },
    { 
      id: '2', 
      name: 'Elena', 
      title: 'Materials Curator', 
      domain: 'Organic Finishes & Silk Textiles', 
      intent: 'Curating showroom color blueprints', 
      ring_color: '#D9C3B0', 
      timestamp: new Date(Date.now() - 52 * 3600 * 1000).toISOString(), 
      contact_cleared: true,
      email: 'elena@silksurface.com',
      phone: '+254711111111'
    }
  ]);

  const [vaultNotes, setVaultNotes] = useState<Record<string, string>>({
    '1': 'Discussed stacking constraints for the 3-story container build.',
    '2': 'Exchanged ideas on the champagne-blush silk interface palette.'
  });

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

  const handleTier2Clearance = (id: string) => {
    setVaultUsers(prev => prev.map(u => u.id === id ? { ...u, contact_cleared: true } : u));
    setSystemStatus('Tier 2 Verification Passed');
  };

  // Dynamic Native Client-Side vCard Generator Engine
  const downloadVCard = (user: Networker) => {
    const vcardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${user.name}`,
      `ORG:${user.domain}`,
      `TITLE:${user.title}`,
      `EMAIL;TYPE=PREF,INTERNET:${user.email || ''}`,
      `TEL;TYPE=CELL:${user.phone || ''}`,
      'END:VCARD'
    ].join('\n');

    const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${user.name.replace(/\s+/g, '_')}_Identity_Node.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSystemStatus(`Downloaded ${user.name}'s vCard Node`);
  };

  const isWithin48Hours = (timestampString: string) => {
    const hours = (Date.now() - new Date(timestampString).getTime()) / (1000 * 60 * 60);
    return hours <= 48;
  };

  const getRemainingHours = (timestampString: string) => {
    const hoursPassed = (Date.now() - new Date(timestampString).getTime()) / (1000 * 60 * 60);
    const left = Math.max(0, Math.ceil(48 - hoursPassed));
    return `${left}h remaining`;
  };

  return (
    <div style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#140D0C', color: '#FDFBF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      
      {/* UPPER 60%: Scrollable Interaction Area */}
      <div style={{ flex: 1, padding: '24px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* TAB 1: THE ROOM */}
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase', marginBottom: '24px' }}>
              {sessionAnchor}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#6E5950', fontSize: '14px', fontWeight: '300', padding: '0 24px' }}>
              Anti-Lurker Reciprocity Active.<br />Toggle "Visible Mode" in Presence to unlock discovery.
            </div>
          </div>
        )}

        {/* TAB 2: THE VAULT (Tier 2 Verification Expansion Loop) */}
        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase', marginBottom: '4px' }}>
                Relationship Vault
              </div>
              <div style={{ fontSize: '12px', color: '#6E5950', fontWeight: '300' }}>Decentralized Proximity Archive</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '10px', color: '#E6A15C', letterSpacing: '2px', fontWeight: '600', textTransform: 'uppercase' }}>
                ⚡ 48-Hour Momentum Engine
              </div>
              
              {vaultUsers.map(user => (
                <div key={user.id} style={{
                  backgroundColor: 'rgba(38, 25, 22, 0.45)', backdropFilter: 'blur(30px)', borderRadius: '24px', padding: '24px',
                  border: `1px solid ${user.ring_color}`, boxShadow: '0 15px 35px rgba(0,0,0,0.4), inset 0 1px 1px rgba(245, 230, 211, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: '20px', fontWeight: '300', color: '#F5E6D3' }}>{user.name}</div>
                    {isWithin48Hours(user.timestamp) && (
                      <div style={{ fontSize: '11px', color: '#E6A15C', letterSpacing: '0.5px', background: 'rgba(230, 161, 92, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                        {getRemainingHours(user.timestamp)}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#A68F81', marginTop: '4px' }}>{user.title}</div>
                  <div style={{ fontSize: '11px', color: '#6E5950', marginTop: '2px', fontStyle: 'italic' }}>{user.domain}</div>
                  
                  {/* REVEAL CHANNELS IF TIER 2 IS ACTIVE */}
                  {user.contact_cleared ? (
                    <div style={{
                      marginTop: '16px', padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(20, 13, 12, 0.5)',
                      border: '1px solid rgba(140, 230, 92, 0.15)', display: 'flex', flexDirection: 'column', gap: '12px'
                    }}>
                      <div style={{ fontSize: '9px', color: '#8CE65C', letterSpacing: '1.5px', fontWeight: '600' }}>✓ VERIFIED UTILITY NODE UNLOCKED</div>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <a href={`mailto:${user.email}`} style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '10px', background: '#1C1211', border: '1px solid rgba(245,230,211,0.08)', borderRadius: '10px', fontSize: '12px', color: '#F5E6D3' }}>
                          EMAIL
                        </a>
                        <a href={`tel:${user.phone}`} style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '10px', background: '#1C1211', border: '1px solid rgba(245,230,211,0.08)', borderRadius: '10px', fontSize: '12px', color: '#F5E6D3' }}>
                          DIAL NODE
                        </a>
                      </div>

                      <div onClick={() => downloadVCard(user)} style={{
                        padding: '12px', textAlign: 'center', background: 'linear-gradient(135deg, #2E1E1B, #140D0C)',
                        border: '1px solid rgba(230, 161, 92, 0.2)', borderRadius: '12px', fontSize: '11px', letterSpacing: '1px', color: '#E6A15C', cursor: 'pointer', fontWeight: '600'
                      }}>
                        DOWNLOAD DIGITAL CARD NODE
                      </div>
                    </div>
                  ) : (
                    /* Context Note Box hidden once verified to save premium mobile grid room */
                    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(245, 230, 211, 0.06)', paddingTop: '12px' }}>
                      <textarea 
                        value={vaultNotes[user.id] || ''}
                        onChange={(e) => setVaultNotes({...vaultNotes, [user.id]: e.target.value})}
                        placeholder="Type private encounter notes..."
                        style={{ width: '100%', background: '#0E0908', border: '1px solid rgba(245, 230, 211, 0.05)', borderRadius: '12px', color: '#D9C3B0', padding: '10px', fontSize: '12px', resize: 'none', height: '40px', outline: 'none', fontFamily: 'inherit' }}
                      />
                    </div>
                  )}

                  {/* Operational Tier 2 Controller Button */}
                  {!user.contact_cleared && (
                    <div onClick={() => handleTier2Clearance(user.id)} style={{
                      marginTop: '12px', padding: '12px', borderRadius: '14px', textAlign: 'center', fontSize: '11px', letterSpacing: '1.5px', fontWeight: '500', cursor: 'pointer',
                      backgroundColor: 'rgba(20, 13, 12, 0.6)', border: '1px solid rgba(245, 230, 211, 0.12)', color: '#F5E6D3'
                    }}>
                      REQUEST CONTACT DETAILS
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PRESENCE */}
        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase', marginBottom: '8px' }}>
              Identity Matrix
            </div>
            <div style={{ width: '100%', backgroundColor: 'rgba(38, 25, 22, 0.45)', backdropFilter: 'blur(30px)', borderRadius: '28px', padding: '32px 24px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(245, 230, 211, 0.06)', position: 'relative', boxSizing: 'border-box' }}>
              <div onClick={() => setIsEditing(!isEditing)} style={{ position: 'absolute', top: '24px', right: '24px', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(20, 13, 12, 0.5)', border: '1px solid rgba(245, 230, 211, 0.1)' }}>
                {isEditing ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8CE65C" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9C3B0" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#6E5950', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>IDENTITY HANDLE</div>
                  {isEditing ? <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #E6A15C', color: '#F5E6D3', fontSize: '22px', outline: 'none' }} /> : <div style={{ fontSize: '24px', fontWeight: '300', color: '#F5E6D3' }}>{profile.name}</div>}
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#6E5950', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>DESIGNATION</div>
                  {isEditing ? <input type="text" value={profile.title} onChange={(e) => setProfile({...profile, title: e.target.value})} style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #E6A15C', color: '#D9C3B0', fontSize: '14px', outline: 'none' }} /> : <div style={{ fontSize: '14px', color: '#D9C3B0' }}>{profile.title}</div>}
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#6E5950', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>PROFESSIONAL DOMAIN</div>
                  {isEditing ? <input type="text" value={profile.domain} onChange={(e) => setProfile({...profile, domain: e.target.value})} style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #E6A15C', color: '#A68F81', fontSize: '13px', outline: 'none' }} /> : <div style={{ fontSize: '13px', color: '#A68F81', lineHeight: '1.4' }}>{profile.domain}</div>}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* LOWER 40%: Control Hub */}
      <div style={{
        height: '38%', background: 'linear-gradient(to top, #0E0908 85%, rgba(20, 13, 12, 0))',
        padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box'
      }}>
        {showIntentModal && (
          <div style={{ backgroundColor: '#1C1211', border: '1px solid rgba(245, 230, 211, 0.15)', borderRadius: '24px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#D9C3B0', marginBottom: '8px' }}>MANDATORY SESSION INTENT</div>
            <input type="text" placeholder="What is your current active intent?" value={currentIntent} onChange={(e) => setCurrentUrlIntent(e.target.value)} style={{ width: '100%', background: '#0E0908', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '12px', padding: '12px', color: '#F5E6D3', marginBottom: '12px', boxSizing: 'border-box' }} />
            <div onClick={confirmVisibility} style={{ backgroundColor: '#E6A15C', color: '#140D0C', padding: '12px', borderRadius: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>BROADCAST IDENTITY</div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '24px', fontSize: '10px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {systemStatus}
        </div>

        {/* 3-Tab Navigation Dock */}
        <div style={{
          height: '64px', backgroundColor: 'rgba(28, 18, 17, 0.85)', borderRadius: '20px', border: '1px solid rgba(245, 230, 211, 0.08)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center', backdropFilter: 'blur(10px)'
        }}>
          <div onClick={() => setActiveTab('room')} style={{ fontSize: '11px', letterSpacing: '1.5px', color: activeTab === 'room' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px' }}>THE ROOM</div>
          <div onClick={() => setActiveTab('vault')} style={{ fontSize: '11px', letterSpacing: '1.5px', color: activeTab === 'vault' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px' }}>THE VAULT</div>
          <div onClick={() => setActiveTab('presence')} style={{ fontSize: '11px', letterSpacing: '1.5px', color: activeTab === 'presence' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px' }}>PRESENCE</div>
        </div>
      </div>

    </div>
  );
}
