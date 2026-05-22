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
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [selectedStation, setSelectedStation] = useState('Main Bar');
  const [sessionAnchor] = useState('Nairobi Garage');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Ambient notification states (Replaced intense fullscreen modals)
  const [ambientMeetingGuide, setAmbientMeetingGuide] = useState<string | null>(null);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  // Feeds
  const [roomUsers, setRoomUsers] = useState<Networker[]>([]);
  const [vaultUsers, setVaultUsers] = useState<any[]>([]);
  const [incomingHandshakes, setIncomingHandshakes] = useState<any[]>([]);
  const [pendingSentCount, setPendingSentCount] = useState(0);
  
  const [dynamicQrToken, setDynamicQrToken] = useState('');
  const [profile] = useState({
    id: 'michy-production-node-99', 
    name: 'Michy',
    title: 'Principal Architecture Lead',
    domain: 'Digital Infrastructure & Spatial Design',
  });

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Security rotation
  useEffect(() => {
    const generateSecureToken = () => {
      setDynamicQrToken(`${profile.id}||${Date.now()}||${Math.random().toString(36).substring(2, 7)}`);
    };
    generateSecureToken();
    const tokenRotationInterval = setInterval(generateSecureToken, 45000);
    return () => clearInterval(tokenRotationInterval);
  }, [profile.id]);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(dynamicQrToken)}&color=e6a15c&bgcolor=0e0908`;

  // Heartbeat signal to prove the node is still physically in the room
  useEffect(() => {
    if (!isVisible) return;
    const heartbeat = setInterval(async () => {
      await supabase
        .from('active_presence_nodes')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', profile.id);
    }, 15000); // Heartbeat ping every 15 seconds
    return () => clearInterval(heartbeat);
  }, [isVisible, profile.id]);

  // Real-time Room Syncing Engine
  useEffect(() => {
    if (!isVisible) {
      setRoomUsers([]);
      return;
    }

    const fetchActiveNodes = async () => {
      // Fetch nodes seen within the last 30 minutes (removes dead nodes automatically)
      const halfHourAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('active_presence_nodes')
        .select('*')
        .eq('room_anchor', sessionAnchor)
        .gt('last_seen', halfHourAgo)
        .not('id', 'eq', profile.id);

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
  }, [isVisible, sessionAnchor, profile.id]);

  const syncDatabaseFeeds = async () => {
    const { data: vaultData } = await supabase
      .from('vault_connections')
      .select('connected_user_id, name, title, domain, connection_method')
      .eq('user_id', profile.id);

    if (vaultData) setVaultUsers(vaultData);

    // Fetch incoming handshakes that are less than 3 minutes old
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const { data: discoveryRequests } = await supabase
      .from('vault_connections')
      .select('user_id, name, title, current_station')
      .eq('connected_user_id', profile.id)
      .eq('connection_method', 'discovery')
      .eq('handshake_accepted', false)
      .gt('created_at', threeMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(2); // Layout ceiling protection

    if (discoveryRequests) setIncomingHandshakes(discoveryRequests);

    // Track how many pings this user currently has open
    const { count } = await supabase
      .from('vault_connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('handshake_accepted', false)
      .gt('created_at', threeMinutesAgo);
    
    setPendingSentCount(count || 0);
  };

  useEffect(() => {
    syncDatabaseFeeds();
    const intervalSync = setInterval(syncDatabaseFeeds, 10000); // Auto-clear expired items every 10 seconds

    const handshakeListener = supabase
      .channel('handshake_alerts')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vault_connections' }, async (payload: any) => {
        if (payload.new.user_id === profile.id && payload.new.connection_method === 'discovery' && payload.new.handshake_accepted === true) {
          const { data: targetNode } = await supabase
            .from('active_presence_nodes')
            .select('current_station, name')
            .eq('id', payload.new.connected_user_id)
            .single();

          setAmbientMeetingGuide(`Connected with ${targetNode?.name || 'them'}. They are located near the ${targetNode?.current_station || 'Main Bar'}.`);
        }
      })
      .subscribe();

    return () => {
      clearInterval(intervalSync);
      supabase.removeChannel(handshakeListener);
    };
  }, [activeTab, profile.id]);

  // Scanner Engine Hook
  useEffect(() => {
    if (isScanning && activeTab === 'room') {
      const nativeScanner = new Html5Qrcode("reader-engine");
      html5QrCodeRef.current = nativeScanner;

      nativeScanner.start(
        { facingMode: "environment" }, 
        { fps: 24, qrbox: (w, h) => ({ width: Math.floor(Math.min(w, h) * 0.75), height: Math.floor(Math.min(w, h) * 0.75) }) },
        async (decodedText) => {
          const cleanId = decodedText.split('||')[0];
          if (html5QrCodeRef.current) { await html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current = null; setIsScanning(false); }
          await supabase.from('vault_connections').insert({ user_id: profile.id, connected_user_id: cleanId, connection_method: 'scan', created_at: new Date().toISOString() });
          setActiveTab('vault');
          syncDatabaseFeeds();
        },
        () => {}
      ).catch(() => {});
    }
    return () => { if (html5QrCodeRef.current) { html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current = null; } };
  }, [isScanning, activeTab]);

  const triggerDiscoveryHandshake = async (targetUserId: string) => {
    if (pendingSentCount >= 3) {
      setSystemAlert("Connection queue full. Wait for pending requests to resolve.");
      setTimeout(() => setSystemAlert(null), 4000);
      return;
    }

    await supabase.from('vault_connections').insert({
      user_id: profile.id,
      connected_user_id: targetUserId,
      connection_method: 'discovery',
      handshake_accepted: false,
      created_at: new Date().toISOString()
    });
    syncDatabaseFeeds();
  };

  const acceptDiscoveryHandshake = async (requesterId: string) => {
    const { data: myNode } = await supabase.from('active_presence_nodes').select('current_station').eq('id', profile.id).single();
    
    await supabase.from('vault_connections').update({ handshake_accepted: true }).eq('user_id', requesterId).eq('connected_user_id', profile.id);
    await supabase.from('vault_connections').insert({ user_id: profile.id, connected_user_id: requesterId, connection_method: 'discovery', handshake_accepted: true });

    setAmbientMeetingGuide(`Handshake accepted. You can find them near the ${myNode?.current_station || selectedStation}.`);
    syncDatabaseFeeds();
  };

  const declineDiscoveryHandshake = async (requesterId: string) => {
    await supabase.from('vault_connections').delete().eq('user_id', requesterId).eq('connected_user_id', profile.id);
    syncDatabaseFeeds();
  };

  const confirmVisibility = async () => {
    if (!currentIntent.trim()) return;
    setShowIntentModal(false);
    setIsVisible(true);

    await supabase.from('active_presence_nodes').upsert({
      id: profile.id,
      name: profile.name,
      title: profile.title,
      domain: profile.domain,
      intent: currentIntent,
      current_station: selectedStation,
      room_anchor: sessionAnchor,
      last_seen: new Date().toISOString()
    });
  };

  return (
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#0A0605', color: '#FDFBF7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Soft Notifications Overlay System */}
      <div style={{ position: 'fixed', top: '24px', left: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ambientMeetingGuide && (
          <div onClick={() => setAmbientMeetingGuide(null)} style={{ background: '#140D0C', border: '1px solid #E6A15C', borderRadius: '12px', padding: '16px', color: '#F5E6D3', fontSize: '13px', lineHeight: '1.4', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', cursor: 'pointer' }}>
            <div style={{ fontSize: '9px', color: '#E6A15C', letterSpacing: '1px', marginBottom: '4px', fontWeight: '600' }}>CONNECTION ASSISTANT</div>
            {ambientMeetingGuide}
            <div style={{ fontSize: '9px', color: '#8A7366', marginTop: '6px' }}>Tap card to dismiss</div>
          </div>
        )}
        {systemAlert && (
          <div style={{ background: '#1C1210', border: '1px solid rgba(230,161,92,0.15)', borderRadius: '12px', padding: '12px 16px', color: '#A68F81', fontSize: '12px' }}>
            {systemAlert}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '32px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
        
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '2px', color: '#D9C3B0', textTransform: 'uppercase' }}>{sessionAnchor}</div>
                <div style={{ fontSize: '11px', color: '#4E3C36', marginTop: '2px' }}>People Nearby • Queue ({pendingSentCount}/3)</div>
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
                    {user.current_station && <span style={{ fontSize: '9px', background: 'rgba(230,161,92,0.08)', color: '#E6A15C', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '8px', fontWeight: '600' }}>📍 {user.current_station.toUpperCase()}</span>}
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
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: '24px', alignItems: 'center' }}>
            {incomingHandshakes.map((req, idx) => (
              <div key={idx} style={{ width: '100%', maxWidth: '320px', backgroundColor: '#140D0C', border: '1px solid rgba(230,161,92,0.25)', borderRadius: '16px', padding: '18px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '9px', fontWeight: '600', color: '#E6A15C', letterSpacing: '1.5px', marginBottom: '6px' }}>INCOMING CONNECTION REQUEST</div>
                <div style={{ fontSize: '13px', color: '#F5E6D3', marginBottom: '12px' }}><strong>{req.name}</strong> has matched your room signal. Connect?</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => acceptDiscoveryHandshake(req.user_id)} style={{ flex: 1, padding: '10px', background: '#E6A15C', color: '#0A0605', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>ACCEPT</button>
                  <button onClick={() => declineDiscoveryHandshake(req.user_id)} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', color: '#8A7366', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>BYPASS</button>
                </div>
              </div>
            ))}

            <div style={{ width: '100%', maxWidth: '320px', backgroundColor: 'rgba(14, 9, 8, 0.95)', borderRadius: '16px', padding: '28px 24px', border: '1px solid rgba(245, 230, 211, 0.035)', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '22px', fontWeight: '300', color: '#F5E6D3' }}>{profile.name}</div>
              <div style={{ fontSize: '13px', color: '#E6A15C', marginTop: '4px' }}>{profile.title}</div>
              <div style={{ fontSize: '11px', color: '#8A7366', lineHeight: '1.5', borderTop: '1px solid rgba(245, 230, 211, 0.03)', paddingTop: '12px', marginTop: '16px' }}>{profile.domain}</div>
            </div>

            {isVisible ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: '16px', background: 'rgba(14, 9, 8, 0.4)' }}>
                <img src={qrCodeUrl} alt="Dynamic Key" style={{ width: '140px', height: '140px', borderRadius: '8px' }} />
                <div style={{ fontSize: '8px', color: '#8A7366', letterSpacing: '1px', textTransform: 'uppercase' }}>Dynamic Security Token Active</div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#4E3C36', fontSize: '11px', fontStyle: 'italic', maxWidth: '260px' }}>Your secure scan card code is offline. Flip the broadcast switch below to activate your presence.</div>
            )}
          </div>
        )}

      </div>

      <div style={{ background: 'linear-gradient(to top, #0A0605 80%, rgba(10, 6, 5, 0))', padding: '0 24px 30px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
        
        {showIntentModal && (
          <div style={{ backgroundColor: '#140D10', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '10px', color: '#8A7366', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>1. Current Focus</div>
            <input type="text" placeholder="What are you looking for right now?" value={currentIntent} onChange={(e) => setCurrentUrlIntent(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245, 230, 211, 0.08)', borderRadius: '8px', padding: '10px', color: '#F5E6D3', marginBottom: '14px', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }} />
            
            <div style={{ fontSize: '10px', color: '#8A7366', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>2. Station Landmark</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {['Main Bar', 'Stage Front', 'Lounge Area', 'Media Wall'].map((station) => (
                <div key={station} onClick={() => setSelectedStation(station)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: selectedStation === station ? '#E6A15C' : 'rgba(245,230,211,0.05)', background: selectedStation === station ? 'rgba(230,161,92,0.08)' : '#0A0605', color: selectedStation === station ? '#E6A15C' : '#8A7366', fontSize: '11px', textAlign: 'center', cursor: 'pointer' }}>
                  {station}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div onClick={confirmVisibility} style={{ flex: 1, backgroundColor: '#E6A15C', color: '#140D0C', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>GO LIVE</div>
              <div onClick={() => setShowIntentModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', color: '#A68F81', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', cursor: 'pointer' }}>CANCEL</div>
            </div>
          </div>
        )}

        <div style={{ padding: '14px 18px', borderRadius: '16px', backgroundColor: 'rgba(20, 13, 12, 0.45)', border: '1px solid rgba(245, 230, 211, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#F5E6D3' }}>Visible Broadcast Mode</div>
            {isVisible && <div style={{ fontSize: '10px', color: '#8A7366', marginTop: '2px' }}>Stationed at {selectedStation}</div>}
          </div>
          <div onClick={() => { if (!isVisible) { setShowIntentModal(true); } else { setIsVisible(false); supabase.from('active_presence_nodes').delete().eq('id', profile.id); } }} style={{ width: '44px', height: '24px', backgroundColor: isVisible ? '#E6A15C' : '#1C1210', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '23px' : '3px', transition: 'left 0.2s' }} />
          </div>
        </div>

        <div style={{ height: '56px', backgroundColor: 'rgba(20, 13, 12, 0.85)', borderRadius: '20px', border: '1px solid rgba(245, 230, 211, 0.05)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backdropFilter: 'blur(30px)' }}>
          <div onClick={() => { setActiveTab('room'); setIsScanning(false); }} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'room' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>ROOM</div>
          <div onClick={() => { setActiveTab('vault'); setIsScanning(false); }} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'vault' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>VAULT</div>
          <div onClick={() => { setActiveTab('presence'); setIsScanning(false); }} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'presence' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>PRESENCE</div>
        </div>
      </div>

    </div>
  );
}
