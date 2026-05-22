'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode } from 'html5-qrcode';

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
}

export default function OreetiAmbientEngine() {
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('presence');
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [domain, setDomain] = useState('');
  
  const [currentIntent, setCurrentUrlIntent] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const [roomUsers, setRoomUsers] = useState<Networker[]>([]);
  const [vaultUsers, setVaultUsers] = useState<any[]>([]);
  const [incomingHandshakes, setIncomingHandshakes] = useState<any[]>([]);
  
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
    }, 5000);
    return () => clearInterval(heartbeat);
  }, [isVisible, userId]);

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
    const intervalSync = setInterval(fetchActiveNodes, 4000);
    return () => clearInterval(intervalSync);
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
      .gt('created_at', threeMinutesAgo);

    if (discoveryRequests) setIncomingHandshakes(discoveryRequests);
  };

  useEffect(() => {
    if (!userId) return;
    syncDatabaseFeeds();
    const intervalSync = setInterval(syncDatabaseFeeds, 6000);
    return () => clearInterval(intervalSync);
  }, [activeTab, userId]);

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
              
              // Force clear scanner immediately on discovery read to unlock camera hardware
              if (html5QrCodeRef.current) {
                await html5QrCodeRef.current.stop().catch(()=>{});
                html5QrCodeRef.current = null;
              }
              setIsScanning(false);

              await supabase.from('vault_connections').insert({ 
                user_id: userId, 
                connected_user_id: scannedId, 
                connection_method: 'discovery', 
                handshake_accepted: false, 
                created_at: new Date().toISOString() 
              });
              
              setSystemAlert("Handshake code sent!");
              setTimeout(() => setSystemAlert(null), 3000);
              syncDatabaseFeeds();
            }
          },
          () => {}
        );
      } catch (err) {
        setSystemAlert("Camera access failed.");
        setTimeout(() => setSystemAlert(null), 3000);
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

  const acceptDiscoveryHandshake = async (requesterId: string) => {
    await supabase.from('vault_connections').update({ handshake_accepted: true }).eq('user_id', requesterId).eq('connected_user_id', userId);
    await supabase.from('vault_connections').insert({ user_id: userId, connected_user_id: requesterId, connection_method: 'discovery', handshake_accepted: true });
    setSystemAlert("Connection secured.");
    setTimeout(() => setSystemAlert(null), 3000);
    syncDatabaseFeeds();
  };

  const declineDiscoveryHandshake = async (requesterId: string) => {
    await supabase.from('vault_connections').delete().eq('user_id', requesterId).eq('connected_user_id', userId);
    syncDatabaseFeeds();
  };

  const confirmVisibility = async () => {
    if (!fullName.trim() || !role.trim() || !domain.trim() || !currentIntent.trim() || !selectedStation.trim()) {
      setSystemAlert("Complete your digital card fields first.");
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
      room_anchor: 'global_unfiltered_presence',
      last_seen: new Date().toISOString()
    });
    
    setTimeout(fetchActiveNodes, 300);
  };

  const isCardEmpty = !fullName.trim() && !role.trim() && !domain.trim();

  return (
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#0A0605', color: '#FDFBF7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Alert Top Frame */}
      <div style={{ position: 'fixed', top: '24px', left: '24px', right: '24px', zIndex: 9999 }}>
        {systemAlert && (
          <div style={{ background: '#1C1210', border: '1px solid #E6A15C', borderRadius: '12px', padding: '14px 16px', color: '#F5E6D3', fontSize: '12px', textAlign: 'center', letterSpacing: '0.5px' }}>
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
                style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'rgba(230,161,92,0.08)', border: '1px solid rgba(230,161,92,0.2)', color: '#E6A15C', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', cursor: 'pointer' }}
              >
                {isScanning ? "CLOSE" : "SCAN"}
              </div>
            </div>

            {isScanning && (
              <div id="room-scanner-viewport" style={{ width: '100%', maxWidth: '350px', aspectRatio: '1/1', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#110D0C', border: '1px solid rgba(230,161,92,0.1)', alignSelf: 'center' }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {roomUsers.map(user => (
                <div key={user.id} style={{ padding: '24px', borderRadius: '20px', backgroundColor: '#110D0C', border: '1px solid rgba(230,161,92,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, paddingRight: '16px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '400', color: '#F5E6D3' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#E6A15C', marginTop: '4px' }}>{user.title} <span style={{ color: '#8A7366' }}>@ {user.domain}</span></div>
                    {user.current_station && (
                      <div style={{ fontSize: '10px', color: '#8A7366', marginTop: '8px' }}>{user.current_station}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '2px', color: '#E6A15C', marginBottom: '16px' }}>VAULT CONNECTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {vaultUsers.map((user, i) => (
                  <div key={i} style={{ backgroundColor: '#110D0C', borderRadius: '20px', padding: '24px', border: '1px solid rgba(230,161,92,0.02)' }}>
                    <div style={{ fontSize: '16px', fontWeight: '400', color: '#FDFBF7' }}>{user.name}</div>
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
                <div style={{ fontSize: '13px', color: '#F5E6D3', marginBottom: '14px' }}>Incoming handshake from <strong>{req.name}</strong>?</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => acceptDiscoveryHandshake(req.user_id)} style={{ flex: 1, padding: '10px', background: '#E6A15C', color: '#0A0605', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>ACCEPT</button>
                  <button onClick={() => declineDiscoveryHandshake(req.user_id)} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', color: '#8A7366', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>BYPASS</button>
                </div>
              </div>
            ))}

            <div style={{ width: '100%', maxWidth: '350px', backgroundColor: '#110D0C', borderRadius: '28px', padding: '40px 32px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid rgba(230,161,92,0.02)' }}>
              
              <div 
                onClick={() => setIsEditing(!isEditing)} 
                style={{ position: 'absolute', top: '32px', right: '32px', width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(230,161,92,0.1)', background: 'rgba(20,13,12,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E6A15C" strokeWidth="1.75">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Full Name</span>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#FDFBF7', outline: 'none', fontSize: '20px' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Professional Title</span>
                    <input type="text" value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#E6A15C', outline: 'none', fontSize: '15px' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Operational Domain</span>
                    <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#D9C3B0', outline: 'none', fontSize: '14px' }} />
                  </div>

                  <div onClick={() => setIsEditing(false)} style={{ padding: '10px 22px', borderRadius: '10px', background: 'rgba(230,161,92,0.06)', border: '1px solid rgba(230,161,92,0.25)', color: '#E6A15C', fontSize: '10px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' }}>SAVE PROFILE</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  {isCardEmpty ? (
                    <div style={{ fontSize: '16px', color: '#3E2E2A', fontStyle: 'italic' }}>Fill your digital card</div>
                  ) : (
                    <>
                      <div style={{ fontSize: '24px', color: '#FDFBF7', lineHeight: '1.2' }}>{fullName.trim() ? fullName : 'Name'}</div>
                      <div style={{ color: '#E6A15C', fontSize: '14px' }}>{role.trim() ? role : 'Role'}</div>
                      <div style={{ fontSize: '13px', color: '#D9C3B0', opacity: 0.8 }}>{domain.trim() ? domain : 'Domain'}</div>
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

      {/* Footer Switchboards */}
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
          <div onClick={() => { if (!isVisible) { if (!fullName.trim() || !role.trim() || !domain.trim()) { setSystemAlert("Fill your digital card details first."); setTimeout(() => setSystemAlert(null), 3000); return; } setShowIntentModal(true); } else { setIsVisible(false); supabase.from('active_presence_nodes').delete().eq('id', userId); setRoomUsers([]); } }} style={{ width: '46px', height: '24px', backgroundColor: isVisible ? '#E6A15C' : '#1C1210', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
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
