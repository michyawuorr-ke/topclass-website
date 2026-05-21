'use client';

import React, { useState, useEffect } from 'react';

interface Networker {
  id: string;
  name: string;
  full_name: string;
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
  handshake_status: 'none' | 'sent' | 'received' | 'connected';
}

export default function OreetiSovereignEngine() {
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('room');
  const [isVisible, setIsVisible] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Sovereign Matrix Initialized');
  
  const [profile, setProfile] = useState({
    name: 'Michy',
    title: 'Principal Architecture Lead',
    domain: 'Digital Infrastructure & Spatial Design'
  });
  
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [sessionAnchor, setSessionAnchor] = useState('ROOM: NAIROBI_GARAGE');
  const [customInputTag, setCustomInputTag] = useState('');
  const [showIntentModal, setShowIntentModal] = useState(false);

  const [roomUsers, setRoomUsers] = useState<Networker[]>([
    { 
      id: 'node_01', 
      name: 'Alex', 
      full_name: 'Alex Kiprop',
      title: 'Design Director', 
      domain: 'Modular Structural Blueprints', 
      intent: 'Sourcing premium 40ft container engineering schematics', 
      ring_color: '#E6A15C', 
      timestamp: new Date().toISOString(), 
      qr_handshake_completed: false,
      contact_cleared: false,
      shared_channels: { phone: false, linkedin: false },
      email: 'alex@modularmatrix.io',
      phone: '+254700000000',
      linkedin_url: 'linkedin.com/in/alex-modular',
      handshake_status: 'none'
    }
  ]);

  const [vaultUsers, setVaultUsers] = useState<Networker[]>([]);
  const [vaultNotes, setVaultNotes] = useState<Record<string, string>>({});
  const [shareSelection, setShareSelection] = useState<Record<string, { phone: boolean; linkedin: boolean }>>({});

  const handleVisibilityToggle = () => {
    if (!isVisible) {
      if (!sessionAnchor) {
        setSystemStatus('Action Locked: Enter a Room Tag first.');
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
    setSystemStatus();
  };

  const initiateHandshake = (id: string) => {
    setRoomUsers(prev => prev.map(u => u.id === id ? { ...u, handshake_status: 'sent' } : u));
    setSystemStatus('Handshake broadcasted securely into the space.');
    
    setTimeout(() => {
      setRoomUsers(prev => prev.map(u => u.id === id ? { ...u, handshake_status: 'received' } : u));
      setSystemStatus('Incoming Handshake Signal Detected');
    }, 2500);
  };

  const acceptHandshake = (id: string) => {
    const targetUser = roomUsers.find(u => u.id === id);
    if (!targetUser) return;

    const connectedUser: Networker = {
      ...targetUser,
      handshake_status: 'connected'
    };

    setVaultUsers(prev => [...prev, connectedUser]);
    setRoomUsers(prev => prev.filter(u => u.id !== id));
    setActiveTab('vault');
    setSystemStatus();
  };

  const declineHandshake = (id: string) => {
    setRoomUsers(prev => prev.map(u => u.id === id ? { ...u, handshake_status: 'none' } : u));
    setSystemStatus('Handshake cleared silently.');
  };

  const simulateQRScanHandshake = (id: string) => {
    setVaultUsers(prev => prev.map(u => u.id === id ? { ...u, qr_handshake_completed: true } : u));
    setSystemStatus('QR Matched. Deep Tier 2 Channels Open.');
  };

  const handleGrantClearance = (id: string) => {
    const selection = shareSelection[id] || { phone: false, linkedin: false };
    setVaultUsers(prev => prev.map(u => u.id === id ? { 
      ...u, 
      contact_cleared: true,
      shared_channels: { phone: selection.phone, linkedin: selection.linkedin }
    } : u));
    setSystemStatus('Explicit profile channels authorized.');
  };

  return (
    <div style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#140D0C', color: '#FDFBF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      
      {/* UPPER AREA: Interaction Workspace Screen */}
      <div style={{ flex: 1, padding: '24px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* TAB 1: THE ROOM */}
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>
                {sessionAnchor || 'Dormant Radar'}
              </div>
              <div style={{ fontSize: '11px', color: '#6E5950', marginTop: '2px' }}>Proximity Matrix Scan Feed</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roomUsers.map(user => (
                <div key={user.id} style={{ 
                  padding: '16px', borderRadius: '18px', backgroundColor: 'rgba(38,25,22,0.3)', 
                  border: , display: 'flex', flexDirection: 'column', gap: '10px' 
                }}>
                  {/* Strict Masking Filter Output */}
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#F5E6D3' }}>
                      {user.name} <span style={{ fontSize: '12px', color: '#A68F81', fontWeight: '300', marginLeft: '4px' }}>— {user.title}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#E6A15C', marginTop: '4px', fontStyle: 'italic', lineHeight: '1.4' }}>
                      "Intent: {user.intent}"
                    </div>
                  </div>

                  {/* Contextual Handshake State Flow Controls */}
                  {user.handshake_status === 'none' && (
                    <div onClick={() => initiateHandshake(user.id)} style={{ alignSelf: 'flex-start', fontSize: '10px', color: '#E6A15C', border: '1px solid rgba(230,161,92,0.3)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', letterSpacing: '0.5px', fontWeight: '600' }}>
                      INITIATE HANDSHAKE
                    </div>
                  )}

                  {user.handshake_status === 'sent' && (
                    <div style={{ alignSelf: 'flex-start', fontSize: '10px', color: '#6E5950', padding: '6px 0', letterSpacing: '0.5px' }}>
                      PINGING MATRIX NODE...
                    </div>
                  )}

                  {user.handshake_status === 'received' && (
                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(230,161,92,0.05)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(230,161,92,0.15)' }}>
                      <div onClick={() => acceptHandshake(user.id)} style={{ flex: 1, backgroundColor: '#E6A15C', color: '#140D0C', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' }}>
                        ACCEPT
                      </div>
                      <div onClick={() => declineHandshake(user.id)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: '#A68F81', padding: '6px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', textAlign: 'center' }}>
                        IGNORE
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {roomUsers.length === 0 && (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#6E5950', fontSize: '12px' }}>
                  No extra broadcasting nodes found in this sector.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRIVACY RELATIONSHIP VAULT */}
        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>Relationship Vault</div>
              <div style={{ fontSize: '11px', color: '#6E5950', marginTop: '2px' }}>Fully Unmasked Secure Connections</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vaultUsers.map(user => (
                <div key={user.id} style={{ backgroundColor: 'rgba(38, 25, 22, 0.3)', borderRadius: '18px', padding: '16px', border:  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '500', color: '#FDFBF7' }}>{user.full_name}</div>
                      <div style={{ fontSize: '12px', color: '#D9C3B0', marginTop: '2px' }}>{user.title} — <span style={{ color: '#A68F81' }}>{user.domain}</span></div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                    <textarea value={vaultNotes[user.id] || ''} onChange={(e) => setVaultNotes({...vaultNotes, [user.id]: e.target.value})} placeholder="Write down private details or booth markers..." style={{ width: '100%', background: 'rgba(20, 13, 12, 0.4)', border: '1px solid rgba(245, 230, 211, 0.04)', borderRadius: '10px', color: '#D9C3B0', padding: '8px 10px', fontSize: '11px', resize: 'none', height: '44px', outline: 'none', fontFamily: 'inherit' }} />
                  </div>

                  {user.contact_cleared ? (
                    <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(140, 230, 92, 0.04)', border: '1px solid rgba(140, 230, 92, 0.15)', display: 'flex', gap: '8px' }}>
                      {user.shared_channels.phone && <a href={} style={{ textDecoration: 'none', padding: '4px 10px', background: 'rgba(245,230,211,0.05)', borderRadius: '6px', fontSize: '10px', color: '#F5E6D3' }}>PHONE</a>}
                      {user.shared_channels.linkedin && <a href={} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '4px 10px', background: 'rgba(245,230,211,0.05)', borderRadius: '6px', fontSize: '10px', color: '#F5E6D3' }}>LINKEDIN</a>}
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
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(20,13,12,0.3)', padding: '8px 12px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#6E5950', fontStyle: 'italic' }}>Requires home/late-night QR scan to exchange socials</span>
                      <div onClick={() => simulateQRScanHandshake(user.id)} style={{ fontSize: '9px', color: '#A68F81', background: 'rgba(245,230,211,0.05)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>[Simulate QR Scan]</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PRESENCE PROFILE */}
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
