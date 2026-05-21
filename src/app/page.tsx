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
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('presence');
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [blackoutMode, setBlackoutMode] = useState(false);
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

  const [vaultUsers, setVaultUsers] = useState<Networker[]>([
    { 
      id: '1', 
      name: 'Alex', 
      title: 'Design Director', 
      domain: 'Modular Structures', 
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
    '1': 'Discussed stacking constraints for the container build.',
    '2': 'Exchanged ideas on the champagne-blush silk palette.'
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

  const downloadVCard = (user: Networker) => {
    const vcardData = ['BEGIN:VCARD','VERSION:3.0',`FN:${user.name}`,`ORG:${user.domain}`,`TITLE:${user.title}`,`EMAIL;TYPE=PREF,INTERNET:${user.email || ''}`,`TEL;TYPE=CELL:${user.phone || ''}`,'END:VCARD'].join('\n');
    const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${user.name}_Card.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSystemStatus(`Saved ${user.name} Node`);
  };

  const isWithin48Hours = (timestampString: string) => {
    return (Date.now() - new Date(timestampString).getTime()) / (1000 * 60 * 60) <= 48;
  };

  const getRemainingHours = (timestampString: string) => {
    const left = Math.max(0, Math.ceil(48 - (Date.now() - new Date(timestampString).getTime()) / (1000 * 60 * 60)));
    return `${left}h left`;
  };

  const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=180x180&chl=${encodeURIComponent(currentUrl)}&chco=F5E6D3&chf=bg,s,65432100`;

  if (blackoutMode) {
    return (
      <div onClick={() => setBlackoutMode(false)} style={{ width: '100vw', height: '100vh', backgroundColor: '#0E0908', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ border: '1px solid rgba(245, 230, 211, 0.15)', padding: '48px 24px', borderRadius: '32px', backgroundColor: 'rgba(38, 25, 22, 0.3)', backdropFilter: 'blur(20px)', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '200', color: '#F5E6D3', margin: '0 0 12px 0' }}>Connection Made.</h1>
          <p style={{ fontSize: '14px', color: '#A68F81', fontWeight: '300', margin: 0 }}>Look up and meet.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#140D0C', color: '#FDFBF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      
      {/* UPPER 60%: Interaction Scroll Canvas */}
      <div style={{ flex: 1, padding: '24px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* TAB 1: THE ROOM */}
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase', marginBottom: '16px' }}>
              {sessionAnchor}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#6E5950', fontSize: '13px', fontWeight: '300' }}>
              Anti-Lurker Reciprocity Active.<br />Toggle Visibility Mode below to scan.
            </div>
          </div>
        )}

        {/* TAB 2: ULTRA-COMPACT RELATIONSHIP VAULT */}
        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>Relationship Vault</div>
              <div style={{ fontSize: '11px', color: '#6E5950', marginTop: '2px' }}>Decentralized Proximity Archive</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {vaultUsers.map(user => (
                <div key={user.id} style={{
                  backgroundColor: 'rgba(38, 25, 22, 0.3)', borderRadius: '16px', padding: '14px 16px',
                  border: `1px solid ${user.ring_color}33`, boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                }}>
                  {/* Top Line Identity Metrics */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#F5E6D3' }}>
                      {user.name} <span style={{ fontSize: '12px', color: '#A68F81', fontWeight: '300', marginLeft: '6px' }}>{user.title} — {user.domain}</span>
                    </div>
                    {isWithin48Hours(user.timestamp) && (
                      <div style={{ fontSize: '10px', color: '#E6A15C', background: 'rgba(230, 161, 92, 0.08)', padding: '2px 8px', borderRadius: '10px' }}>
                        {getRemainingHours(user.timestamp)}
                      </div>
                    )}
                  </div>
                  
                  {/* Notes Subtext Field */}
                  <div style={{ fontSize: '11px', color: '#6E5950', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {vaultNotes[user.id] || 'No notes added.'}
                  </div>

                  {/* Inline Action Interface Array */}
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                    {user.contact_cleared ? (
                      <>
                        <a href={`mailto:${user.email}`} style={{ textDecoration: 'none', padding: '6px 12px', background: 'rgba(245,230,211,0.05)', border: '1px solid rgba(245,230,211,0.1)', borderRadius: '8px', fontSize: '10px', color: '#F5E6D3', letterSpacing: '0.5px' }}>EMAIL</a>
                        <a href={`tel:${user.phone}`} style={{ textDecoration: 'none', padding: '6px 12px', background: 'rgba(245,230,211,0.05)', border: '1px solid rgba(245,230,211,0.1)', borderRadius: '8px', fontSize: '10px', color: '#F5E6D3', letterSpacing: '0.5px' }}>DIAL</a>
                        <div onClick={() => downloadVCard(user)} style={{ padding: '6px 12px', background: 'rgba(230,161,92,0.1)', border: '1px solid rgba(230,161,92,0.2)', borderRadius: '8px', fontSize: '10px', color: '#E6A15C', cursor: 'pointer', letterSpacing: '0.5px' }}>vCARD</div>
                      </>
                    ) : (
                      <div onClick={() => handleTier2Clearance(user.id)} style={{ fontSize: '10px', color: '#D9C3B0', letterSpacing: '0.5px', cursor: 'pointer', borderBottom: '1px dashed #6E5950', paddingBottom: '1px' }}>
                        + Request Security Clearance Swap
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PRESENCE MATRIX CARD */}
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

            {/* In-View Dynamic QR Projection Grid */}
            {isVisible && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', backgroundColor: 'rgba(38, 25, 22, 0.4)', borderRadius: '20px', border: '1px solid rgba(245, 230, 211, 0.05)', marginTop: '4px' }}>
                <img src={qrCodeUrl} alt="Proximity QR Node" style={{ width: '120px', height: '120px', display: 'block', padding: '6px', backgroundColor: 'rgba(20, 13, 12, 0.4)', borderRadius: '12px', marginBottom: '8px' }} />
                <div style={{ fontSize: '9px', fontWeight: '500', letterSpacing: '1px', color: '#6E5950' }}>LIVE RADAR NODE ANCHOR</div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* LOWER 40%: Fixed Strict Ergonomic Dock Engine */}
      <div style={{
        height: '38%', background: 'linear-gradient(to top, #0E0908 90%, rgba(20, 13, 12, 0))',
        padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box', zIndex: 10
      }}>
        
        {/* Context Intent Modal Overlap Array */}
        {showIntentModal && (
          <div style={{ backgroundColor: '#1C1211', border: '1px solid rgba(245, 230, 211, 0.15)', borderRadius: '20px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#D9C3B0', marginBottom: '6px', letterSpacing: '1px' }}>MANDATORY SESSION INTENT</div>
            <input type="text" placeholder="State active networking intention..." value={currentIntent} onChange={(e) => setCurrentUrlIntent(e.target.value)} style={{ width: '100%', background: '#0E0908', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '10px', padding: '10px', color: '#F5E6D3', marginBottom: '10px', boxSizing: 'border-box', fontSize: '13px' }} />
            <div onClick={confirmVisibility} style={{ backgroundColor: '#E6A15C', color: '#140D0C', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>BROADCAST IDENTITY</div>
          </div>
        )}

        {/* ERGONOMIC GLOBAL VISIBILITY CONTROLLER ANCHOR */}
        <div style={{
          padding: '12px 16px', borderRadius: '16px', backgroundColor: 'rgba(38,25,22,0.6)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(245, 230, 211, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#F5E6D3', letterSpacing: '0.5px' }}>Visible Broadcast Mode</div>
            <div style={{ fontSize: '10px', color: '#6E5950', marginTop: '1px' }}>{isVisible ? 'Broadcasting Proximity Node' : 'Invisible / Discovery Disengaged'}</div>
          </div>
          <div onClick={handleVisibilityToggle} style={{ width: '42px', height: '22px', backgroundColor: isVisible ? '#E6A15C' : '#2E1E1B', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: '0.2s' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '23px' : '3px', transition: '0.2s' }} />
          </div>
        </div>

        {/* Operational Status Diagnostics */}
        <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '9px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {systemStatus}
        </div>

        {/* Tab Dock Array */}
        <div style={{
          height: '56px', backgroundColor: 'rgba(28, 18, 17, 0.9)', borderRadius: '16px', border: '1px solid rgba(245, 230, 211, 0.08)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center', backdropFilter: 'blur(10px)'
        }}>
          <div onClick={() => setActiveTab('room')} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'room' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px', fontWeight: activeTab === 'room' ? '600' : '400' }}>THE ROOM</div>
          <div onClick={() => setActiveTab('vault')} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'vault' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px', fontWeight: activeTab === 'vault' ? '600' : '400' }}>THE VAULT</div>
          <div onClick={() => setActiveTab('presence')} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'presence' ? '#F5E6D3' : '#6E5950', cursor: 'pointer', padding: '12px', fontWeight: activeTab === 'presence' ? '600' : '400' }}>PRESENCE</div>
        </div>

      </div>

    </div>
  );
}
