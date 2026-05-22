'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode } from 'html5-qrcode';
import { Analytics } from '@vercel/analytics/react';

const SUPABASE_URL = 'https://ikhkpdfgjqqbvkyvfgrw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlraGtwZGZnanFxYnZreXZmZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjE1NzMsImV4cCI6MjA5NDg5NzU3M30.RWBlgX-xH9aYTNBjwrRNeeogpoIvkSRXh08gIDSjb4U';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Networker {
  id: string;
  name: string;
  title: string;
  domain: string;
  intent: string;
  current_station?: string;
  phone?: string;
  linkedin?: string;
}

export default function OreetiAmbientEngine() {
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('presence');
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [showSecureInputs, setShowSecureInputs] = useState(false);
  const [showTier2Options, setShowTier2Options] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [domain, setDomain] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userLinkedin, setUserLinkedin] = useState('');
  
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const [roomUsers, setRoomUsers] = useState<Networker[]>([]);
  const [vaultUsers, setVaultUsers] = useState<any[]>([]);
  const [incomingHandshakes, setIncomingHandshakes] = useState<any[]>([]);
  const [incomingTier2Requests, setIncomingTier2Requests] = useState<any[]>([]);

  // Spam mitigation tracking state (stores target user IDs that are currently locked)
  const [throttledConnections, setThrottledConnections] = useState<Record<string, boolean>>({});

  const [selectedVaultItem, setSelectedVaultItem] = useState<any | null>(null);
  const [reqPhoneCheckbox, setReqPhoneCheckbox] = useState(false);
  const [reqLinkedinCheckbox, setReqLinkedinCheckbox] = useState(false);

  const [userId, setUserId] = useState<string>('');
  const [dynamicQrToken, setDynamicQrToken] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const existingId = localStorage.getItem('presence_peer_id');
    if (existingId) {
      setUserId(existingId);
    } else {
      const newId = `node-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('presence_peer_id', newId);
      setUserId(newId);
    }
    setFullName(localStorage.getItem('p_name') || '');
    setRole(localStorage.getItem('p_role') || '');
    setDomain(localStorage.getItem('p_domain') || '');
    setUserPhone(localStorage.getItem('p_phone') || '');
    setUserLinkedin(localStorage.getItem('p_link') || '');
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

  const fetchActiveNodes = async () => {
    if (!userId) return;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data } = await supabase
      .from('active_presence_nodes')
      .select('id, name, title, domain, intent, current_station, phone, linkedin')
      .gt('last_seen', oneHourAgo)
      .not('id', 'eq', userId);

    if (data) setRoomUsers(data as Networker[]);
  };

  useEffect(() => {
    if (!isVisible || !userId) {
      setRoomUsers([]);
      return;
    }
    fetchActiveNodes();
    const intervalSync = setInterval(fetchActiveNodes, 4000);
    return () => clearInterval(intervalSync);
  }, [isVisible, userId]);

  const syncDatabaseFeeds = async () => {
    if (!userId) return;
    
    // 1. Fetch authenticated vault connections (No self listings)
    const { data: vaultData } = await supabase
      .from('vault_connections')
      .select('*')
      .eq('user_id', userId)
      .not('connected_user_id', 'eq', userId);
    if (vaultData) setVaultUsers(vaultData);

    // 2. Fetch pending discovery handshakes
    const { data: discoveryRequests } = await supabase
      .from('vault_connections')
      .select('*')
      .eq('connected_user_id', userId)
      .eq('handshake_accepted', false)
      .eq('qr_scanned', false);
    
    if (discoveryRequests) {
      // 3-Minute Self-Destruct Filter Engine
      const activeValidRequests = discoveryRequests.filter(req => {
        const createdTime = new Date(req.created_at || Date.now()).getTime();
        const absoluteAgeInSeconds = (Date.now() - createdTime) / 1000;
        return absoluteAgeInSeconds < 180; // Only retain if under 3 minutes old
      });
      setIncomingHandshakes(activeValidRequests);
    }

    // 3. Fetch Tier-2 access requests
    const { data: t2Requests } = await supabase
      .from('vault_connections')
      .select('*')
      .eq('connected_user_id', userId)
      .eq('tier2_request_pending', true);
    if (t2Requests) setIncomingTier2Requests(t2Requests);

    if (selectedVaultItem) {
      const liveItem = vaultData?.find(v => v.id === selectedVaultItem.id);
      if (liveItem) setSelectedVaultItem(liveItem);
    }
  };

  // Immediate Real-Time Postgres Event Broker
  useEffect(() => {
    if (!userId) return;

    syncDatabaseFeeds();

    const absolutePresenceSubscription = supabase
      .channel('realtime_aura_handshakes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vault_connections' },
        () => {
          syncDatabaseFeeds();
        }
      )
      .subscribe();

    // Secondary countdown clock execution to clear expired requests in real-time
    const lifespanCheckClock = setInterval(syncDatabaseFeeds, 5000);

    return () => {
      supabase.removeChannel(absolutePresenceSubscription);
      clearInterval(lifespanCheckClock);
    };
  }, [userId, selectedVaultItem]);

  const triggerDiscoveryHandshake = async (targetUser: Networker) => {
    if (targetUser.id === userId) return;
    
    // Spam Prevention Check
    if (throttledConnections[targetUser.id]) {
      setSystemAlert("Connection throttle active. Please wait.");
      setTimeout(() => setSystemAlert(null), 3000);
      return;
    }

    // Activate structural anti-spam lock for this peer ID
    setThrottledConnections(prev => ({ ...prev, [targetUser.id]: true }));
    setRoomUsers(prev => prev.filter(u => u.id !== targetUser.id));

    await supabase.from('vault_connections').insert({ 
      user_id: userId, 
      connected_user_id: targetUser.id, 
      name: fullName || 'Network Peer',
      title: role || 'Member',
      domain: domain || '',
      phone: userPhone || '',
      linkedin: userLinkedin || '',
      handshake_accepted: false,
      qr_scanned: false,
      current_station: selectedStation || 'Main Lounge'
    });
    
    setSystemAlert(`Handshake requested with ${targetUser.name.split(' ')[0]}`);
    setTimeout(() => setSystemAlert(null), 3000);

    // Release spam lock after 10 seconds to allow retry if naturally necessary
    setTimeout(() => {
      setThrottledConnections(prev => ({ ...prev, [targetUser.id]: false }));
    }, 10000);
  };

  const acceptDiscoveryHandshake = async (request: any) => {
    setIncomingHandshakes(prev => prev.filter(h => h.id !== request.id));

    await supabase.from('vault_connections')
      .update({ handshake_accepted: true })
      .eq('id', request.id);

    await supabase.from('vault_connections').insert({ 
      user_id: userId, 
      connected_user_id: request.user_id, 
      name: request.name,
      title: request.title || 'Network Member',
      domain: request.domain || '',
      phone: request.phone || '',
      linkedin: request.linkedin || '',
      handshake_accepted: true,
      qr_scanned: false,
      current_station: request.current_station
    });

    setSystemAlert("Handshake accepted mutually.");
    setTimeout(() => setSystemAlert(null), 3000);
    setActiveTab('vault'); // Auto-focus Vault view when accepted
  };

  const declineDiscoveryHandshake = async (reqId: number) => {
    setIncomingHandshakes(prev => prev.filter(h => h.id !== reqId));
    await supabase.from('vault_connections').delete().eq('id', reqId);
    setSystemAlert("Handshake bypassed.");
    setTimeout(() => setSystemAlert(null), 2000);
  };

  const startQrScanner = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("room-scanner-viewport");
        html5QrCodeRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            const parts = decodedText.split('||');
            if (parts.length >= 1) {
              const scannedId = parts[0];
              
              if (html5QrCodeRef.current) {
                await html5QrCodeRef.current.stop().catch(()=>{});
                html5QrCodeRef.current = null;
              }
              setIsScanning(false);

              const { data: targetNode } = await supabase
                .from('active_presence_nodes')
                .select('*')
                .eq('id', scannedId)
                .single();

              if (targetNode) {
                await supabase.from('vault_connections').upsert({
                  user_id: userId,
                  connected_user_id: targetNode.id,
                  name: targetNode.name,
                  title: targetNode.title,
                  domain: targetNode.domain,
                  phone: targetNode.phone,
                  linkedin: targetNode.linkedin,
                  handshake_accepted: true,
                  qr_scanned: true
                });

                await supabase.from('vault_connections').upsert({
                  user_id: targetNode.id,
                  connected_user_id: userId,
                  name: fullName || 'Network Peer',
                  title: role || 'Member',
                  domain: domain || '',
                  phone: userPhone || '',
                  linkedin: userLinkedin || '',
                  handshake_accepted: true,
                  qr_scanned: true
                });

                setSystemAlert("Mutual Physical Connection Established.");
                setTimeout(() => setSystemAlert(null), 3000);
                setActiveTab('vault');
              }
            }
          },
          () => {}
        );
      } catch (err) {
        setIsScanning(false);
      }
    }, 150);
  };

  const stopQrScanner = async () => {
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop().catch(()=>{});
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  const submitTier2Request = async () => {
    if (!selectedVaultItem) return;
    
    await supabase.from('vault_connections')
      .update({
        tier2_request_pending: true,
        requested_phone: reqPhoneCheckbox,
        requested_linkedin: reqLinkedinCheckbox
      })
      .eq('user_id', userId)
      .eq('connected_user_id', selectedVaultItem.connected_user_id);

    setSystemAlert("Tier-2 Access request broadcasted.");
    setTimeout(() => setSystemAlert(null), 3000);
    setShowTier2Options(false);
    setSelectedVaultItem(null);
  };

  const resolveTier2Request = async (request: any, approvePhone: boolean, approveLinkedin: boolean) => {
    setIncomingTier2Requests(prev => prev.filter(r => r.id !== request.id));

    await supabase.from('vault_connections')
      .update({
        tier2_request_pending: false,
        shared_phone: approvePhone,
        shared_linkedin: approveLinkedin
      })
      .eq('user_id', request.user_id)
      .eq('connected_user_id', userId);

    setSystemAlert("Sovereign permission resolved.");
    setTimeout(() => setSystemAlert(null), 3000);
  };

  const saveProfileLocal = () => {
    localStorage.setItem('p_name', fullName);
    localStorage.setItem('p_role', role);
    localStorage.setItem('p_domain', domain);
    localStorage.setItem('p_phone', userPhone);
    localStorage.setItem('p_link', userLinkedin);
    setIsEditing(false);
  };

  const confirmVisibility = async () => {
    if (!fullName.trim() || !role.trim() || !domain.trim() || !currentIntent.trim() || !selectedStation.trim()) {
      setSystemAlert("Complete fields prior to emitting.");
      setTimeout(() => setSystemAlert(null), 3000);
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
      phone: userPhone,
      linkedin: userLinkedin,
      room_anchor: 'global_unfiltered_presence',
      last_seen: new Date().toISOString()
    });
    
    setTimeout(fetchActiveNodes, 300);
  };

  const isCardEmpty = !fullName.trim() && !role.trim() && !domain.trim();

  return (
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#0A0605', color: '#FDFBF7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box', position: 'relative' }}>
      
      <Analytics />

      {/* --- GLOBAL TAKEOVER OVERLAY SCREEN LAYER --- */}
      {incomingHandshakes.length > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(10, 6, 5, 0.96)', zIndex: 99999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', boxSizing: 'border-box', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '100%', maxWidth: '360px', backgroundColor: '#140D0C', border: '1px solid #E6A15C', borderRadius: '28px', padding: '40px 32px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '9px', color: '#E6A15C', letterSpacing: '2px', fontWeight: '600' }}>INCOMING HANDSHAKE CONNECTION</span>
              <span style={{ fontSize: '9px', color: '#8A7366', fontWeight: '500' }}>EXPIRING...</span>
            </div>
            <div style={{ fontSize: '26px', color: '#FDFBF7', fontWeight: '300', letterSpacing: '-0.5px' }}>{incomingHandshakes[0].name}</div>
            <div style={{ fontSize: '13px', color: '#E6A15C', marginBottom: '4px' }}>{incomingHandshakes[0].title}</div>
            <div style={{ fontSize: '12px', color: '#8A7366', fontStyle: 'italic', marginBottom: '24px', lineHeight: '1.5' }}>
              "Wants to sync profiles with you near {incomingHandshakes[0].current_station}."
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => acceptDiscoveryHandshake(incomingHandshakes[0])} 
                style={{ width: '100%', padding: '16px', background: '#E6A15C', color: '#0A0605', fontWeight: '600', border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px' }}
              >
                ACCEPT AND OPEN VAULT
              </button>
              <button 
                onClick={() => declineDiscoveryHandshake(incomingHandshakes[0].id)} 
                style={{ width: '100%', padding: '14px', background: 'transparent', color: '#8A7366', border: '1px solid rgba(138, 115, 102, 0.2)', borderRadius: '14px', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.5px' }}
              >
                BYPASS DISCOVERY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Toast Matrix Alerts */}
      <div style={{ position: 'fixed', top: '24px', left: '24px', right: '24px', zIndex: 9999 }}>
        {systemAlert && (
          <div style={{ background: '#1C1210', border: '1px solid #E6A15C', borderRadius: '12px', padding: '14px 16px', color: '#F5E6D3', fontSize: '11px', textAlign: 'center' }}>
            {systemAlert}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '48px 28px 0 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
        
        {activeTab === 'room' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#8A7366', fontWeight: '600', letterSpacing: '2px' }}>ROOM ({roomUsers.length})</div>
              </div>
              <div 
                onClick={isScanning ? stopQrScanner : startQrScanner} 
                style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'rgba(230,161,92,0.08)', border: '1px solid rgba(230,161,92,0.2)', color: '#E6A15C', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}
              >
                {isScanning ? "CLOSE" : "SCAN"}
              </div>
            </div>

            {isScanning && (
              <div id="room-scanner-viewport" style={{ width: '100%', maxWidth: '350px', aspectRatio: '1/1', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#110D0C', border: '1px solid rgba(230,161,92,0.1)', alignSelf: 'center' }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {roomUsers.map(user => (
                <div key={user.id} style={{ padding: '24px', borderRadius: '20px', backgroundColor: '#110D0C', border: '1px solid rgba(230,161,92,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                  <div style={{ flex: 1, paddingRight: '12px' }}>
                    <div style={{ fontSize: '17px', fontWeight: '400', color: '#F5E6D3' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#E6A15C', marginTop: '4px' }}>{user.title}</div>
                    <div style={{ fontSize: '11px', color: '#8A7366', marginTop: '10px', fontStyle: 'italic' }}>"{user.intent}"</div>
                  </div>
                  
                  <button 
                    disabled={throttledConnections[user.id]}
                    onClick={() => triggerDiscoveryHandshake(user)} 
                    style={{ padding: '12px 18px', backgroundColor: throttledConnections[user.id] ? 'rgba(138,115,102,0.05)' : 'rgba(230,161,92,0.06)', border: throttledConnections[user.id] ? '1px solid rgba(138,115,102,0.1)' : '1px solid rgba(230,161,92,0.2)', color: throttledConnections[user.id] ? '#8A7366' : '#E6A15C', borderRadius: '10px', fontSize: '10px', fontWeight: '600', cursor: throttledConnections[user.id] ? 'not-allowed' : 'pointer', letterSpacing: '1px' }}
                  >
                    {throttledConnections[user.id] ? "SENT" : "CONNECT"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedVaultItem ? (
              <div style={{ backgroundColor: '#110D0C', borderRadius: '24px', padding: '32px', border: '1px solid #E6A15C', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                
                <div 
                  onClick={() => { setSelectedVaultItem(null); setShowTier2Options(false); }} 
                  style={{ position: 'absolute', top: '24px', right: '24px', color: '#E6A15C', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', cursor: 'pointer', padding: '6px 10px', background: 'rgba(230,161,92,0.05)', borderRadius: '6px', zIndex: 50 }}
                >
                  EXIT
                </div>
                
                {!selectedVaultItem.qr_scanned ? (
                  <>
                    <div style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '2px', fontWeight: '600', marginTop: '12px' }}>HANDSHAKE MUTUAL (PENDING PHYSICAL SCAN)</div>
                    <div style={{ fontSize: '24px', color: '#FDFBF7', fontWeight: '300' }}>{selectedVaultItem.name}</div>
                    <div style={{ fontSize: '14px', color: '#E6A15C' }}>{selectedVaultItem.title}</div>
                    <div style={{ background: 'rgba(230,161,92,0.02)', padding: '16px', borderRadius: '12px', fontSize: '11px', color: '#8A7366', border: '1px dashed rgba(230,161,92,0.1)' }}>
                      🔒 Full Identity domain mapping hidden until a physical QR code scanner validation matching is executed.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '9px', color: '#E6A15C', letterSpacing: '2px', fontWeight: '600', marginTop: '12px' }}>TIER-1 CHANNELS VERIFIED</div>
                    <div style={{ fontSize: '24px', color: '#FDFBF7', fontWeight: '300' }}>{selectedVaultItem.name}</div>
                    <div style={{ fontSize: '14px', color: '#E6A15C' }}>{selectedVaultItem.title}</div>
                    <div style={{ fontSize: '13px', color: '#D9C3B0' }}><strong>Domain:</strong> {selectedVaultItem.domain || 'Independent'}</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      {selectedVaultItem.shared_phone && selectedVaultItem.phone && (
                        <div style={{ fontSize: '13px', color: '#F5E6D3', background: '#1C1210', padding: '12px', borderRadius: '8px' }}>📞 {selectedVaultItem.phone}</div>
                      )}
                      {selectedVaultItem.shared_linkedin && selectedVaultItem.linkedin && (
                        <div style={{ fontSize: '13px', color: '#F5E6D3', background: '#1C1210', padding: '12px', borderRadius: '8px' }}>🔗 {selectedVaultItem.linkedin}</div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(230,161,92,0.1)', marginTop: '12px', paddingTop: '16px' }}>
                      {!showTier2Options ? (
                        <button 
                          onClick={() => setShowTier2Options(true)}
                          style={{ width: '100%', padding: '14px', background: 'rgba(230,161,92,0.06)', border: '1px solid rgba(230,161,92,0.3)', color: '#E6A15C', borderRadius: '12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.5px' }}
                        >
                          REQUEST CHANNEL ACCESS
                        </button>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ fontSize: '11px', color: '#8A7366' }}>Select the explicit communication routes to request:</div>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#F5E6D3', cursor: 'pointer' }}>
                              <input type="checkbox" checked={reqPhoneCheckbox} onChange={(e) => setReqPhoneCheckbox(e.target.checked)} style={{ accentColor: '#E6A15C' }} /> Phone Line
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#F5E6D3', cursor: 'pointer' }}>
                              <input type="checkbox" checked={reqLinkedinCheckbox} onChange={(e) => setReqLinkedinCheckbox(e.target.checked)} style={{ accentColor: '#E6A15C' }} /> LinkedIn Handle
                            </label>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={submitTier2Request} style={{ flex: 1, padding: '12px', background: '#E6A15C', color: '#0A0605', border: 'none', borderRadius: '10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                              TRANSMIT
                            </button>
                            <button onClick={() => setShowTier2Options(false)} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', color: '#8A7366', border: 'none', borderRadius: '10px', fontSize: '11px', cursor: 'pointer' }}>
                              CANCEL
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '2px', color: '#E6A15C', marginBottom: '16px' }}>SECURED VAULT CONNECTIONS ({vaultUsers.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {vaultUsers.map((user, i) => (
                    <div key={i} onClick={() => setSelectedVaultItem(user)} style={{ backgroundColor: '#110D0C', borderRadius: '20px', padding: '24px', border: '1px solid rgba(230,161,92,0.02)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '400', color: '#FDFBF7' }}>
                          {user.qr_scanned ? user.name : `${user.name} (Awaiting QR Scan)`}
                        </div>
                        <div style={{ fontSize: '12px', color: '#E6A15C', marginTop: '4px' }}>{user.title}</div>
                      </div>
                      <div style={{ fontSize: '10px', color: '#8A7366', border: '1px solid rgba(230,161,92,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                        {user.qr_scanned ? "VIEW PROFILE" : "PENDING SCAN"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'presence' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: '24px', alignItems: 'center' }}>
            
            {incomingTier2Requests.map((req, idx) => (
              <div key={idx} style={{ width: '100%', maxWidth: '350px', backgroundColor: '#0D0E12', border: '1px solid #E6A15C', borderRadius: '20px', padding: '20px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '12px', color: '#E6A15C', fontWeight: '600' }}>TIER-2 CREDENTIAL ROUTE INPUT</div>
                <div style={{ fontSize: '14px', color: '#FDFBF7', marginTop: '4px' }}><strong>{req.name}</strong> requests network handles:</div>
                <div style={{ fontSize: '12px', color: '#8A7366', margin: '8px 0 16px 0' }}>
                  Requested Paths: {req.requested_phone && ' [Phone Line] '}{req.requested_linkedin && ' [LinkedIn Link] '}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => resolveTier2Request(req, req.requested_phone, req.requested_linkedin)} style={{ width: '100%', padding: '12px', background: '#E6A15C', color: '#0A0605', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>SHARE REQUESTED CHANNELS</button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {req.requested_phone && <button onClick={() => resolveTier2Request(req, true, false)} style={{ flex: 1, padding: '10px', background: 'rgba(230,161,92,0.08)', border: '1px solid rgba(230,161,92,0.2)', color: '#E6A15C', borderRadius: '8px', fontSize: '11px' }}>ONLY PHONE</button>}
                    {req.requested_linkedin && <button onClick={() => resolveTier2Request(req, false, true)} style={{ flex: 1, padding: '10px', background: 'rgba(230,161,92,0.08)', border: '1px solid rgba(230,161,92,0.2)', color: '#E6A15C', borderRadius: '8px', fontSize: '11px' }}>ONLY LINKEDIN</button>}
                  </div>
                  <button onClick={() => resolveTier2Request(req, false, false)} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#8A7366', border: 'none', fontSize: '11px', cursor: 'pointer' }}>DECLINE ENTIRE REQ</button>
                </div>
              </div>
            ))}

            <div style={{ width: '100%', maxWidth: '350px', backgroundColor: '#110D0C', borderRadius: '28px', padding: '40px 32px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid rgba(230,161,92,0.02)' }}>
              
              <div 
                onClick={() => setIsEditing(!isEditing)} 
                style={{ position: 'absolute', top: '32px', right: '32px', width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(230,161,92,0.1)', background: 'rgba(20,13,12,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E6A15C" strokeWidth="1.75">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '1.5px' }}>FULL NAME</span>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#FDFBF7', outline: 'none', fontSize: '18px' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '1.5px' }}>PROFESSIONAL TITLE</span>
                    <input type="text" value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#E6A15C', outline: 'none', fontSize: '14px' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '1.5px' }}>OPERATIONAL DOMAIN</span>
                    <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#D9C3B0', outline: 'none', fontSize: '13px' }} />
                  </div>

                  <div style={{ borderTop: '1px solid rgba(230,161,92,0.05)', paddingTop: '12px' }}>
                    <div onClick={() => setShowSecureInputs(!showSecureInputs)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                      <span style={{ fontSize: '10px', color: '#E6A15C', letterSpacing: '1px', fontWeight: '500' }}>🔒 SOVEREIGN IDENTITY SECURE HANDLES</span>
                      <span style={{ color: '#E6A15C', fontSize: '10px' }}>{showSecureInputs ? '▲' : '▼'}</span>
                    </div>

                    {showSecureInputs && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px', background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '9px', color: '#8A7366' }}>SECURE PHONE LINE</span>
                          <input type="text" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="+1 (555) 000-0000" style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#F5E6D3', outline: 'none', fontSize: '13px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '9px', color: '#8A7366' }}>LINKEDIN LINK HANDLES</span>
                          <input type="text" value={userLinkedin} onChange={(e) => setUserLinkedin(e.target.value)} placeholder="linkedin.com/in/username" style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#F5E6D3', outline: 'none', fontSize: '13px' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={saveProfileLocal} style={{ width: '100%', padding: '12px', background: 'rgba(230,161,92,0.06)', border: '1px solid rgba(230,161,92,0.25)', borderRadius: '10px', color: '#E6A15C', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>SAVE PROFILE CONFIGS</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  {isCardEmpty ? (
                    <div style={{ fontSize: '16px', color: '#3E2E2A', fontStyle: 'italic' }}>Configure digital identity parameters</div>
                  ) : (
                    <>
                      <div style={{ fontSize: '24px', color: '#FDFBF7', lineHeight: '1.2' }}>{fullName}</div>
                      <div style={{ color: '#E6A15C', fontSize: '14px' }}>{role}</div>
                      <div style={{ fontSize: '13px', color: '#D9C3B0', opacity: 0.8 }}>{domain}</div>
                    </>
                  )}
                </div>
              )}
            </div>

            {isVisible && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', borderRadius: '20px', background: 'rgba(20, 13, 12, 0.3)' }}>
                <img src={qrCodeUrl} alt="Identity Token" style={{ width: '130px', height: '130px', borderRadius: '12px' }} />
              </div>
            )}
          </div>
        )}

      </div>

      <div style={{ background: 'linear-gradient(to top, #0A0605 85%, rgba(10, 6, 5, 0))', padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
        
        {showIntentModal && (
          <div style={{ backgroundColor: '#110D0C', border: '1px solid rgba(230, 161, 92, 0.12)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <input type="text" placeholder="Current Focus Intent?" value={currentIntent} onChange={(e) => setCurrentUrlIntent(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(230, 161, 92, 0.1)', borderRadius: '12px', padding: '16px', color: '#F5E6D3', outline: 'none', fontSize: '13px' }} />
            <input type="text" placeholder="Private Landmark Station?" value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)} style={{ width: '100%', background: '#0A0605', border: '1px solid rgba(230, 161, 92, 0.1)', borderRadius: '12px', padding: '16px', color: '#F5E6D3', outline: 'none', fontSize: '13px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <div onClick={confirmVisibility} style={{ flex: 1, backgroundColor: '#E6A15C', color: '#140D0C', padding: '15px', borderRadius: '12px', textAlign: 'center', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>EMIT SIGNAL</div>
              <div onClick={() => { stopQrScanner(); setShowIntentModal(false); }} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', color: '#8A7366', padding: '15px', borderRadius: '12px', textAlign: 'center', fontSize: '11px', cursor: 'pointer' }}>CANCEL</div>
            </div>
          </div>
        )}

        <div style={{ padding: '18px 24px', borderRadius: '24px', backgroundColor: 'rgba(17, 13, 12, 0.7)', border: '1px solid rgba(230, 161, 92, 0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#F5E6D3' }}>Visible Broadcast Mode</div>
            {isVisible && <div style={{ fontSize: '10px', color: '#8A7366', marginTop: '4px' }}>Active at {selectedStation}</div>}
          </div>
          <div onClick={() => { if (!isVisible) { if (!fullName.trim() || !role.trim() || !domain.trim()) { setSystemAlert("Fill card components before emitting profile."); setTimeout(() => setSystemAlert(null), 3000); return; } setShowIntentModal(true); } else { setIsVisible(false); supabase.from('active_presence_nodes').delete().eq('id', userId); setRoomUsers([]); } }} style={{ width: '46px', height: '24px', backgroundColor: isVisible ? '#E6A15C' : '#1C1210', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: '#FDFBF7', borderRadius: '50%', position: 'absolute', top: '3px', left: isVisible ? '25px' : '3px', transition: 'left 0.25s ease' }} />
          </div>
        </div>

        <div style={{ height: '56px', backgroundColor: 'rgba(17, 13, 12, 0.95)', borderRadius: '24px', border: '1px solid rgba(230,161,92,0.03)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div onClick={() => { setActiveTab('room'); fetchActiveNodes(); }} style={{ fontSize: '10px', letterSpacing: '2px', color: activeTab === 'room' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '16px' }}>ROOM</div>
          <div onClick={() => { setActiveTab('vault'); stopQrScanner(); }} style={{ fontSize: '10px', letterSpacing: '2px', color: activeTab === 'vault' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '16px' }}>VAULT</div>
          <div onClick={() => { setActiveTab('presence'); stopQrScanner(); }} style={{ fontSize: '10px', letterSpacing: '2px', color: activeTab === 'presence' ? '#E6A15C' : '#5E4A40', cursor: 'pointer', padding: '16px' }}>PRESENCE</div>
        </div>
      </div>

    </div>
  );
}
