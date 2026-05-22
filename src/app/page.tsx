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
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('presence');
  const [isVisible, setIsVisible] = useState(false);
  const [systemStatus, setSystemStatus] = useState('System Active');
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [sessionAnchor] = useState('Nairobi Garage');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [roomUsers, setRoomUsers] = useState<Networker[]>([]);
  const [vaultUsers, setVaultUsers] = useState<Networker[]>([]);
  
  const [profile, setProfile] = useState({
    id: 'user-node-id',
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
      .channel(`room_evolution`)
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
      setSystemStatus('Broadcast failed');
    } else {
      setIsVisible(true);
      setSystemStatus(`Broadcasting to space`);
    }
  };

  const executeNodeTeardown = async () => {
    setIsVisible(false);
    await supabase.from('active_presence_nodes').delete().eq('id', profile.id);
    setSystemStatus('Broadcast paused');
  };

  const saveProfileEdits = () => {
    setProfile({
      ...profile,
      name: editName,
      title: editTitle,
      domain: editDomain
    });
    setIsEditingProfile(false);
    setSystemStatus('Profile updated');
  };

  return (
    <div style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#0A0605', color: '#FDFBF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      
      {/* MAIN DATA VIEWPORT */}
      <div style={{ flex: 1, padding: '32px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
        
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '2px', color: '#D9C3B0', textTransform: 'uppercase' }}>
                {sessionAnchor}
              </div>
              <div style={{ fontSize: '11px', color: '#4E3C36', marginTop: '2px' }}>People Nearby</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roomUsers.map(user => (
                <div key={user.id} style={{ 
                  padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(20, 13, 12, 0.4)', 
                  border: '1px solid rgba(230, 161, 92, 0.08)',
                  display: 'flex', flexDirection: 'column', gap: '10px' 
                }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#F5E6D3' }}>
                      {user.name} <span style={{ fontSize: '12px', color: '#8A7366', fontWeight: '300', marginLeft: '4px' }}>— {user.title}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#E6A15C', marginTop: '6px' }}>
                      {user.intent}
                    </div>
                  </div>
                </div>
              ))}

              {roomUsers.length === 0 && (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#4E3C36', fontSize: '12px', fontStyle: 'italic' }}>
                  {isVisible ? 'Looking for connections...' : 'Turn on broadcast mode to see who is in the room.'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '2px', color: '#D9C3B0', textTransform: 'uppercase' }}>Saved Connections</div>
            </div>
          </div>
        )}

        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, alignItems: 'center' }}>
            
            {/* COMPACT NEW MOON CORONA BUSINESS CARD */}
            <div style={{ 
              width: '100%', 
              maxWidth: '320px',
              backgroundColor: 'rgba(14, 9, 8, 0.95)', 
              borderRadius: '16px', 
              padding: '28px 24px', 
              border: '1px solid rgba(245, 230, 211, 0.035)',
              boxShadow: '0 0 25px rgba(245, 230, 211, 0.015), inset 0 0 10px rgba(245, 230, 211, 0.01)',
              position: 'relative',
              boxSizing: 'border-box'
            }}>
              
              {/* EDIT ICON KEY COMPONENT */}
              <div 
                onClick={() => setIsEditingProfile(!isEditingProfile)} 
                style={{ position: 'absolute', top: '22px', right: '22px', cursor: 'pointer', opacity: 0.6, display: 'flex', alignItems: 'center' }}
              >
                {isEditingProfile ? (
                  <span style={{ fontSize: '9px', letterSpacing: '1px', color: '#E6A15C', fontWeight: '600' }}>CLOSE</span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E6A15C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                )}
              </div>

              {isEditingProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245,230,211,0.08)', padding: '10px', borderRadius: '8px', color: '#F5E6D3', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
                  <input type="text" placeholder="Role" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245,230,211,0.08)', padding: '10px', borderRadius: '8px', color: '#F5E6D3', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
                  <input type="text" placeholder="Domain" value={editDomain} onChange={(e) => setEditDomain(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245,230,211,0.08)', padding: '10px', borderRadius: '8px', color: '#F5E6D3', outline: 'none', fontSize: '12px', boxSizing: 'border-box' }} />
                  <div onClick={saveProfileEdits} style={{ backgroundColor: '#E6A15C', color: '#140D0C', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.5px' }}>
                    SAVE CHANGES
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Clean typographic hierarchy with zero label headers */}
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: '300', color: '#F5E6D3', letterSpacing: '-0.2px' }}>
                      {profile.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#E6A15C', marginTop: '4px', fontWeight: '400', letterSpacing: '0.2px' }}>
                      {profile.title}
                    </div>
                  </div>
                  
                  {profile.domain && (
                    <div style={{ fontSize: '11px', color: '#8A7366', lineHeight: '1.5', borderTop: '1px solid rgba(245,230,211,0.03)', paddingTop: '12px' }}>
                      {profile.domain}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* FIXED 40% NAVIGATION FOOTPRINT */}
      <div style={{ 
        background: 'linear-gradient(to top, #0A0605 80%, rgba(10, 6, 5, 0))', 
        padding: '0 24px 30px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box',
        zIndex: 10
      }}>
        
        {showIntentModal && (
          <div style={{ backgroundColor: '#140D10', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '16px', padding: '16px' }}>
            <input type="text" placeholder="What are you looking for right now?" value={currentIntent} onChange={(e) => setCurrentUrlIntent(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245, 230, 211, 0.08)', borderRadius: '8px', padding: '10px', color: '#F5E6D3', marginBottom: '10px', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }} />
            <div onClick={confirmVisibility} style={{ backgroundColor: '#E6A15C', color: '#140D0C', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>GO LIVE</div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '9px', color: '#4E3C36', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {systemStatus}
        </div>

        <div style={{ 
          padding: '14px 18px', borderRadius: '16px', backgroundColor: 'rgba(20, 13, 12, 0.45)', 
          border: '1px solid rgba(245, 230, 211, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#F5E6D3' }}>Visible Broadcast Mode</div>
          </div>
          <div onClick={toggleBroadcastMode} style={{ width: '44px', height: '24px', backgroundColor: isVisible ? '#E6A15C' : '#1C1210', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '23px' : '3px', transition: 'left 0.2s' }} />
          </div>
        </div>

        <div style={{ 
          height: '56px', backgroundColor: 'rgba(20, 13, 12, 0.85)', borderRadius: '20px', 
          border: '1px solid rgba(245, 230, 211, 0.05)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backdropFilter: 'blur(30px)'
        }}>
          <div onClick={() => setActiveTab('room')} style={{ fontSize: '10px', letterSpacing: '1.5px', fontWeight: '500', color: activeTab === 'room' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>ROOM</div>
          <div onClick={() => setActiveTab('vault')} style={{ fontSize: '10px', letterSpacing: '1.5px', fontWeight: '500', color: activeTab === 'vault' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>VAULT</div>
          <div onClick={() => setActiveTab('presence')} style={{ fontSize: '10px', letterSpacing: '1.5px', fontWeight: '500', color: activeTab === 'presence' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>PRESENCE</div>
        </div>

      </div>

    </div>
  );
}
