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
  const [isEditing, setIsEditing] = useState(true); 
  
  // Clean states
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [domain, setDomain] = useState('');
  
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [ambientMeetingGuide, setAmbientMeetingGuide] = useState<string | null>(null);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  // Feeds
  const [roomUsers, setRoomUsers] = useState<Networker[]>([]);
  const [vaultUsers, setVaultUsers] = useState<any[]>([]);
  const [incomingHandshakes, setIncomingHandshakes] = useState<any[]>([]);
  const [pendingSentCount, setPendingSentCount] = useState(0);
  
  const [userId, setUserId] = useState<string>('');
  const [dynamicQrToken, setDynamicQrToken] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    setUserId(`node-${Math.random().toString(36).substring(2, 15)}`);
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

  useEffect(() => {
    if (!isVisible || !userId) return;
    const heartbeat = setInterval(async () => {
      await supabase
        .from('active_presence_nodes')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId);
    }, 15000);
    return () => clearInterval(heartbeat);
  }, [isVisible, userId]);

  useEffect(() => {
    if (!isVisible || !userId) {
      setRoomUsers([]);
      return;
    }

    const fetchActiveNodes = async () => {
      const halfHourAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('active_presence_nodes')
        .select('id, name, title, domain, intent')
        .gt('last_seen', halfHourAgo)
        .not('id', 'eq', userId);

      if (data) setRoomUsers(data as Networker[]);
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
          const { data: targetNode } = await supabase
            .from('active_presence_nodes')
            .select('current_station, name')
            .eq('id', payload.new.connected_user_id)
            .single();

          setAmbientMeetingGuide(`Handshake Established. Found near the ${targetNode?.current_station || 'designated spot'}.`);
        }
      })
      .subscribe();

    return () => {
      clearInterval(intervalSync);
      supabase.removeChannel(handshakeListener);
    };
  }, [activeTab, userId]);

  useEffect(() => {
    if (isScanning && activeTab === 'room' && userId) {
      const nativeScanner = new Html5Qrcode("reader-engine");
      html5QrCodeRef.current = nativeScanner;
      nativeScanner.start(
        { facingMode: "environment" }, 
        { fps: 24, qrbox: (w, h) => ({ width: Math.floor(Math.min(w, h) * 0.75), height: Math.floor(Math.min(w, h) * 0.75) }) },
        async (decodedText) => {
          const cleanId = decodedText.split('||')[0];
          if (html5QrCodeRef.current) { await html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current = null; setIsScanning(false); }
          await supabase.from('vault_connections').insert({ user_id: userId, connected_user_id: cleanId, connection_method: 'scan', created_at: new Date().toISOString() });
          setActiveTab('vault');
          syncDatabaseFeeds();
        },
        () => {}
      ).catch(() => {});
    }
    return () => { if (html5QrCodeRef.current) { html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current = null; } };
  }, [isScanning, activeTab, userId]);

  const triggerDiscoveryHandshake = async (targetUserId: string) => {
    if (pendingSentCount >= 3) {
      setSystemAlert("Connection queue full. Wait for pending requests to resolve.");
      setTimeout(() => setSystemAlert(null), 4000);
      return;
    }
    await supabase.from('vault_connections').insert({ user_id: userId, connected_user_id: targetUserId, connection_method: 'discovery', handshake_accepted: false, created_at: new Date().toISOString() });
    syncDatabaseFeeds();
  };

  const acceptDiscoveryHandshake = async (requesterId: string) => {
    await supabase.from('vault_connections').update({ handshake_accepted: true }).eq('user_id', requesterId).eq('connected_user_id', userId);
    await supabase.from('vault_connections').insert({ user_id: userId, connected_user_id: requesterId, connection_method: 'discovery', handshake_accepted: true });

    const { data: theirNode } = await supabase.from('active_presence_nodes').select('current_station, name').eq('id', requesterId).single();

    setAmbientMeetingGuide(`Handshake Established. Found near the ${theirNode?.current_station || 'designated spot'}.`);
    syncDatabaseFeeds();
  };

  const declineDiscoveryHandshake = async (requesterId: string) => {
    await supabase.from('vault_connections').delete().eq('user_id', requesterId).eq('connected_user_id', userId);
    syncDatabaseFeeds();
  };

  const confirmVisibility = async () => {
    if (!fullName.trim() || !role.trim() || !domain.trim() || !currentIntent.trim() || !selectedStation.trim()) {
      setSystemAlert("Complete profile entries before broadcasting signal.");
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
  };

  // Extract dynamic single letter monogram initial safely
  const getInitial = () => {
    if (fullName.trim()) return fullName.trim().charAt(0).toUpperCase();
    return 'P'; 
  };

  return (
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#0A0605', color: '#FDFBF7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Ambient Messaging Channel */}
      <div style={{ position: 'fixed', top: '24px', left: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ambientMeetingGuide && (
          <div onClick={() => setAmbientMeetingGuide(null)} style={{ background: '#140D0C', border: '1px solid #E6A15C', borderRadius: '12px', padding: '16px', color: '#F5E6D3', fontSize: '13px', lineHeight: '1.4', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', cursor: 'pointer' }}>
            <div style={{ fontSize: '9px', color: '#E6A15C', letterSpacing: '1px', marginBottom: '4px', fontWeight: '600' }}>CONNECTION ASSISTANT</div>
            {ambientMeetingGuide}
          </div>
        )}
        {systemAlert && (
          <div style={{ background: '#1C1210', border: '1px solid rgba(230,161,92,0.15)', borderRadius: '12px', padding: '12px 16px', color: '#A68F81', fontSize: '12px', textAlign: 'center' }}>
            {systemAlert}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '32px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
        
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#8A7366', fontWeight: '600', letterSpacing: '1.5px' }}>PEOPLE NEARBY • QUEUE ({pendingSentCount}/3)</div>
              </div>
              <div onClick={async () => { if (isScanning && html5QrCodeRef.current) { await html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current = null; } setIsScanning(!isScanning); }} style={{ fontSize: '10px', color: '#E6A15C', border: '1px solid rgba(230,161,92,0.2)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                {isScanning ? 'CLOSE' : 'SCAN CARD'}
              </div>
            </div>

            {isScanning && (
              <div style={{ width: '100%', maxWidth: '340px', alignSelf: 'center', overflow: 'hidden', borderRadius: '24px', border: '1px solid rgba(230,161,92,0.15)', background: '#000' }}>
                <div id="reader-engine" style={{ width: '100%', minHeight: '260px' }}></div>
                <style>{` #reader-engine video { width: 100% !important; height: auto !important; min-height: 260px !important; object-fit: cover !important; display: block !important; border-radius: 24px !important; } #reader-engine { border: none !important; } `}</style>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roomUsers.map(user => (
                <div key={user.id} style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(20, 13, 12, 0.4)', border: '1px solid rgba(230, 161, 92, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, paddingRight: '12px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#F5E6D3' }}>{user.name} <span style={{ fontSize: '12px', color: '#8A7366', fontWeight: '300', marginLeft: '4px' }}>— {user.title}</span></div>
                    <div style={{ fontSize: '11px', color: '#E6A15C', marginTop: '6px' }}>"{user.intent}"</div>
                  </div>
                  <div onClick={() => triggerDiscoveryHandshake(user.id)} style={{ padding: '10px 14px', backgroundColor: '#E6A15C', color: '#140D0C', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>PING</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '2px', color: '#E6A15C', textTransform: 'uppercase', marginBottom: '12px' }}>Collected Network</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {vaultUsers.map((user, i) => (
                  <div key={i} style={{ backgroundColor: 'rgba(20, 13, 12, 0.4)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(230,161,92,0.05)' }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#FDFBF7' }}>{user.name || 'Anonymous Peer'}</div>
                    <div style={{ fontSize: '12px', color: '#D9C3B0', marginTop: '2px' }}>{user.title || 'Professional Context Established'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: '28px', alignItems: 'center' }}>
            {incomingHandshakes.map((req, idx) => (
              <div key={idx} style={{ width: '100%', maxWidth: '320px', backgroundColor: '#140D0C', border: '1px solid rgba(230, 161, 92, 0.25)', borderRadius: '16px', padding: '18px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '9px', fontWeight: '600', color: '#E6A15C', letterSpacing: '1.5px', marginBottom: '6px' }}>INCOMING CONNECTION REQUEST</div>
                <div style={{ fontSize: '13px', color: '#F5E6D3', marginBottom: '12px' }}><strong>{req.name}</strong> has matched your room signal. Connect?</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => acceptDiscoveryHandshake(req.user_id)} style={{ flex: 1, padding: '10px', background: '#E6A15C', color: '#0A0605', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>ACCEPT</button>
                  <button onClick={() => declineDiscoveryHandshake(req.user_id)} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', color: '#8A7366', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>BYPASS</button>
                </div>
              </div>
            ))}

            {/* High-End Obsidian Monogram Card Structure */}
            <div style={{ width: '100%', maxWidth: '340px', backgroundColor: '#130E0D', borderRadius: '24px', padding: '24px', boxSizing: 'border-box', display: 'flex', gap: '16px', position: 'relative', minHeight: '120px', border: '1px solid rgba(255,255,255,0.015)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              
              {/* Premium Circular Initial Monogram Avatar */}
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #1E1B4B 0%, #31102F 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '600', color: '#FDFBF7', flexShrink: 0, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)' }}>
                {getInitial()}
              </div>

              {/* Dynamic Information Content Pipeline */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingRight: '24px', paddingTop: '2px' }}>
                {isEditing ? (
                  /* Inline Boxless Minimal Inputs */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      style={{ width: '100%', background: 'transparent', border: 'none', padding: 0, color: '#F5E6D3', boxSizing: 'border-box', outline: 'none', fontSize: '18px', fontWeight: '600' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Product Architect" 
                      value={role} 
                      onChange={(e) => setRole(e.target.value)} 
                      style={{ width: '100%', background: 'transparent', border: 'none', padding: 0, color: '#A5B4FC', boxSizing: 'border-box', outline: 'none', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Nexus Labs" 
                      value={domain} 
                      onChange={(e) => setDomain(e.target.value)} 
                      style={{ width: '100%', background: 'transparent', border: 'none', padding: 0, color: '#8A7366', boxSizing: 'border-box', outline: 'none', fontSize: '13px', fontWeight: '400' }} 
                    />
                  </div>
                ) : (
                  /* Flawless Typographic Premium Presentation Layer */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: fullName ? '#FDFBF7' : '#3E2E2A' }}>
                      {fullName || 'Identity Unassigned'}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {role ? (
                        <div style={{ background: 'rgba(165, 180, 252, 0.08)', border: '1px solid rgba(165, 180, 252, 0.15)', borderRadius: '100px', padding: '4px 10px', fontSize: '9px', fontWeight: '700', color: '#A5B4FC', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          {role}
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#3E2E2A', textTransform: 'uppercase', letterSpacing: '1px' }}>Role Empty</div>
                      )}

                      <div style={{ fontSize: '13px', color: domain ? '#94A3B8' : '#3E2E2A', fontWeight: '400' }}>
                        {domain || 'Domain Empty'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Minimal Geometric Circular Pencil SVG Action Link */}
              <div 
                onClick={() => setIsEditing(!isEditing)} 
                style={{ position: 'absolute', top: '20px', right: '20px', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', background: isEditing ? 'rgba(230,161,92,0.1)' : 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isEditing ? "#E6A15C" : "#64748B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {isEditing ? (
                    <path d="M20 6L9 17l-5-5" /> 
                  ) : (
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  )}
                </svg>
              </div>

            </div>

            {isVisible ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '20px', background: 'rgba(20, 13, 12, 0.3)' }}>
                <img src={qrCodeUrl} alt="Dynamic Key" style={{ width: '130px', height: '130px', borderRadius: '12px' }} />
                <div style={{ fontSize: '8px', color: '#E6A15C', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '600' }}>Signal Broadcaster Engine Active</div>
              </div>
            ) : (
              <div style={{ padding: '0 20px', textAlign: 'center', color: '#4E3C36', fontSize: '11px', letterSpacing: '0.5px', fontStyle: 'italic', maxWidth: '280px', lineHeight: '1.5' }}>Engage the pencil component to set up your network anchor node.</div>
            )}
          </div>
        )}

      </div>

      {/* Persistent Base Interaction Layer */}
      <div style={{ background: 'linear-gradient(to top, #0A0605 85%, rgba(10, 6, 5, 0))', padding: '0 24px 30px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
        
        {/* Streamlined Pre-Live Interstitial Context Layer */}
        {showIntentModal && (
          <div style={{ backgroundColor: '#140D0C', border: '1px solid rgba(230, 161, 92, 0.15)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Current Focus Intent?" 
                value={currentIntent} 
                onChange={(e) => setCurrentUrlIntent(e.target.value)} 
                style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245, 230, 211, 0.08)', borderRadius: '10px', padding: '14px', color: '#F5E6D3', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }} 
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Private Landmark Station?" 
                value={selectedStation} 
                onChange={(e) => setSelectedStation(e.target.value)} 
                style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245, 230, 211, 0.08)', borderRadius: '10px', padding: '14px', color: '#F5E6D3', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <div onClick={confirmVisibility} style={{ flex: 1, backgroundColor: '#E6A15C', color: '#140D0C', padding: '14px', borderRadius: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', cursor: 'pointer', letterSpacing: '1px' }}>GO LIVE</div>
              <div onClick={() => setShowIntentModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', color: '#A68F81', padding: '14px', borderRadius: '10px', textAlign: 'center', fontSize: '12px', cursor: 'pointer' }}>CANCEL</div>
            </div>
          </div>
        )}

        {/* Ambient Broadcast Switch Node */}
        <div style={{ padding: '16px 20px', borderRadius: '20px', backgroundColor: 'rgba(20, 13, 12, 0.6)', border: '1px solid rgba(245, 230, 211, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '400', color: '#F5E6D3', letterSpacing: '0.3px' }}>Visible Broadcast Mode</div>
            {isVisible && <div style={{ fontSize: '10px', color: '#8A7366', marginTop: '3px' }}>Stationed at {selectedStation}</div>}
          </div>
          <div onClick={() => { if (!isVisible) { if (!fullName.trim() || !role.trim() || !domain.trim()) { setSystemAlert("Complete your profile card details first."); setTimeout(() => setSystemAlert(null), 3000); return; } setShowIntentModal(true); } else { setIsVisible(false); supabase.from('active_presence_nodes').delete().eq('id', userId); } }} style={{ width: '46px', height: '24px', backgroundColor: isVisible ? '#E6A15C' : '#1C1210', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '25px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.4)' }} />
          </div>
        </div>

        {/* Tab Selection Bar Switchboard */}
        <div style={{ height: '56px', backgroundColor: 'rgba(20, 13, 12, 0.95)', borderRadius: '20px', border: '1px solid rgba(245, 230, 211, 0.05)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backdropFilter: 'blur(30px)' }}>
          <div onClick={() => { setActiveTab('room'); setIsScanning(false); }} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'room' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px', fontWeight: activeTab === 'room' ? '600' : '400' }}>ROOM</div>
          <div onClick={() => { setActiveTab('vault'); setIsScanning(false); }} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'vault' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px', fontWeight: activeTab === 'vault' ? '600' : '400' }}>VAULT</div>
          <div onClick={() => { setActiveTab('presence'); setIsScanning(false); }} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'presence' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px', fontWeight: activeTab === 'presence' ? '600' : '400' }}>PRESENCE</div>
        </div>
      </div>

    </div>
  );
}
