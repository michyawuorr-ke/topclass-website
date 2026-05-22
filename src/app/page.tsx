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
  phone?: string;
  linkedin?: string;
}

export default function OreetiAmbientEngine() {
  const [activeTab, setActiveTab] = useState<'room' | 'vault' | 'presence'>('presence');
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  
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

  const [selectedVaultItem, setSelectedVaultItem] = useState<any | null>(null);
  const [reqPhoneCheckbox, setReqPhoneCheckbox] = useState(false);
  const [reqLinkedinCheckbox, setReqLinkedinCheckbox] = useState(false);

  const [establishedHandshake, setEstablishedHandshake] = useState<{ partnerName: string; station: string } | null>(null);
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
    
    // Vault Feed: Pull items where you initiated OR where mutual handshake/scanning records exist
    const { data: vaultData } = await supabase
      .from('vault_connections')
      .select('*')
      .eq('user_id', userId);
    if (vaultData) setVaultUsers(vaultData);

    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    
    // Incoming Handshakes (User A to User B)
    const { data: discoveryRequests } = await supabase
      .from('vault_connections')
      .select('*')
      .eq('connected_user_id', userId)
      .eq('handshake_accepted', false)
      .eq('qr_scanned', false)
      .gt('created_at', threeMinutesAgo);
    if (discoveryRequests) setIncomingHandshakes(discoveryRequests);

    // Incoming Tier-2 Credentials Requests
    const { data: t2Requests } = await supabase
      .from('vault_connections')
      .select('*')
      .eq('connected_user_id', userId)
      .eq('tier2_request_pending', true);
    if (t2Requests) setIncomingTier2Requests(t2Requests);

    // Dynamic established handshake banner trigger logic
    const { data: acceptedCheck } = await supabase
      .from('vault_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('handshake_accepted', true)
      .gt('created_at', threeMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (acceptedCheck && acceptedCheck.length > 0 && !establishedHandshake) {
      setEstablishedHandshake({
        partnerName: acceptedCheck[0].name,
        station: acceptedCheck[0].current_station || 'Nearby Area'
      });
    }
  };

  useEffect(() => {
    if (!userId) return;
    syncDatabaseFeeds();
    const intervalSync = setInterval(syncDatabaseFeeds, 4000);
    return () => clearInterval(intervalSync);
  }, [activeTab, userId]);

  // Action: Trigger initial Discovery Handshake Request
  const triggerDiscoveryHandshake = async (targetUser: Networker) => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('vault_connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('handshake_accepted', false)
      .gt('created_at', threeMinutesAgo);

    if (count && count >= 3) {
      setSystemAlert("Spam Guard: Limit of 3 active pending handshakes reached.");
      setTimeout(() => setSystemAlert(null), 4000);
      return;
    }

    // Insert request from perspective of sender
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
    syncDatabaseFeeds();
  };

  const acceptDiscoveryHandshake = async (request: any) => {
    // 1. Update Sender's status to accepted
    await supabase.from('vault_connections')
      .update({ handshake_accepted: true })
      .eq('id', request.id);

    // 2. Insert reciprocal entry for User B so it arrives in their Vault
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

    setEstablishedHandshake({
      partnerName: request.name,
      station: request.current_station || 'Assigned Landmark'
    });

    syncDatabaseFeeds();
  };

  const declineDiscoveryHandshake = async (reqId: number) => {
    await supabase.from('vault_connections').delete().eq('id', reqId);
    syncDatabaseFeeds();
  };

  // Action: Handle the physical screen scan interaction
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

              // Get complete payload from nodes database
              const { data: targetNode } = await supabase
                .from('active_presence_nodes')
                .select('*')
                .eq('id', scannedId)
                .single();

              if (targetNode) {
                // Upsert or Update current link to mark QR scan physical meet confirmation as true
                const { data: existing } = await supabase
                  .from('vault_connections')
                  .select('*')
                  .eq('user_id', userId)
                  .eq('connected_user_id', targetNode.id);

                if (existing && existing.length > 0) {
                  await supabase.from('vault_connections')
                    .update({ qr_scanned: true, domain: targetNode.domain, name: targetNode.name, title: targetNode.title })
                    .eq('id', existing[0].id);
                } else {
                  await supabase.from('vault_connections').insert({
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
                }

                setSystemAlert("Physical Meet Established. Profile verified in Vault.");
                setTimeout(() => setSystemAlert(null), 3000);
                setActiveTab('vault');
                syncDatabaseFeeds();
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

  // Action: Request Tier-2 access credentials
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

    setSystemAlert("Tier-2 Authorization request transmitted.");
    setTimeout(() => setSystemAlert(null), 3000);
    setSelectedVaultItem(null);
    syncDatabaseFeeds();
  };

  // Action: User B responds to dynamic check options
  const resolveTier2Request = async (request: any, approvePhone: boolean, approveLinkedin: boolean) => {
    // Update structural visibility links back to requester
    await supabase.from('vault_connections')
      .update({
        tier2_request_pending: false,
        shared_phone: approvePhone,
        shared_linkedin: approveLinkedin
      })
      .eq('user_id', request.connected_user_id)
      .eq('connected_user_id', request.user_id);

    setSystemAlert("Sovereign profile options shared.");
    setTimeout(() => setSystemAlert(null), 3000);
    syncDatabaseFeeds();
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
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#0A0605', color: '#FDFBF7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Alert Top Frame Layer */}
      <div style={{ position: 'fixed', top: '24px', left: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {systemAlert && (
          <div style={{ background: '#1C1210', border: '1px solid #E6A15C', borderRadius: '12px', padding: '14px 16px', color: '#F5E6D3', fontSize: '11px', textAlign: 'center' }}>
            {systemAlert}
          </div>
        )}

        {establishedHandshake && (
          <div style={{ background: '#110D0C', border: '2px solid #E6A15C', borderRadius: '24px', padding: '28px', color: '#F5E6D3', boxShadow: '0 25px 60px rgba(0,0,0,0.85)', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#E6A15C', letterSpacing: '2px', fontWeight: '600', marginBottom: '8px' }}>HANDSHAKE ESTABLISHED</div>
            <div style={{ fontSize: '18px', fontWeight: '400', marginBottom: '14px', color: '#FDFBF7' }}>Connected with {establishedHandshake.partnerName}</div>
            <div style={{ fontSize: '12px', color: '#8A7366', marginBottom: '20px' }}>Location Target: <span style={{ color: '#F5E6D3', fontWeight: '500' }}>{establishedHandshake.station}</span></div>
            <div onClick={() => setEstablishedHandshake(null)} style={{ padding: '12px', background: 'rgba(230,161,92,0.1)', border: '1px solid rgba(230,161,92,0.3)', borderRadius: '10px', fontSize: '11px', fontWeight: '600', color: '#E6A15C', cursor: 'pointer' }}>DISMISS NOTIFICATION</div>
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
                <div key={user.id} style={{ padding: '24px', borderRadius: '20px', backgroundColor: '#110D0C', border: '1px solid rgba(230,161,92,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                  <div style={{ flex: 1, paddingRight: '12px' }}>
                    <div style={{ fontSize: '17px', fontWeight: '400', color: '#F5E6D3' }}>{user.name ? user.name.split(' ')[0] : 'Peer'}</div>
                    <div style={{ fontSize: '12px', color: '#E6A15C', marginTop: '4px' }}>{user.title}</div>
                    <div style={{ fontSize: '11px', color: '#8A7366', marginTop: '10px', fontStyle: 'italic' }}>"{user.intent}"</div>
                  </div>
                  
                  <div 
                    onClick={() => triggerDiscoveryHandshake(user)} 
                    style={{ padding: '12px 18px', backgroundColor: 'rgba(230,161,92,0.06)', border: '1px solid rgba(230,161,92,0.2)', color: '#E6A15C', borderRadius: '10px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', letterSpacing: '1px', whiteSpace: 'nowrap' }}
                  >
                    CONNECT
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedVaultItem ? (
              <div style={{ backgroundColor: '#110D0C', borderRadius: '24px', padding: '32px', border: '1px solid #E6A15C', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                <div onClick={() => setSelectedVaultItem(null)} style={{ position: 'absolute', top: '24px', right: '24px', color: '#8A7366', fontSize: '10px', cursor: 'pointer' }}>EXIT</div>
                
                {/* Visual Identity Mask Layers governed strictly by physical meet confirmation status */}
                {!selectedVaultItem.qr_scanned ? (
                  <>
                    <div style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '2px', fontWeight: '600' }}>HANDSHAKE ACCEPTED (PENDING SCAN)</div>
                    <div style={{ fontSize: '24px', color: '#FDFBF7', fontWeight: '300' }}>{selectedVaultItem.name.split(' ')[0]}</div>
                    <div style={{ fontSize: '14px', color: '#E6A15C' }}>{selectedVaultItem.title}</div>
                    <div style={{ background: 'rgba(230,161,92,0.03)', padding: '16px', borderRadius: '12px', fontSize: '11px', color: '#8A7366', textAlign: 'center', marginTop: '10px', border: '1px dashed rgba(230,161,92,0.1)' }}>
                      🔒 Full Identity Profile and Enterprise Domain masked until physical screen verification is performed.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '9px', color: '#E6A15C', letterSpacing: '2px', fontWeight: '600' }}>PHYSICAL MEET CONFIRMED (TIER-1 VERIFIED)</div>
                    <div style={{ fontSize: '24px', color: '#FDFBF7', fontWeight: '300' }}>{selectedVaultItem.name}</div>
                    <div style={{ fontSize: '14px', color: '#E6A15C' }}>{selectedVaultItem.title}</div>
                    <div style={{ fontSize: '13px', color: '#D9C3B0' }}><strong>Domain:</strong> {selectedVaultItem.domain || 'Independent'}</div>
                    
                    {/* Render Dynamic Shared Tier-2 Data Blocks if unlocked */}
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedVaultItem.shared_phone && (
                        <div style={{ fontSize: '13px', color: '#FDFBF7', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px' }}>📞 {selectedVaultItem.phone || 'Not Provided'}</div>
                      )}
                      {selectedVaultItem.shared_linkedin && (
                        <div style={{ fontSize: '13px', color: '#FDFBF7', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px' }}>🔗 {selectedVaultItem.linkedin || 'Not Provided'}</div>
                      )}
                    </div>

                    {/* Request Matrix Engine Drawer */}
                    <div style={{ borderTop: '1px solid rgba(230,161,92,0.1)', marginTop: '16px', paddingTop: '16px' }}>
                      <div style={{ fontSize: '11px', color: '#8A7366', marginBottom: '12px' }}>Request Tier-2 Sovereignty Channels:</div>
                      
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#F5E6D3', cursor: 'pointer' }}>
                          <input type="checkbox" checked={reqPhoneCheckbox} onChange={(e) => setReqPhoneCheckbox(e.target.checked)} style={{ accentColor: '#E6A15C' }} /> Phone
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#F5E6D3', cursor: 'pointer' }}>
                          <input type="checkbox" checked={reqLinkedinCheckbox} onChange={(e) => setReqLinkedinCheckbox(e.target.checked)} style={{ accentColor: '#E6A15C' }} /> LinkedIn
                        </label>
                      </div>

                      <button 
                        onClick={submitTier2Request}
                        style={{ width: '100%', padding: '14px', background: '#E6A15C', color: '#0A0605', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        TRANSMIT ACCESS REQUEST
                      </button>
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
                          {user.qr_scanned ? user.name : `${user.name.split(' ')[0]} (Handshake Established)`}
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
            
            {/* Handshake Verification Queue */}
            {incomingHandshakes.map((req, idx) => (
              <div key={idx} style={{ width: '100%', maxWidth: '350px', backgroundColor: '#140D0C', border: '1px solid rgba(230,161,92,0.2)', borderRadius: '20px', padding: '20px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '13px', color: '#F5E6D3', marginBottom: '14px' }}>Incoming handshake from <strong>{req.name.split(' ')[0]}</strong>?</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => acceptDiscoveryHandshake(req)} style={{ flex: 1, padding: '10px', background: '#E6A15C', color: '#0A0605', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>ACCEPT</button>
                  <button onClick={() => declineDiscoveryHandshake(req.id)} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', color: '#8A7366', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>BYPASS</button>
                </div>
              </div>
            ))}

            {/* Tier-2 Credentials Resolution Queue */}
            {incomingTier2Requests.map((req, idx) => (
              <div key={idx} style={{ width: '100%', maxWidth: '350px', backgroundColor: '#0F1214', border: '1px solid #E6A15C', borderRadius: '20px', padding: '20px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '13px', color: '#F5E6D3', marginBottom: '8px' }}><strong>Tier-2 Request</strong> from {req.name}</div>
                <div style={{ fontSize: '11px', color: '#8A7366', marginBottom: '14px' }}>Requested paths: {req.requested_phone && ' [Phone] '}{req.requested_linkedin && ' [LinkedIn] '}</div>
                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => resolveTier2Request(req, req.requested_phone, req.requested_linkedin)} style={{ flex: 1, padding: '10px', background: '#E6A15C', color: '#0A0605', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>SHARE REQUESTED</button>
                    <button onClick={() => resolveTier2Request(req, false, false)} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', color: '#8A7366', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>DECLINE ALL</button>
                  </div>
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '1.5px' }}>SECURE PHONE ANCHOR</span>
                    <input type="text" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="+1..." style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#F5E6D3', outline: 'none', fontSize: '13px' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#8A7366', letterSpacing: '1.5px' }}>LINKEDIN HANDLE URL</span>
                    <input type="text" value={userLinkedin} onChange={(e) => setUserLinkedin(e.target.value)} placeholder="linkedin.com/in/..." style={{ width: '100%', background: 'transparent', border: 'none', padding: '4px 0', color: '#F5E6D3', outline: 'none', fontSize: '13px' }} />
                  </div>

                  <div onClick={() => setIsEditing(false)} style={{ padding: '10px 22px', borderRadius: '10px', background: 'rgba(230,161,92,0.06)', border: '1px solid rgba(230,161,92,0.25)', color: '#E6A15C', fontSize: '10px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' }}>SAVE DETAILS</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  {isCardEmpty ? (
                    <div style={{ fontSize: '16px', color: '#3E2E2A', fontStyle: 'italic' }}>Fill profile configurations</div>
                  ) : (
                    <>
                      <div style={{ fontSize: '24px', color: '#FDFBF7', lineHeight: '1.2' }}>{fullName || 'Name'}</div>
                      <div style={{ color: '#E6A15C', fontSize: '14px' }}>{role || 'Role'}</div>
                      <div style={{ fontSize: '13px', color: '#D9C3B0', opacity: 0.8 }}>{domain || 'Domain'}</div>
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
