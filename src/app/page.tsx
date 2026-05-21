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
  qr_handshake_completed: boolean; // The Cryptographic Progression Unlock
  contact_cleared: boolean;
  shared_channels: {
    phone: boolean;
    linkedin: boolean;
  };
  email?: string;
  phone?: string;
  linkedin_url?: string;
}

export default function OreetiSovereignEngine() {
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('vault');
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Sovereign Matrix Initialized');
  
  const [profile, setProfile] = useState({
    name: 'Michy',
    title: 'Principal Architecture Lead',
    domain: 'Digital Infrastructure & Spatial Design'
  });
  
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [sessionAnchor, setSessionAnchor] = useState('OFFLINE');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // Dual-State Vault Connections Matrix
  const [vaultUsers, setVaultUsers] = useState<Networker[]>([
    { 
      id: '1', 
      name: 'Alex', 
      title: 'Design Director', 
      domain: 'Modular Structures', 
      intent: 'Sourcing 40ft engineering schematics', 
      ring_color: '#E6A15C', 
      timestamp: new Date().toISOString(), 
      qr_handshake_completed: false, // Met at venue, but no QR scan yet -> Request UI is HIDDEN
      contact_cleared: false,
      shared_channels: { phone: false, linkedin: false },
      email: 'alex@modularmatrix.io',
      phone: '+254700000000',
      linkedin_url: 'linkedin.com/in/alex-modular'
    },
    { 
      id: '2', 
      name: 'Elena', 
      title: 'Materials Curator', 
      domain: 'Organic Finishes & Silk Textiles', 
      intent: 'Curating showroom color blueprints', 
      ring_color: '#D9C3B0', 
      timestamp: new Date(Date.now() - 52 * 3600 * 1000).toISOString(), 
      qr_handshake_completed: true, // QR Scan completed -> Can now request Tier 2 selectively from home
      contact_cleared: false,
      shared_channels: { phone: false, linkedin: false },
      email: 'elena@silksurface.com',
      phone: '+254711111111',
      linkedin_url: 'linkedin.com/in/elena-curator'
    }
  ]);

  const [vaultNotes, setVaultNotes] = useState<Record<string, string>>({
    '1': 'Met near the structural concrete booth. Discussed 3-story container stacking constraints.',
    '2': 'Exchanged design philosophy details regarding the champagne-blush silk UI palette.'
  });

  // Local state to track which channels the user wants to share when requesting/granting
  const [shareSelection, setShareSelection] = useState<Record<string, { phone: boolean; linkedin: boolean }>>({
    '1': { phone: false, linkedin: false },
    '2': { phone: true, linkedin: false } // Default selective choice
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
  };

  // Simulate scanning a person's physical QR code to unlock Tier 2 capability
  const simulateQRScanHandshake = (id: string) => {
    setVaultUsers(prev => prev.map(u => u.id === id ? { ...u, qr_handshake_completed: true } : u));
    setSystemStatus(`QR Handshake Verified. Tier 2 Progression Unlocked.`);
  };

  const handleGrantClearance = (id: string) => {
    const selection = shareSelection[id];
    setVaultUsers(prev => prev.map(u => u.id === id ? { 
      ...u, 
      contact_cleared: true,
      shared_channels: { phone: selection.phone, linkedin: selection.linkedin }
    } : u));
    setSystemStatus('Selective Tier 2 Channels Cleared');
  };

  const toggleShareChannel = (userId: string, channel: 'phone' | 'linkedin') => {
    setShareSelection(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [channel]: !prev[userId][channel]
      }
    }));
  };

  const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=180x180&chl=${encodeURIComponent(currentUrl)}&chco=F5E6D3&chf=bg,s,65432100`;

  return (
    <div style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#140D0C', color: '#FDFBF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      
      {/* UPPER 60%: Scrollable Canvas */}
      <div style={{ flex: 1, padding: '24px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* TAB 1: THE ROOM */}
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase', marginBottom: '16px' }}>
              {sessionAnchor}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#6E5950', fontSize: '13px', fontWeight: '300' }}>
              Anti-Lurker Reciprocity Active.<br />Scan venue QR to view local networkers.
            </div>
          </div>
        )}

        {/* TAB 2: PRIVACY-CONTROLLED RELATIONSHIP VAULT */}
        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>Relationship Vault</div>
              <div style={{ fontSize: '11px', color: '#6E5950', marginTop: '2px' }}>Selective Privacy Matrix Architecture</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vaultUsers.map(user => (
                <div key={user.id} style={{
                  backgroundColor: 'rgba(38, 25, 22, 0.3)', borderRadius: '18px', padding: '16px',
                  border: `1px solid ${user.ring_color}25`, boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                }}>
                  {/* Top Line Identification Line */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#F5E6D3' }}>
                      {user.name} <span style={{ fontSize: '12px', color: '#A68F81', fontWeight: '300', marginLeft: '6px' }}>{user.title}</span>
                    </div>
                    <div style={{ fontSize: '9px', color: '#6E5950', letterSpacing: '1px' }}>{user.domain}</div>
                  </div>
                  
                  {/* Encounter Notes Scratchpad (Always open at venue or home for custom memory triggers) */}
                  <div style={{ marginTop: '8px' }}>
                    <textarea 
                      value={vaultNotes[user.id] || ''}
                      onChange={(e) => setVaultNotes({...vaultNotes, [user.id]: e.target.value})}
                      placeholder="Write how you can remember this encounter..."
                      style={{ width: '100%', background: 'rgba(20, 13, 12, 0.4)', border: '1px solid rgba(245, 230, 211, 0.04)', borderRadius: '10px', color: '#D9C3B0', padding: '8px 10px', fontSize: '11px', resize: 'none', height: '36px', outline: 'none', fontFamily: 'inherit', lineHeight: '1.4' }}
                    />
                  </div>

                  {/* PRIVACY FLOW CONDITIONALS */}
                  {user.contact_cleared ? (
                    /* Tier 2 Successfully Disclosed Block */
                    <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(140, 230, 92, 0.04)', border: '1px solid rgba(140, 230, 92, 0.15)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#8CE65C', fontWeight: '600', letterSpacing: '0.5px' }}>CLEARED CHANNELS:</span>
                      {user.shared_channels.phone && <a href={`tel:${user.phone}`} style={{ textDecoration: 'none', padding: '4px 10px', background: 'rgba(245,230,211,0.05)', borderRadius: '6px', fontSize: '10px', color: '#F5E6D3' }}>PHONE</a>}
                      {user.shared_channels.linkedin && <a href={`https://${user.linkedin_url}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '4px 10px', background: 'rgba(245,230,211,0.05)', borderRadius: '6px', fontSize: '10px', color: '#F5E6D3' }}>LINKEDIN</a>}
                    </div>
                  ) : user.qr_handshake_completed ? (
                    /* QR Scan Completed -> Show Selective Controls (At Home Comfort) */
                    <div style={{ marginTop: '12px', borderTop: '1px dashed rgba(245,230,211,0.08)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '9px', color: '#E6A15C', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>⚡ QR VALIDATED: CHOOSE CHANNELS TO DISCLOSE</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#A68F81', cursor: 'pointer' }}>
                          <input type="checkbox" checked={shareSelection[user.id]?.phone || false} onChange={() => toggleShareChannel(user.id, 'phone')} style={{ accentColor: '#E6A15C' }} /> Share Phone
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#A68F81', cursor: 'pointer' }}>
                          <input type="checkbox" checked={shareSelection[user.id]?.linkedin || false} onChange={() => toggleShareChannel(user.id, 'linkedin')} style={{ accentColor: '#E6A15C' }} /> Share LinkedIn
                        </label>
                      </div>

                      <div onClick={() => handleGrantClearance(user.id)} style={{ padding: '8px', textAlign: 'center', background: '#2E1E1B', border: '1px solid rgba(230,161,92,0.2)', borderRadius: '8px', fontSize: '11px', color: '#E6A15C', cursor: 'pointer', fontWeight: '500' }}>
                        GRANT EXPLICIT CLEARANCE
                      </div>
                    </div>
                  ) : (
                    /* Venue State -> QR Not Scanned -> Request UI completely omitted. Mock a scan action button to test it */
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#6E5950', fontStyle: 'italic' }}>Requires direct QR scan to prompt contact details</span>
                      <div onClick={() => simulateQRScanHandshake(user.id)} style={{ fontSize: '9px', color: '#A68F81', background: 'rgba(245,230,211,0.05)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', border: '1px solid rgba(245,230,211,0.08)' }}>
                        [Simulate QR Scan Handshake]
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PRESENCE PROFILE MATRIX */}
        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>Identity Matrix</div>
            <div style={{ width: '100%', backgroundColor: 'rgba(38, 25, 22, 0.45)', backdropFilter: 'blur(30px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(245, 230, 211, 0.06)', position: 'relative', boxSizing: 'border-box' }}>
              <div onClick={() => setIsEditing(!isEditing)} style={{ position: 'absolute', top: '20px', right: '20px', cursor: 'pointer', padding: '6px', borderRadius: '50%', backgroundColor: 'rgba(20, 13, 12, 0.5)', border: '1px solid rgba(245, 230, 211, 0.1)' }}>
                {isEditing ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8CE65C" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D9C3B0" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '8px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>IDENTITY HANDLE</div>
                  {isEditing ? <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #E6A15C', color: '#F5E6D3', fontSize: '18px', outline: 'none' }} /> : <div style={{ fontSize: '20px', fontWeight: '300', color: '#F5E6D3' }}>{profile.name}</div>}
                </div>
                <div>
                  <div style={{ fontSize: '8px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>DESIGNATION</div>
                  {isEditing ? <input type="text" value={profile.title} onChange={(e) => setProfile({...profile, title: e.target.value})} style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #E6A15C', color: '#D9C3B0', fontSize: '13px', outline: 'none' }} /> : <div style={{ fontSize: '13px', color: '#D9C3B0' }}>{profile.title}</div>}
                </div>
                <div>
                  <div style={{ fontSize: '8px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>PROFESSIONAL DOMAIN</div>
                  {isEditing ? <input type="text" value={profile.domain} onChange={(e) => setProfile({...profile, domain: e.target.value})} style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #E6A15C', color: '#A68F81', fontSize: '12px', outline: 'none' }} /> : <div style={{ fontSize: '12px', color: '#A68F81', lineHeight: '1.4' }}>{profile.domain}</div>}
                </div>
              </div>
            </div>

            {isVisible && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', backgroundColor: 'rgba(38, 25, 22, 0.4)', borderRadius: '20px', border: '1px solid rgba(245, 230, 211, 0.05)' }}>
                <img src={qrCodeUrl} alt="Proximity QR Node" style={{ width: '120px', height: '120px', display: 'block', padding: '6px', backgroundColor: 'rgba(20, 13, 12, 0.4)', borderRadius: '12px', marginBottom: '8px' }} />
                <div style={{ fontSize: '9px', fontWeight: '500', letterSpacing: '1px', color: '#6E5950' }}>YOUR IDENTITY DEPLOYMENT LINK</div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* LOWER 40%: Fixed Ergonomic Control Hub */}
      <div style={{
        height: '38%', background: 'linear-gradient(to top, #0E0908 90%, rgba(20, 13, 12, 0))',
        padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box'
      }}>
        
        {showIntentModal && (
          <div style={{ backgroundColor: '#1C1211', border: '1px solid rgba(245, 230, 211, 0.15)', borderRadius: '20px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#D9C3B0', marginBottom: '6px', letterSpacing: '1px' }}>MANDATORY SESSION INTENT</div>
            <input type="text" placeholder="State active networking intention..." value={currentIntent} onChange={(e) => setCurrentUrlIntent(e.target.value)} style={{ width: '100%', background: '#0E0908', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '10px', padding: '10px', color: '#F5E6D3', marginBottom: '10px', boxSizing: 'border-box', fontSize: '13px' }} />
            <div onClick={confirmVisibility} style={{ backgroundColor: '#E6A15C', color: '#140D0C', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>BROADCAST IDENTITY</div>
          </div>
        )}

        {/* Global Visibility Node */}
        <div style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: 'rgba(38,25,22,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 230, 211, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#F5E6D3' }}>Visible Broadcast Mode</div>
            <div style={{ fontSize: '10px', color: '#6E5950', marginTop: '1px' }}>{isVisible ? 'Broadcasting Proximity Node' : 'Invisible / Discovery Locked'}</div>
          </div>
          <div onClick={handleVisibilityToggle} style={{ width: '42px', height: '22px', backgroundColor: isVisible ? '#E6A15C' : '#2E1E1B', borderRadius: '11px', position: 'relative', cursor: 'pointer' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '23px' : '3px', transition: '0.2s' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '9px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {systemStatus}
        </div>

        {/* Tab Dock Array */}
        <div style={{ height: '56px', backgroundColor: 'rgba(28, 18, 17, 0.9)', borderRadius: '16px', border: '1px solid rgba(245, 230, 211, 0.08)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
          <div onClick={() => setActiveTab('room')} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'room' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px' }}>THE ROOM</div>
          <div onClick={() => setActiveTab('vault')} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'vault' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px' }}>THE VAULT</div>
          <div onClick={() => setActiveTab('presence')} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'presence' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px' }}>PRESENCE</div>
        </div>

      </div>

    </div>
  );
}
