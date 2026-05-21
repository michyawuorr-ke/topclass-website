'use client';

import React, { useState, useEffect } from 'react';

interface Networker {
  id: string;
  name: string;
  title: string;
  domain: string;
  intent: string;
  ring_color: string;
  timestamp: string;
  qr_handshake_completed: boolean;
  contact_cleared: boolean;
  shared_channels: { phone: boolean; linkedin: boolean };
  email?: string;
  phone?: string;
  linkedin_url?: string;
}

export default function OreetiSovereignEngine() {
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('room');
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Sovereign Matrix Initialized');
  
  const [profile, setProfile] = useState({
    name: 'Michy',
    title: 'Principal Architecture Lead',
    domain: 'Digital Infrastructure & Spatial Design'
  });
  
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [sessionAnchor, setSessionAnchor] = useState('');
  const [customInputTag, setCustomInputTag] = useState('');
  const [showIntentModal, setShowIntentModal] = useState(false);
  
  // Rotating placeholder array to teach the user context intuitively
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholders = ['e.g., NairobiGarage', 'e.g., KICC2026', 'e.g., AlchemistMixer', 'e.g., DesignWeek'];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [vaultUsers, setVaultUsers] = useState<Networker[]>([
    { 
      id: '1', 
      name: 'Alex', 
      title: 'Design Director', 
      domain: 'Modular Structures', 
      intent: 'Sourcing engineering schematics', 
      ring_color: '#E6A15C', 
      timestamp: new Date().toISOString(), 
      qr_handshake_completed: false,
      contact_cleared: false,
      shared_channels: { phone: false, linkedin: false },
      email: 'alex@modularmatrix.io',
      phone: '+254700000000',
      linkedin_url: 'linkedin.com/in/alex-modular'
    }
  ]);

  const [vaultNotes, setVaultNotes] = useState<Record<string, string>>({
    '1': 'Met at local mixer. Discussed structural layout mechanics.'
  });

  const [shareSelection, setShareSelection] = useState<Record<string, { phone: boolean; linkedin: boolean }>>({
    '1': { phone: false, linkedin: false }
  });

  const handleVisibilityToggle = () => {
    if (!isVisible) {
      if (!sessionAnchor) {
        setSystemStatus('Action Locked: Must anchor to a Room Keyword first.');
        return;
      }
      setShowIntentModal(true);
    } else {
      setIsVisible(false);
      setSystemStatus('Node Offline. Discovery Locked.');
    }
  };

  const confirmVisibility = () => {
    if (!currentIntent.trim()) return;
    setShowIntentModal(false);
    setIsVisible(true);
    setSystemStatus(`Broadcasting active node to: ${sessionAnchor}`);
  };

  const handleJoinFreeEventRoom = () => {
    if (!customInputTag.trim()) return;
    const cleanTag = customInputTag.trim().toUpperCase();
    setSessionAnchor(`ROOM: ${cleanTag}`);
    setSystemStatus(`Successfully aligned with cluster: ${cleanTag}`);
  };

  const simulateQRScanHandshake = (id: string) => {
    setVaultUsers(prev => prev.map(u => u.id === id ? { ...u, qr_handshake_completed: true } : u));
    setSystemStatus('QR Link Verified. Permissions open in Vault.');
  };

  const handleGrantClearance = (id: string) => {
    const selection = shareSelection[id] || { phone: false, linkedin: false };
    setVaultUsers(prev => prev.map(u => u.id === id ? { 
      ...u, 
      contact_cleared: true,
      shared_channels: { phone: selection.phone, linkedin: selection.linkedin }
    } : u));
    setSystemStatus('Selected identity nodes disclosed.');
  };

  return (
    <div style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#140D0C', color: '#FDFBF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      
      {/* UPPER CANVAS */}
      <div style={{ flex: 1, padding: '24px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* TAB 1: THE ROOM (With Intuitive Education Array) */}
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>
                {sessionAnchor || 'Dormant Matrix'}
              </div>
              <div style={{ fontSize: '11px', color: '#6E5950', marginTop: '2px' }}>Proximity Workspace Discovery</div>
            </div>

            {!sessionAnchor ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center', flex: 0.8 }}>
                
                {/* Ultra-minimalist pedagogical statement */}
                <div style={{ textAlign: 'center', padding: '0 16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '300', color: '#F5E6D3', lineHeight: '1.5', marginBottom: '6px' }}>
                    Align your interface.
                  </div>
                  <div style={{ fontSize: '12px', color: '#6E5950', lineHeight: '1.4', fontWeight: '300' }}>
                    Type any agreed keyword or venue tag with people nearby to instantly share the local digital canvas.
                  </div>
                </div>

                {/* Highly Guided Input Array */}
                <div style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'rgba(38, 25, 22, 0.3)', border: '1px solid rgba(245,230,211,0.06)' }}>
                  <div style={{ fontSize: '9px', color: '#A68F81', marginBottom: '8px', letterSpacing: '1px', fontWeight: '600' }}>ENTER SHARED EVENT KEYWORD</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder={placeholders[placeholderIndex]} 
                      value={customInputTag} 
                      onChange={(e) => setCustomInputTag(e.target.value)} 
                      style={{ flex: 1, background: '#0E0908', border: '1px solid rgba(245,230,211,0.1)', borderRadius: '10px', padding: '12px', color: '#F5E6D3', fontSize: '13px', outline: 'none', transition: 'all 0.3s' }} 
                    />
                    <div onClick={handleJoinFreeEventRoom} style={{ backgroundColor: '#E6A15C', color: '#140D0C', padding: '12px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      JOIN
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Populated Room Roster list elements */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '10px', color: '#6E5950', letterSpacing: '1px' }}>ACTIVE NETWORKERS BROADCASTING HERE</div>
                <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(38,25,22,0.2)', border: '1px solid rgba(245,230,211,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#F5E6D3', fontWeight: '500' }}>Alex</div>
                    <div style={{ fontSize: '11px', color: '#A68F81' }}>Design Director — Modular Systems</div>
                  </div>
                  <div onClick={() => setSystemStatus('Alex registered to personal Vault archive')} style={{ fontSize: '10px', color: '#E6A15C', border: '1px solid rgba(230,161,92,0.3)', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                    + ADD TO VAULT
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VAULT */}
        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>Relationship Vault</div>
              <div style={{ fontSize: '11px', color: '#6E5950', marginTop: '2px' }}>Personal Archive Matrix</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vaultUsers.map(user => (
                <div key={user.id} style={{ backgroundColor: 'rgba(38, 25, 22, 0.3)', borderRadius: '18px', padding: '16px', border: `1px solid ${user.ring_color}25` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#F5E6D3' }}>{user.name} <span style={{ fontSize: '12px', color: '#A68F81', fontWeight: '300', marginLeft: '6px' }}>{user.title}</span></div>
                  </div>
                  
                  <div style={{ marginTop: '8px' }}>
                    <textarea value={vaultNotes[user.id] || ''} onChange={(e) => setVaultNotes({...vaultNotes, [user.id]: e.target.value})} placeholder="Type private memory triggers..." style={{ width: '100%', background: 'rgba(20, 13, 12, 0.4)', border: '1px solid rgba(245, 230, 211, 0.04)', borderRadius: '10px', color: '#D9C3B0', padding: '8px 10px', fontSize: '11px', resize: 'none', height: '36px', outline: 'none', fontFamily: 'inherit' }} />
                  </div>

                  {user.contact_cleared ? (
                    <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(140, 230, 92, 0.04)', border: '1px solid rgba(140, 230, 92, 0.15)', display: 'flex', gap: '8px' }}>
                      {user.shared_channels.phone && <a href={`tel:${user.phone}`} style={{ textDecoration: 'none', padding: '4px 10px', background: 'rgba(245,230,211,0.05)', borderRadius: '6px', fontSize: '10px', color: '#F5E6D3' }}>PHONE</a>}
                      {user.shared_channels.linkedin && <a href={`https://${user.linkedin_url}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '4px 10px', background: 'rgba(245,230,211,0.05)', borderRadius: '6px', fontSize: '10px', color: '#F5E6D3' }}>LINKEDIN</a>}
                    </div>
                  ) : user.qr_handshake_completed ? (
                    <div style={{ marginTop: '12px', borderTop: '1px dashed rgba(245,230,211,0.08)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#A68F81' }}><input type="checkbox" checked={shareSelection[user.id]?.phone || false} onChange={() => setShareSelection({...shareSelection, [user.id]: {...shareSelection[user.id], phone: !shareSelection[user.id]?.phone}})} style={{ accentColor: '#E6A15C' }} /> Share Phone</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#A68F81' }}><input type="checkbox" checked={shareSelection[user.id]?.linkedin || false} onChange={() => setShareSelection({...shareSelection, [user.id]: {...shareSelection[user.id], linkedin: !shareSelection[user.id]?.linkedin}})} style={{ accentColor: '#E6A15C' }} /> Share LinkedIn</label>
                      </div>
                      <div onClick={() => handleGrantClearance(user.id)} style={{ padding: '8px', textAlign: 'center', background: '#2E1E1B', border: '1px solid rgba(230,161,92,0.2)', borderRadius: '8px', fontSize: '11px', color: '#E6A15C', cursor: 'pointer' }}>GRANT CLEARANCE</div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#6E5950', fontStyle: 'italic' }}>Requires late-night QR handshake to swap links</span>
                      <div onClick={() => simulateQRScanHandshake(user.id)} style={{ fontSize: '9px', color: '#A68F81', background: 'rgba(245,230,211,0.05)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>[Simulate QR Scan]</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PRESENCE */}
        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>Identity Matrix</div>
            <div style={{ width: '100%', backgroundColor: 'rgba(38, 25, 22, 0.45)', backdropFilter: 'blur(30px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(245, 230, 211, 0.06)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div><div style={{ fontSize: '8px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase' }}>IDENTITY HANDLE</div><div style={{ fontSize: '20px', fontWeight: '300', color: '#F5E6D3' }}>{profile.name}</div></div>
                <div><div style={{ fontSize: '8px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase' }}>DESIGNATION</div><div style={{ fontSize: '13px', color: '#D9C3B0' }}>{profile.title}</div></div>
                <div><div style={{ fontSize: '8px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase' }}>PROFESSIONAL DOMAIN</div><div style={{ fontSize: '12px', color: '#A68F81', lineHeight: '1.4' }}>{profile.domain}</div></div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* LOWER 40% CONTROL HUB */}
      <div style={{ height: '38%', background: 'linear-gradient(to top, #0E0908 90%, rgba(20, 13, 12, 0))', padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box' }}>
        
        {showIntentModal && (
          <div style={{ backgroundColor: '#1C1211', border: '1px solid rgba(245, 230, 211, 0.15)', borderRadius: '20px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#D9C3B0', marginBottom: '6px' }}>MANDATORY SESSION INTENT</div>
            <input type="text" placeholder="State active intent..." value={currentIntent} onChange={(e) => setCurrentUrlIntent(e.target.value)} style={{ width: '100%', background: '#0E0908', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '10px', padding: '10px', color: '#F5E6D3', marginBottom: '10px', boxSizing: 'border-box' }} />
            <div onClick={confirmVisibility} style={{ backgroundColor: '#E6A15C', color: '#140D0C', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>BROADCAST IDENTITY</div>
          </div>
        )}

        <div style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: 'rgba(38,25,22,0.6)', border: '1px solid rgba(245, 230, 211, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#F5E6D3' }}>Visible Broadcast Mode</div>
            <div style={{ fontSize: '10px', color: '#6E5950', marginTop: '1px' }}>{isVisible ? 'Active' : 'Locked / Dormant'}</div>
          </div>
          <div onClick={handleVisibilityToggle} style={{ width: '42px', height: '22px', backgroundColor: isVisible ? '#E6A15C' : '#2E1E1B', borderRadius: '11px', position: 'relative', cursor: 'pointer' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '23px' : '3px', transition: '0.2s' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '9px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {systemStatus}
        </div>

        <div style={{ height: '56px', backgroundColor: 'rgba(28, 18, 17, 0.9)', borderRadius: '16px', border: '1px solid rgba(245, 230, 211, 0.08)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
          <div onClick={() => setActiveTab('room')} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'room' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px' }}>THE ROOM</div>
          <div onClick={() => setActiveTab('vault')} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'vault' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px' }}>THE VAULT</div>
          <div onClick={() => setActiveTab('presence')} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'presence' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px' }}>PRESENCE</div>
        </div>

      </div>

    </div>
  );
}
