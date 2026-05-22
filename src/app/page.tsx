'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Networker {
  id: string;
  name: string;
  full_name: string;
  title: string;
  domain: string;
  intent: string;
  ring_color: string;
  handshake_status: 'none' | 'sent' | 'received' | 'connected';
}

export default function OreetiSovereignEngine() {
  // LANDING DEFAULT VALUE SET TO PRESENCE AS INITIAL PAGE
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('presence');
  const [isVisible, setIsVisible] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Identity Matrix Securely Anchored');
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [sessionAnchor] = useState('ROOM: NAIROBI_GARAGE');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [roomUsers, setRoomUsers] = useState<Networker[]>([]);
  const [vaultUsers, setVaultUsers] = useState<Networker[]>([]);
  
  const [profile, setProfile] = useState({
    id: 'my-unique-node-id',
    name: 'Michy',
    title: 'Principal Architecture Lead',
    domain: 'Digital Infrastructure & Spatial Design'
  });

  const [editName, setEditName] = useState(profile.name);
  const [editTitle, setEditTitle] = useState(profile.title);
  const [editDomain, setEditDomain] = useState(profile.domain);

  useEffect(() => {
    if (!isVisible) {
      setRoomUsers([]);
      return;
    }

    const fetchActiveNodes = async () => {
      const { data, error } = await supabase
        .from('active_presence_nodes')
        .select('*')
        .eq('room_anchor', sessionAnchor)
        .not('id', 'eq', profile.id);

      if (!error && data) setRoomUsers(data);
    };

    fetchActiveNodes();

    const realTimeChannel = supabase
      .channel(`room_evolution_${sessionAnchor}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_presence_nodes' }, () => {
        fetchActiveNodes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(realTimeChannel);
    };
  }, [isVisible, sessionAnchor, profile.id]);

  const toggleBroadcastMode = () => {
    if (!isVisible) {
      setShowIntentModal(true);
    } else {
      executeNodeTeardown();
    }
  };

  const confirmVisibility = async () => {
    if (!currentIntent.trim()) return;
    setShowIntentModal(false);

    const { error } = await supabase.from('active_presence_nodes').upsert({
      id: profile.id,
      name: profile.name,
      title: profile.title,
      domain: profile.domain,
      intent: currentIntent,
      room_anchor: sessionAnchor,
      last_seen: new Date().toISOString()
    });

    if (error) {
      setSystemStatus('Engine Broadcast Failed: Node Rejected.');
    } else {
      setIsVisible(true);
      setSystemStatus(`Broadcasting Node to cluster`);
    }
  };

  const executeNodeTeardown = async () => {
    setIsVisible(false);
    await supabase.from('active_presence_nodes').delete().eq('id', profile.id);
    setSystemStatus('Node Offline. Spatial Shunt Engaged.');
  };

  const saveProfileEdits = () => {
    setProfile({
      ...profile,
      name: editName,
      title: editTitle,
      domain: editDomain
    });
    setIsEditingProfile(false);
    setSystemStatus('Identity Core Updated Successfully');
  };

  const triggerCameraScan = () => {
    setIsScanning(true);
    setSystemStatus('Initializing localized matrix optical scanner...');
    setTimeout(() => {
      setIsScanning(false);
      setSystemStatus('Scan completed. Target connection established.');
    }, 3000);
  };

  return (
    <div style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#0A0605', color: '#FDFBF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      
      {/* UPPER CANVAS VIEWPORT */}
      <div style={{ flex: 1, padding: '24px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
        
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>
                  {sessionAnchor}
                </div>
                <div style={{ fontSize: '11px', color: '#4E3C36', marginTop: '2px' }}>Masked Cluster Stream (Keywords Active)</div>
              </div>
              <div onClick={triggerCameraScan} style={{ fontSize: '10px', color: '#E6A15C', border: '1px solid rgba(230,161,92,0.2)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', letterSpacing: '1px', fontWeight: '500', background: 'rgba(230,161,92,0.02)' }}>
                {isScanning ? 'SCANNING...' : 'SCAN MATRIX'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roomUsers.map(user => (
                <div key={user.id} style={{ 
                  padding: '20px', borderRadius: '24px', backgroundColor: 'rgba(20, 13, 12, 0.4)', 
                  border: '1px solid rgba(230, 161, 92, 0.08)',
                  boxShadow: '0 0 15px rgba(230, 161, 92, 0.02)',
                  display: 'flex', flexDirection: 'column', gap: '14px' 
                }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#F5E6D3' }}>
                      {user.name} <span style={{ fontSize: '12px', color: '#8A7366', fontWeight: '300', marginLeft: '4px' }}>— {user.title}</span>
                    </div>
                    
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {user.intent.split(' ').map((word, i) => word.length > 4 && (
                        <span key={i} style={{ fontSize: '10px', background: 'rgba(230,161,92,0.05)', color: '#E6A15C', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(230,161,92,0.1)' }}>
                          {word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {roomUsers.length === 0 && (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#4E3C36', fontSize: '12px', fontStyle: 'italic' }}>
                  {isVisible ? 'Listening for proximal context markers...' : 'Engage the broadcast mode module to parse the local environment.'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>Relationship Vault</div>
              <div style={{ fontSize: '11px', color: '#4E3C36', marginTop: '2px' }}>Fully Unmasked Node Access</div>
            </div>
          </div>
        )}

        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>Identity Matrix</div>
            
            {/* CORONA CARD CONTEXT AND INLINE EDIT FORM */}
            <div style={{ 
              width: '100%', backgroundColor: 'rgba(10, 6, 5, 0.6)', borderRadius: '24px', padding: '24px', 
              border: '1px solid rgba(245, 230, 211, 0.025)',
              boxShadow: '0 0 20px 1px rgba(245, 230, 211, 0.015), inset 0 0 12px rgba(245, 230, 211, 0.01)',
              position: 'relative'
            }}>
              
              {/* EDIT ICON INTERACTION TRIGGER */}
              <div 
                onClick={() => setIsEditingProfile(!isEditingProfile)} 
                style={{ position: 'absolute', top: '20px', right: '20px', color: '#E6A15C', fontSize: '11px', cursor: 'pointer', letterSpacing: '1px', fontWeight: '600' }}
              >
                {isEditingProfile ? 'CANCEL' : 'EDIT'}
              </div>

              {isEditingProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '8px', color: '#5E4A40', letterSpacing: '1px' }}>HANDLE</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245,230,211,0.1)', padding: '8px', borderRadius: '8px', color: '#F5E6D3', marginTop: '4px', outline: 'none', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '8px', color: '#5E4A40', letterSpacing: '1px' }}>DESIGNATION</label>
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245,230,211,0.1)', padding: '8px', borderRadius: '8px', color: '#F5E6D3', marginTop: '4px', outline: 'none', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '8px', color: '#5E4A40', letterSpacing: '1px' }}>PROFESSIONAL DOMAIN</label>
                    <input type="text" value={editDomain} onChange={(e) => setEditDomain(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245,230,211,0.1)', padding: '8px', borderRadius: '8px', color: '#F5E6D3', marginTop: '4px', outline: 'none', fontSize: '12px' }} />
                  </div>
                  <div onClick={saveProfileEdits} style={{ backgroundColor: '#E6A15C', color: '#140D0C', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '600', cursor: 'pointer', marginTop: '6px' }}>
                    SAVE MATRIX CHANGES
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div><div style={{ fontSize: '8px', color: '#5E4A40', letterSpacing: '1.5px', textTransform: 'uppercase' }}>IDENTITY HANDLE</div><div style={{ fontSize: '20px', fontWeight: '300', color: '#F5E6D3' }}>{profile.name}</div></div>
                  <div><div style={{ fontSize: '8px', color: '#5E4A40', letterSpacing: '1.5px', textTransform: 'uppercase' }}>DESIGNATION</div><div style={{ fontSize: '13px', color: '#D9C3B0' }}>{profile.title}</div></div>
                  <div><div style={{ fontSize: '8px', color: '#5E4A40', letterSpacing: '1.5px', textTransform: 'uppercase' }}>PROFESSIONAL DOMAIN</div><div style={{ fontSize: '12px', color: '#A68F81', lineHeight: '1.4' }}>{profile.domain}</div></div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* LOWER 40% CONTROL HUB */}
      <div style={{ 
        background: 'linear-gradient(to top, #0A0605 80%, rgba(10, 6, 5, 0))', 
        padding: '0 24px 30px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box',
        zIndex: 10
      }}>
        
        {showIntentModal && (
          <div style={{ backgroundColor: '#140D10', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '20px', padding: '16px' }}>
            <div style={{ fontSize: '10px', color: '#D9C3B0', marginBottom: '6px', letterSpacing: '1px' }}>MANDATORY SESSION INTENT</div>
            <input type="text" placeholder="State active intent..." value={currentIntent} onChange={(e) => setCurrentUrlIntent(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245, 230, 211, 0.08)', borderRadius: '10px', padding: '10px', color: '#F5E6D3', marginBottom: '10px', boxSizing: 'border-box', outline: 'none' }} />
            <div onClick={confirmVisibility} style={{ backgroundColor: '#E6A15C', color: '#140D0C', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.5px' }}>BROADCAST IDENTITY</div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '9px', color: '#5E4A40', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {systemStatus}
        </div>

        {/* BROADCAST TOGGLE PANEL */}
        <div style={{ 
          padding: '14px 18px', borderRadius: '16px', backgroundColor: 'rgba(20, 13, 12, 0.45)', 
          border: '1px solid rgba(245, 230, 211, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#F5E6D3', letterSpacing: '0.5px' }}>Visible Broadcast Mode</div>
            <div style={{ fontSize: '10px', color: '#5E4A40', marginTop: '2px' }}>{isVisible ? 'Active Node Broadcasting' : 'Matrix Shielded / Dark'}</div>
          </div>
          <div onClick={toggleBroadcastMode} style={{ width: '44px', height: '24px', backgroundColor: isVisible ? '#E6A15C' : '#1C1210', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '23px' : '3px', transition: 'left 0.2s' }} />
          </div>
        </div>

        {/* FLOATING NAVIGATION INDEX */}
        <div style={{ 
          height: '56px', backgroundColor: 'rgba(20, 13, 12, 0.85)', borderRadius: '20px', 
          border: '1px solid rgba(245, 230, 211, 0.05)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backdropFilter: 'blur(30px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <div onClick={() => setActiveTab('room')} style={{ fontSize: '10px', letterSpacing: '1.5px', fontWeight: '500', color: activeTab === 'room' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>THE ROOM</div>
          <div onClick={() => setActiveTab('vault')} style={{ fontSize: '10px', letterSpacing: '1.5px', fontWeight: '500', color: activeTab === 'vault' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>THE VAULT</div>
          <div onClick={() => setActiveTab('presence')} style={{ fontSize: '10px', letterSpacing: '1.5px', fontWeight: '500', color: activeTab === 'presence' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>PRESENCE</div>
        </div>

      </div>

    </div>
  );
}
