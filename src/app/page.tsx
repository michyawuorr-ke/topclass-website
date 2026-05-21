'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize production environment nodes (Fallbacks prevent build breaks)
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
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('room');
  const [isVisible, setIsVisible] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Sovereign Matrix Node Ready');
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [sessionAnchor] = useState('ROOM: NAIROBI_GARAGE');
  const [showIntentModal, setShowIntentModal] = useState(false);

  // Dynamic state populated directly by global cluster feeds
  const [roomUsers, setRoomUsers] = useState<Networker[]>([]);
  const [vaultUsers, setVaultUsers] = useState<Networker[]>([]);
  
  const [profile, setProfile] = useState({
    id: 'my-unique-node-id', // Populated via real auth layer in production
    name: 'Michy',
    title: 'Principal Architecture Lead',
    domain: 'Digital Infrastructure & Spatial Design'
  });

  // Real-Time High-Concurrency Synchronization Engine
  useEffect(() => {
    if (!isVisible) {
      setRoomUsers([]);
      return;
    }

    // Fetch snapshot of active broadcast nodes inside this sector code
    const fetchActiveNodes = async () => {
      const { data, error } = await supabase
        .from('active_presence_nodes')
        .select('*')
        .eq('room_anchor', sessionAnchor)
        .not('id', 'eq', profile.id); // Filter out self

      if (!error && data) setRoomUsers(data);
    };

    fetchActiveNodes();

    // Subscribe to live multi-user mutations via WebSockets channel
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

  const handleVisibilityToggle = () => {
    if (!isVisible) {
      setShowIntentModal(true);
    } else {
      executeNodeTeardown();
    }
  };

  const confirmVisibility = async () => {
    if (!currentIntent.trim()) return;
    setShowIntentModal(false);

    // Write real state to central database node
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
      setSystemStatus(`Node broadcasting to cluster: ${sessionAnchor}`);
    }
  };

  const executeNodeTeardown = async () => {
    setIsVisible(false);
    await supabase.from('active_presence_nodes').delete().eq('id', profile.id);
    setSystemStatus('Node Offline. Spatial Shunt Engaged.');
  };

  const initiateHandshake = async (targetId: string) => {
    setSystemStatus('Securing handshake transactional pathway...');
    const { error } = await supabase.from('handshake_transactions').insert({
      sender_id: profile.id,
      receiver_id: targetId,
      status: 'sent'
    });

    if (!error) setSystemStatus('Handshake pipeline bound securely upstream.');
  };

  return (
    <div style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#0A0605', color: '#FDFBF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      
      {/* UPPER AREA: Active Stream Viewport Canvas */}
      <div style={{ flex: 1, padding: '24px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>
                {sessionAnchor}
              </div>
              <div style={{ fontSize: '11px', color: '#4E3C36', marginTop: '2px' }}>Cluster Node Stream Feed</div>
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
                    <div style={{ fontSize: '11px', color: '#E6A15C', marginTop: '6px', fontStyle: 'italic', lineHeight: '1.4' }}>
                      "{user.intent}"
                    </div>
                  </div>

                  {user.handshake_status === 'none' && (
                    <div onClick={() => initiateHandshake(user.id)} style={{ alignSelf: 'flex-start', fontSize: '10px', color: '#E6A15C', border: '1px solid rgba(230,161,92,0.3)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', letterSpacing: '0.5px', fontWeight: '600' }}>
                      INITIATE HANDSHAKE
                    </div>
                  )}
                </div>
              ))}

              {roomUsers.length === 0 && (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#4E3C36', fontSize: '12px', fontStyle: 'italic' }}>
                  {isVisible ? 'Listening for concurrent nodes...' : 'Turn on Broadcast Mode to populate the local feed matrix.'}
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vaultUsers.map(user => (
                <div key={user.id} style={{ backgroundColor: 'rgba(20, 13, 12, 0.4)', borderRadius: '24px', padding: '20px', border: '1px solid rgba(230,161,92,0.1)' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#FDFBF7' }}>{user.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#D9C3B0', marginTop: '2px' }}>{user.title} — <span style={{ color: '#A68F81' }}>{user.domain}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>Identity Matrix</div>
            
            <div style={{ 
              width: '100%', backgroundColor: 'rgba(10, 6, 5, 0.6)', borderRadius: '24px', padding: '24px', 
              border: '1px solid rgba(245, 230, 211, 0.025)',
              boxShadow: '0 0 20px 1px rgba(245, 230, 211, 0.015), inset 0 0 12px rgba(245, 230, 211, 0.01)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div><div style={{ fontSize: '8px', color: '#5E4A40', letterSpacing: '1.5px', textTransform: 'uppercase' }}>IDENTITY HANDLE</div><div style={{ fontSize: '20px', fontWeight: '300', color: '#F5E6D3' }}>{profile.name}</div></div>
                <div><div style={{ fontSize: '8px', color: '#5E4A40', letterSpacing: '1.5px', textTransform: 'uppercase' }}>DESIGNATION</div><div style={{ fontSize: '13px', color: '#D9C3B0' }}>{profile.title}</div></div>
                <div><div style={{ fontSize: '8px', color: '#5E4A40', letterSpacing: '1.5px', textTransform: 'uppercase' }}>PROFESSIONAL DOMAIN</div><div style={{ fontSize: '12px', color: '#A68F81', lineHeight: '1.4' }}>{profile.domain}</div></div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* LOWER 40% CONTROL HUB - PRODUCTION ALIGNED */}
      <div style={{ 
        background: 'linear-gradient(to top, #0A0605 85%, rgba(10, 6, 5, 0))', 
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' 
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

        <div style={{ 
          padding: '14px 18px', borderRadius: '16px', backgroundColor: 'rgba(20, 13, 12, 0.3)', 
          border: '1px solid rgba(245, 230, 211, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#F5E6D3', letterSpacing: '0.5px' }}>Visible Broadcast Mode</div>
            <div style={{ fontSize: '10px', color: '#5E4A40', marginTop: '2px' }}>{isVisible ? 'Broadcasting Active Node' : 'Matrix Shielded / Hidden'}</div>
          </div>
          <div onClick={handleVisibilityToggle} style={{ width: '44px', height: '24px', backgroundColor: isVisible ? '#E6A15C' : '#1C1210', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '23px' : '3px', transition: 'left 0.2s' }} />
          </div>
        </div>

        <div style={{ 
          height: '56px', backgroundColor: 'rgba(20, 13, 12, 0.85)', borderRadius: '16px', 
          border: '1px solid rgba(245, 230, 211, 0.04)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backdropFilter: 'blur(20px)' 
        }}>
          <div onClick={() => setActiveTab('room')} style={{ fontSize: '10px', letterSpacing: '1.5px', fontWeight: '500', color: activeTab === 'room' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>THE ROOM</div>
          <div onClick={() => setActiveTab('vault')} style={{ fontSize: '10px', letterSpacing: '1.5px', fontWeight: '500', color: activeTab === 'vault' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>THE VAULT</div>
          <div onClick={() => setActiveTab('presence')} style={{ fontSize: '10px', letterSpacing: '1.5px', fontWeight: '500', color: activeTab === 'presence' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>PRESENCE</div>
        </div>

      </div>

    </div>
  );
}
