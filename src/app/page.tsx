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
  connection_method?: 'scan' | 'discovery';
  tier_2_status?: 'locked' | 'pending' | 'approved' | 'declined';
  shared_channels?: { phone: boolean; linkedin: boolean };
}

export default function OreetiSovereignEngine() {
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('presence');
  const [isVisible, setIsVisible] = useState(false);
  const [systemStatus, setSystemStatus] = useState('System Active');
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [sessionAnchor] = useState('Nairobi Garage');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showLookUpAlert, setShowLookUpAlert] = useState(false);

  // Feeds
  const [roomUsers, setRoomUsers] = useState<Networker[]>([]);
  const [vaultUsers, setVaultUsers] = useState<Networker[]>([]);
  const [incomingHandshakes, setIncomingHandshakes] = useState<any[]>([]);
  
  const [dynamicQrToken, setDynamicQrToken] = useState('');

  const [profile] = useState({
    id: 'michy-production-node-99', 
    name: 'Michy',
    title: 'Principal Architecture Lead',
    domain: 'Digital Infrastructure & Spatial Design',
    phone: '+254 700 000000',
    linkedin: 'linkedin.com/in/michy'
  });

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Dynamic token generation loop
  useEffect(() => {
    const generateSecureToken = () => {
      const securitySalt = Math.random().toString(36).substring(2, 7);
      const timestamp = Date.now();
      setDynamicQrToken(`${profile.id}||${timestamp}||${securitySalt}`);
    };
    generateSecureToken();
    const tokenRotationInterval = setInterval(generateSecureToken, 45000);
    return () => clearInterval(tokenRotationInterval);
  }, [profile.id]);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(dynamicQrToken)}&color=e6a15c&bgcolor=0e0908`;

  // Real-time Room Syncing Engine
  useEffect(() => {
    if (!isVisible) {
      setRoomUsers([]);
      return;
    }

    const fetchActiveNodes = async () => {
      const { data } = await supabase
        .from('active_presence_nodes')
        .select('*')
        .eq('room_anchor', sessionAnchor)
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
      .select('connected_user_id, name, title, domain, connection_method, tier_2_status, shared_channels')
      .eq('user_id', profile.id);

    if (vaultData) setVaultUsers(vaultData as unknown as Networker[]);

    const { data: discoveryRequests } = await supabase
      .from('vault_connections')
      .select('user_id, name, title')
      .eq('connected_user_id', profile.id)
      .eq('connection_method', 'discovery')
      .eq('tier_2_status', 'locked');

    if (discoveryRequests) setIncomingHandshakes(discoveryRequests);
  };

  useEffect(() => {
    syncDatabaseFeeds();

    const handshakeListener = supabase
      .channel('handshake_alerts')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vault_connections' }, (payload: any) => {
        if (payload.new.user_id === profile.id && payload.new.connection_method === 'discovery' && payload.new.handshake_accepted === true) {
          setShowLookUpAlert(true);
          setTimeout(() => setShowLookUpAlert(false), 5000); // 5-second handshake countdown for visual tension
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(handshakeListener);
    };
  }, [activeTab, profile.id]);

  // Pro-Engine Native Camera Handler
  useEffect(() => {
    if (isScanning && activeTab === 'room') {
      // Build a clean instance linked to the naked element ID
      const nativeScanner = new Html5Qrcode("reader-engine");
      html5QrCodeRef.current = nativeScanner;

      nativeScanner.start(
        { facingMode: "environment" }, 
        {
          fps: 24,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxSize = Math.floor(minEdge * 0.7);
            return { width: boxSize, height: boxSize };
          }
        },
        async (decodedText) => {
          const cleanId = decodedText.split('||')[0];
          
          // Terminate lens completely immediately on validation
          if (html5QrCodeRef.current) {
            await html5QrCodeRef.current.stop().catch(() => {});
            html5QrCodeRef.current = null;
            setIsScanning(false);
          }

          await supabase.from('vault_connections').insert({
            user_id: profile.id,
            connected_user_id: cleanId,
            connection_method: 'scan',
            tier_2_status: 'locked',
            shared_channels: { phone: false, linkedin: false },
            created_at: new Date().toISOString()
          });

          setActiveTab('vault');
          syncDatabaseFeeds();
        },
        () => {} // Silent catch framework for background cycles
      ).catch(() => {
        setSystemStatus('Camera hardware request rejected.');
      });
    }

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  }, [isScanning, activeTab]);

  const triggerDiscoveryHandshake = async (targetUserId: string) => {
    setSystemStatus('Handshake broadcasted...');
    await supabase.from('vault_connections').insert({
      user_id: profile.id,
      connected_user_id: targetUserId,
      connection_method: 'discovery',
      tier_2_status: 'locked',
      handshake_accepted: false,
      created_at: new Date().toISOString()
    });
  };

  const acceptDiscoveryHandshake = async (requesterId: string) => {
    await supabase
      .from('vault_connections')
      .update({ handshake_accepted: true })
      .eq('user_id', requesterId)
      .eq('connected_user_id', profile.id);
    
    await supabase.from('vault_connections').insert({
      user_id: profile.id,
      connected_user_id: requesterId,
      connection_method: 'discovery',
      tier_2_status: 'locked',
      handshake_accepted: true
    });

    syncDatabaseFeeds();
  };

  const declineDiscoveryHandshake = async (requesterId: string) => {
    await supabase.from('vault_connections').delete().eq('user_id', requesterId).eq('connected_user_id', profile.id);
    syncDatabaseFeeds();
  };

  const handleToggleAction = () => {
    if (!isVisible) {
      setShowIntentModal(true);
    } else {
      executeNodeTeardown();
    }
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
      room_anchor: sessionAnchor,
      last_seen: new Date().toISOString()
    });
  };

  const executeNodeTeardown = async () => {
    setIsVisible(false);
    await supabase.from('active_presence_nodes').delete().eq('id', profile.id);
  };

  return (
    <div style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#0A0605', color: '#FDFBF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      
      {showLookUpAlert && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10,6,5,0.98)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#E6A15C', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px' }}>Handshake Verified</div>
          <div style={{ fontSize: '28px', fontWeight: '300', color: '#F5E6D3', letterSpacing: '-0.5px', maxWidth: '280px', lineHeight: '1.3' }}>Look up and meet inside the room.</div>
        </div>
      )}

      <div style={{ flex: 1, padding: '32px 24px 0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
        
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '2px', color: '#D9C3B0', textTransform: 'uppercase' }}>{sessionAnchor}</div>
                <div style={{ fontSize: '11px', color: '#4E3C36', marginTop: '2px' }}>People Nearby</div>
              </div>
              <div onClick={async () => {
                if (isScanning && html5QrCodeRef.current) {
                  await html5QrCodeRef.current.stop().catch(() => {});
                  html5QrCodeRef.current = null;
                }
                setIsScanning(!isScanning);
              }} style={{ fontSize: '10px', color: '#E6A15C', border: '1px solid rgba(230,161,92,0.2)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', background: isScanning ? 'rgba(230,161,92,0.1)' : 'transparent' }}>
                {isScanning ? 'CLOSE' : 'SCAN CARD'}
              </div>
            </div>

            {isScanning && (
              <div style={{ width: '100%', maxWidth: '340px', alignSelf: 'center', overflow: 'hidden', borderRadius: '24px', border: '1px solid rgba(230,161,92,0.15)', background: '#000', position: 'relative' }}>
                {/* Naked Element target Container */}
                <div id="reader-engine" style={{ width: '100%', minHeight: '260px' }}></div>
                {/* Clean Injection Overrides */}
                <style>{`
                  #reader-engine video { width: 100% !important; height: auto !important; min-height: 260px !important; object-fit: cover !important; display: block !important; border-radius: 24px !important; }
                  #reader-engine { border: none !important; }
                `}</style>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roomUsers.map(user => (
                <div key={user.id} style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(20, 13, 12, 0.4)', border: '1px solid rgba(230, 161, 92, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#F5E6D3' }}>{user.name} <span style={{ fontSize: '12px', color: '#8A7366', fontWeight: '300', marginLeft: '4px' }}>— {user.title}</span></div>
                    <div style={{ fontSize: '11px', color: '#E6A15C', marginTop: '6px' }}>"{user.intent}"</div>
                  </div>
                  <div onClick={() => triggerDiscoveryHandshake(user.id)} style={{ padding: '8px 12px', backgroundColor: '#E6A15C', color: '#140D0C', borderRadius: '8px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>CONNECT</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '2px', color: '#E6A15C', textTransform: 'uppercase', marginBottom: '12px' }}>Scanned Cards (Face-to-Face)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {vaultUsers.filter(u => u.connection_method === 'scan').map((user, i) => (
                  <div key={i} style={{ backgroundColor: 'rgba(20, 13, 12, 0.4)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(230,161,92,0.05)' }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#FDFBF7' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#D9C3B0', marginTop: '2px' }}>{user.title}</div>
                    <div style={{ fontSize: '11px', color: '#8A7366', marginTop: '4px' }}>{user.domain}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '2px', color: '#8A7366', textTransform: 'uppercase', marginBottom: '12px' }}>Room Discoveries (Nearby)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {vaultUsers.filter(u => u.connection_method === 'discovery').map((user, i) => (
                  <div key={i} style={{ backgroundColor: 'rgba(20, 13, 12, 0.25)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(245,230,211,0.02)' }}>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#D9C3B0' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#8A7366', marginTop: '2px' }}>{user.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: '24px', alignItems: 'center' }}>
            {incomingHandshakes.length > 0 && (
              <div style={{ width: '100%', maxWidth: '320px', backgroundColor: '#140D0C', border: '1px solid rgba(230,161,92,0.25)', borderRadius: '16px', padding: '18px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '9px', fontWeight: '600', color: '#E6A15C', letterSpacing: '1.5px', marginBottom: '8px' }}>INCOMING DIGITAL HANDSHAKE</div>
                {incomingHandshakes.map((req, idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: '13px', color: '#F5E6D3', marginBottom: '12px', lineHeight: '1.4' }}><strong>{req.name}</strong> has spotted you in the room. Accept connection?</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => acceptDiscoveryHandshake(req.user_id)} style={{ flex: 1, padding: '10px', background: '#E6A15C', color: '#0A0605', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>ACCEPT</button>
                      <button onClick={() => declineDiscoveryHandshake(req.user_id)} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', color: '#8A7366', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>BYPASS</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ width: '100%', maxWidth: '320px', backgroundColor: 'rgba(14, 9, 8, 0.95)', borderRadius: '16px', padding: '28px 24px', border: '1px solid rgba(245, 230, 211, 0.035)', position: 'relative', boxSizing: 'border-box' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '300', color: '#F5E6D3' }}>{profile.name}</div>
                <div style={{ fontSize: '13px', color: '#E6A15C', marginTop: '4px' }}>{profile.title}</div>
              </div>
              <div style={{ fontSize: '11px', color: '#8A7366', lineHeight: '1.5', borderTop: '1px solid rgba(245, 230, 211, 0.03)', paddingTop: '12px', marginTop: '16px' }}>{profile.domain}</div>
            </div>

            {isVisible ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: '16px', background: 'rgba(14, 9, 8, 0.4)' }}>
                <img src={qrCodeUrl} alt="Dynamic Key" style={{ width: '140px', height: '140px', borderRadius: '8px' }} />
                <div style={{ fontSize: '8px', color: '#8A7366', letterSpacing: '1px', textTransform: 'uppercase' }}>Dynamic Security Token Rotation Active</div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#4E3C36', fontSize: '11px', fontStyle: 'italic', maxWidth: '260px' }}>Your secure scan card code is offline. Flip the broadcast switch below to activate your presence.</div>
            )}
          </div>
        )}

      </div>

      {/* 40% Ergonomic Interactive Thumb Zone Base */}
      <div style={{ background: 'linear-gradient(to top, #0A0605 80%, rgba(10, 6, 5, 0))', padding: '0 24px 30px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
        {showIntentModal && (
          <div style={{ backgroundColor: '#140D10', border: '1px solid rgba(245, 230, 211, 0.1)', borderRadius: '16px', padding: '16px' }}>
            <input type="text" placeholder="What are you looking for right now?" value={currentIntent} onChange={(e) => setCurrentUrlIntent(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(245, 230, 211, 0.08)', borderRadius: '8px', padding: '10px', color: '#F5E6D3', marginBottom: '10px', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div onClick={confirmVisibility} style={{ flex: 1, backgroundColor: '#E6A15C', color: '#140D0C', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>GO LIVE</div>
              <div onClick={() => setShowIntentModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', color: '#A68F81', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '11px', cursor: 'pointer' }}>CANCEL</div>
            </div>
          </div>
        )}

        <div style={{ padding: '14px 18px', borderRadius: '16px', backgroundColor: 'rgba(20, 13, 12, 0.45)', border: '1px solid rgba(245, 230, 211, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#F5E6D3' }}>Visible Broadcast Mode</div>
          <div onClick={handleToggleAction} style={{ width: '44px', height: '24px', backgroundColor: isVisible ? '#E6A15C' : '#1C1210', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '23px' : '3px', transition: 'left 0.2s' }} />
          </div>
        </div>

        <div style={{ height: '56px', backgroundColor: 'rgba(20, 13, 12, 0.85)', borderRadius: '20px', border: '1px solid rgba(245, 230, 211, 0.05)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backdropFilter: 'blur(30px)' }}>
          <div onClick={async () => {
            if (html5QrCodeRef.current) { await html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current = null; }
            setActiveTab('room'); 
            setIsScanning(false); 
          }} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'room' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>ROOM</div>
          
          <div onClick={async () => { 
            if (html5QrCodeRef.current) { await html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current = null; }
            setActiveTab('vault'); 
            setIsScanning(false); 
          }} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'vault' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>VAULT</div>
          
          <div onClick={async () => { 
            if (html5QrCodeRef.current) { await html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current = null; }
            setActiveTab('presence'); 
            setIsScanning(false); 
          }} style={{ fontSize: '10px', letterSpacing: '1.5px', color: activeTab === 'presence' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '14px' }}>PRESENCE</div>
        </div>
      </div>

    </div>
  );
}
