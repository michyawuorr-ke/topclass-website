'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode } from 'html5-qrcode';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Networker {
  id: string;
  name: string;
  title: string;
  domain: string;
  intent: string;
  current_station?: string;
}

export default function OreetiAmbientEngine() {
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('presence');
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  
  // Cohesive local states
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [domain, setDomain] = useState('');
  
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [ambientMeetingGuide, setAmbientMeetingGuide] = useState<string | null>(null);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  // Active Discovery Feeds
  const [roomUsers, setRoomUsers] = useState<Networker[]>([]);
  const [vaultUsers, setVaultUsers] = useState<any[]>([]);
  const [incomingHandshakes, setIncomingHandshakes] = useState<any[]>([]);
  const [pendingSentCount, setPendingSentCount] = useState(0);
  
  const [userId, setUserId] = useState<string>('');
  const [dynamicQrToken, setDynamicQrToken] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Establish stable peer identity node on initial load
  useEffect(() => {
    const existingId = localStorage.getItem('presence_peer_id');
    if (existingId) {
      setUserId(existingId);
    } else {
      const newId = `node-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('presence_peer_id', newId);
      setUserId(newId);
    }
  }, []);

  useEffect(() => {
    if (!fullName || !userId) return;
    const generateSecureToken = () => {
      setDynamicQrToken(`${userId}||${Date.now()}||${Math.random().toString(36).substring(2, 7)}`);
    };
    generateSecureToken();
    const tokenRotationInterval = setInterval(generateSecureToken, 45000);
    return () => clearInterval(tokenRotationInterval);
  }, [userId, fullName]);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(dynamicQrToken)}&color=e6a15c&bgcolor=0e0908`;

  // Persistent heartbeats to ensure secondary testing nodes stay visible
  useEffect(() => {
    if (!isVisible || !userId) return;
    const heartbeat = setInterval(async () => {
      await supabase
        .from('active_presence_nodes')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId);
    }, 5000);
    return () => clearInterval(heartbeat);
  }, [isVisible, userId]);

  // Dynamic discovery pipeline pulling active broadcast nodes inside the space
  const fetchActiveNodes = async () => {
    if (!userId) return;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('active_presence_nodes')
      .select('id, name, title, domain, intent, current_station')
      .gt('last_seen', oneHourAgo)
      .not('id', 'eq', userId);

    if (data) {
      setRoomUsers(data as Networker[]);
    }
  };

  useEffect(() => {
    if (!isVisible || !userId) {
      setRoomUsers([]);
      return;
    }

    fetchActiveNodes();

    const realTimeChannel = supabase
      .channel('room_ambient_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_presence_nodes' }, () => {
        fetchActiveNodes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(realTimeChannel);
    };
  }, [isVisible, userId]);

  const syncDatabaseFeeds = async () => {
    if (!userId) return;
    const { data: vaultData } = await supabase
      .from('vault_connections')
      .select('connected_user_id, name, title, domain, connection_method')
      .eq('user_id', userId);

    if (vaultData) setVaultUsers(vaultData);

    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const { data: discoveryRequests } = await supabase
      .from('vault_connections')
      .select('user_id, name, title')
      .eq('connected_user_id', userId)
      .eq('connection_method', 'discovery')
      .eq('handshake_accepted', false)
      .gt('created_at', threeMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(2);

    if (discoveryRequests) setIncomingHandshakes(discoveryRequests);

    const { count } = await supabase
      .from('vault_connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('handshake_accepted', false)
      .gt('created_at', threeMinutesAgo);
    
    setPendingSentCount(count || 0);
  };

  useEffect(() => {
    if (!userId) return;
    syncDatabaseFeeds();
    const intervalSync = setInterval(syncDatabaseFeeds, 10000);

    const handshakeListener = supabase
      .channel('handshake_alerts')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vault_connections' }, async (payload: any) => {
        if (payload.new.user_id === userId && payload.new.connection_method === 'discovery' && payload.new.handshake_accepted === true) {
          setAmbientMeetingGuide("Handshake matching loop verified. Signal lock achieved.");
        }
      })
      .subscribe();

    return () => {
      clearInterval(intervalSync);
      supabase.removeChannel(handshakeListener);
    };
  }, [activeTab, userId]);

  const triggerDiscoveryHandshake = async (targetUserId: string) => {
    if (pendingSentCount >= 3) {
      setSystemAlert("Simultaneous connection vector limit capped.");
      setTimeout(() => setSystemAlert(null), 4000);
      return;
    }
    await supabase.from('vault_connections').insert({ user_id: userId, connected_user_id: targetUserId, connection_method: 'discovery', handshake_accepted: false, created_at: new Date().toISOString() });
    syncDatabaseFeeds();
  };

  const acceptDiscoveryHandshake = async (requesterId: string) => {
    await supabase.from('vault_connections').update({ handshake_accepted: true }).eq('user_id', requesterId).eq('connected_user_id', userId);
    await supabase.from('vault_connections').insert({ user_id: userId, connected_user_id: requesterId, connection_method: 'discovery', handshake_accepted: true });
    setAmbientMeetingGuide("Proximity connection securely compiled.");
    syncDatabaseFeeds();
  };

  const declineDiscoveryHandshake = async (requesterId: string) => {
    await supabase.from('vault_connections').delete().eq('user_id', requesterId).eq('connected_user_id', userId);
    syncDatabaseFeeds();
  };

  const confirmVisibility = async () => {
    if (!fullName.trim() || !role.trim() || !domain.trim() || !currentIntent.trim() || !selectedStation.trim()) {
      setSystemAlert("Populate profile asset cards before emitting discovery frequencies.");
      setTimeout(() => setSystemAlert(null), 4000);
      return;
    }
    setShowIntentModal(false);
    setIsVisible(true);

    await supabase.from('active_presence_nodes').upsert({
      id: userId,
      name: fullName,
      title: role,
      domain: domain,
      intent: currentIntent,
      current_station: selectedStation,
      room_anchor: 'global_unfiltered_presence',
      last_seen: new Date().toISOString()
    });
    
    setTimeout(fetchActiveNodes, 500);
  };

  return (
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#0A0605', color: '#FDFBF7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Toast Alert Systems */}
      <div style={{ position: 'fixed', top: '24px', left: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ambientMeetingGuide && (
          <div onClick={() => setAmbientMeetingGuide(null)} style={{ background: '#140D0C', border: '1px solid #E6A15C', borderRadius: '12px', padding: '16px', color: '#F5E6D3', fontSize: '12px', letterSpacing: '0.5px', cursor: 'pointer' }}>
            {ambientMeetingGuide}
          </div>
        )}
        {systemAlert && (
          <div style={{ background: '#1C1210', border: '1px solid rgba(230,161,92,0.1)', borderRadius: '12px', padding: '12px 16px', color: '#A68F81', fontSize: '11px', textAlign: 'center' }}>
            {systemAlert}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '48px 28px 0 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
        
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#8A7366', fontWeight: '600', letterSpacing: '2px' }}>DISCOVERED SIGNALS ({roomUsers.length})</div>
              </div>
            </div>

            {roomUsers.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4E3C36', fontSize: '12px', fontStyle: 'italic', textAlign: 'center', padding: '40px 20px', lineHeight: '1.6' }}>
                No active signals broadcasting in your immediate radius.<br/>Ensure secondary devices are set to "Live Broadcast Mode".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {roomUsers.map(user => (
                  <div key={user.id} style={{ padding: '24px', borderRadius: '20px', backgroundColor: '#110D0C', border: '1px solid rgba(230,161,92,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, paddingRight: '16px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '400', color: '#F5E6D3', letterSpacing: '-0.2px' }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: '#E6A15C', marginTop: '4px', opacity: 0.85 }}>{user.title} <span style={{ color: '#8A7366' }}>@ {user.domain}</span></div>
                      {user.current_station && (
                        <div style={{ fontSize: '10px', color: '#8A7366', marginTop: '8px', letterSpacing: '0.5px' }}>STATION: {user.current_station}</div>
                      )}
                    </div>
                    <div onClick={() => triggerDiscoveryHandshake(user.id)} style={{ padding: '10px 16px', backgroundColor: 'rgba(230,161,92,0.08)', border: '1px solid rgba(230,161,92,0.2)', color: '#E6A15C', borderRadius: '8px', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', cursor: 'pointer' }}>
                      PING
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '2px', color: '#E6A15C', textTransform: 'uppercase', marginBottom: '16px' }}>Secure Vault Network</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {vaultUsers.map((user, i) => (
                  <div key={i} style={{ backgroundColor: '#110D0C', borderRadius: '20px', padding: '24px', border: '1px solid rgba(230,161,92,0.02)' }}>
                    <div style={{ fontSize: '16px', fontWeight: '400', color: '#FDFBF7' }}>{user.name || 'Secure Connection'}</div>
                    <div style={{ fontSize: '12px', color: '#D9C3B0', marginTop: '4px' }}>{user.title} • {user.domain}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: '32px', alignItems: 'center' }}>
            {incomingHandshakes.map((req, idx) => (
              <div key={idx} style={{ width: '100%', maxWidth: '350px', backgroundColor: '#140D0C', border: '1px solid rgba(230,161,92,0.2)', borderRadius: '20px', padding: '20px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '9px', fontWeight: '600', color: '#E6A15C', letterSpacing: '1.5px', marginBottom: '8px' }}>INCOMING VERIFICATION LAYER</div>
                <div style={{ fontSize: '13px', color: '#F5E6D3', marginBottom: '14px' }}>Authorize connection handshake request from <strong>{req.name}</strong>?</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => acceptDiscoveryHandshake(req.user_id)} style={{ flex: 1, padding: '10px', background: '#E6A15C', color: '#0A0605', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>ACCEPT</button>
                  <button onClick={() => declineDiscoveryHandshake(req.user_id)} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', color: '#8A7366', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>BYPASS</button>
                </div>
              </div>
            ))}

            {/* Perfect Premium Spacious Luxury Identity Asset Card */}
            <div style={{ width: '100%', maxWidth: '350px', backgroundColor: '#110D0C', borderRadius: '28px', padding: '40px 32px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid rgba(230,161,92,0.02)', boxShadow: '0 35px 70px -15px rgba(0,0,0,0.7)' }}>
              
              {/* Clean Absolute Global Edit Handle (Always Pencil SVG Icon) */}
              <div 
                onClick={() => setIsEditing(!isEditing)} 
                style={{ position: 'absolute', top: '32px', right: '32px', width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(230,161,92,0.1)', background: 'rgba(20,13,12,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E6A15C" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>

              {isEditing ? (
                /* True Premium Boxless Input Setup — Infused with Champagne & Cognac Tone Tiers */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '500' }}>Full Name</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Adriaan Louw" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#FDFBF7', boxSizing: 'border-box', outline: 'none', fontSize: '20px', fontWeight: '300', letterSpacing: '-0.2px' }} 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '500' }}>Professional Title</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Lead Architect" 
                      value={role} 
                      onChange={(e) => setRole(e.target.value)} 
                      style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#E6A15C', boxSizing: 'border-box', outline: 'none', fontSize: '15px', fontWeight: '400', letterSpacing: '0.2px' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '500' }}>Operational Domain</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Sovereign Studio" 
                      value={domain} 
                      onChange={(e) => setDomain(e.target.value)} 
                      style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#D9C3B0', boxSizing: 'border-box', outline: 'none', fontSize: '14px', fontWeight: '300' }} 
                    />
                  </div>

                  {/* Clean Dedicated Inline Save Mechanism */}
                  <div 
                    onClick={() => setIsEditing(false)}
                    style={{ marginTop: '12px', alignSelf: 'flex-start', padding: '10px 22px', borderRadius: '10px', background: 'rgba(230,161,92,0.06)', border: '1px solid rgba(230,161,92,0.25)', color: '#E6A15C', fontSize: '10px', fontWeight: '600', letterSpacing: '2px', cursor: 'pointer' }}
                  >
                    SAVE PROFILE
                  </div>
                </div>
              ) : (
                /* Pure Vertical Stack Layout Architecture for Full-Card Volume Presence */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  
                  {/* Name Tier Block */}
                  <div style={{ fontSize: '24px', fontWeight: '300', color: fullName.trim() ? '#FDFBF7' : '#3E2E2A', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
                    {fullName.trim() ? fullName : 'name'}
                  </div>
                  
                  {/* Role Tier Block */}
                  <div style={{ color: role.trim() ? '#E6A15C' : '#3E2E2A', fontSize: '14px', fontWeight: '400', letterSpacing: '0.5px' }}>
                    {role.trim() ? role : 'role'}
                  </div>

                  {/* Domain Tier Block */}
                  <div style={{ fontSize: '13px', color: domain.trim() ? '#D9C3B0' : '#3E2E2A', fontWeight: '300', opacity: domain.trim() ? 0.8 : 1 }}>
                    {domain.trim() ? domain : 'domain'}
                  </div>
                  
                </div>
              )}

            </div>

            {isVisible ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '20px', background: 'rgba(20, 13, 12, 0.3)' }}>
                <img src={qrCodeUrl} alt="Dynamic Identity Token" style={{ width: '130px', height: '130px', borderRadius: '12px' }} />
                <div style={{ fontSize: '8px', color: '#E6A15C', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '600' }}>Active Signal Field Emitting</div>
              </div>
            ) : (
              <div style={{ padding: '0 24px', textAlign: 'center', color: '#4E3C36', fontSize: '11px', letterSpacing: '0.5px', fontStyle: 'italic', maxWidth: '290px', lineHeight: '1.6' }}>Awaken the pencil micro-component to bind metadata streams to your terminal node.</div>
            )}
          </div>
        )}

      </div>

      {/* Persistent Base Interface Switches */}
      <div style={{ background: 'linear-gradient(to top, #0A0605 85%, rgba(10, 6, 5, 0))', padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
        
        {/* Streamlined Pre-Live Configuration Interstitial */}
        {showIntentModal && (
          <div style={{ backgroundColor: '#110D0C', border: '1px solid rgba(230, 161, 92, 0.12)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Current Focus Intent?" 
                value={currentIntent} 
                onChange={(e) => setCurrentUrlIntent(e.target.value)} 
                style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(230, 161, 92, 0.1)', borderRadius: '12px', padding: '16px', color: '#F5E6D3', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }} 
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Private Landmark Station?" 
                value={selectedStation} 
                onChange={(e) => setSelectedStation(e.target.value)} 
                style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(230, 161, 92, 0.1)', borderRadius: '12px', padding: '16px', color: '#F5E6D3', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <div onClick={confirmVisibility} style={{ flex: 1, backgroundColor: '#E6A15C', color: '#140D0C', padding: '15px', borderRadius: '12px', textAlign: 'center', fontSize: '11px', fontWeight: '600', cursor: 'pointer', letterSpacing: '1.5px' }}>EMIT SIGNAL</div>
              <div onClick={() => setShowIntentModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', color: '#8A7366', padding: '15px', borderRadius: '12px', textAlign: 'center', fontSize: '11px', cursor: 'pointer', letterSpacing: '0.5px' }}>CANCEL</div>
            </div>
          </div>
        )}

        {/* Ambient Broadcast Toggle Node */}
        <div style={{ padding: '18px 24px', borderRadius: '24px', backgroundColor: 'rgba(17, 13, 12, 0.7)', border: '1px solid rgba(230, 161, 92, 0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '400', color: '#F5E6D3', letterSpacing: '0.3px' }}>Visible Broadcast Mode</div>
            {isVisible && <div style={{ fontSize: '10px', color: '#8A7366', marginTop: '4px', letterSpacing: '0.5px' }}>Active at {selectedStation}</div>}
          </div>
          <div onClick={() => { if (!isVisible) { if (!fullName.trim() || !role.trim() || !domain.trim()) { setSystemAlert("Populate your network asset card details first."); setTimeout(() => setSystemAlert(null), 3000); return; } setShowIntentModal(true); } else { setIsVisible(false); supabase.from('active_presence_nodes').delete().eq('id', userId); setRoomUsers([]); } }} style={{ width: '46px', height: '24px', backgroundColor: isVisible ? '#E6A15C' : '#1C1210', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.25s ease' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '25px' : '3px', transition: 'left 0.25s ease', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} />
          </div>
        </div>

        {/* System Tab Selector Switchboard */}
        <div style={{ height: '56px', backgroundColor: 'rgba(17, 13, 12, 0.95)', borderRadius: '24px', border: '1px solid rgba(230,161,92,0.03)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backdropFilter: 'blur(30px)' }}>
          <div onClick={() => { setActiveTab('room'); setIsScanning(false); fetchActiveNodes(); }} style={{ fontSize: '10px', letterSpacing: '2px', color: activeTab === 'room' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '16px', fontWeight: activeTab === 'room' ? '600' : '400' }}>ROOM</div>
          <div onClick={() => { setActiveTab('vault'); setIsScanning(false); }} style={{ fontSize: '10px', letterSpacing: '2px', color: activeTab === 'vault' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '16px', fontWeight: activeTab === 'vault' ? '600' : '400' }}>VAULT</div>
          <div onClick={() => { setActiveTab('presence'); setIsScanning(false); }} style={{ fontSize: '10px', letterSpacing: '2px', color: activeTab === 'presence' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '16px', fontWeight: activeTab === 'presence' ? '600' : '400' }}>PRESENCE</div>
        </div>
      </div>

    </div>
  );
}
