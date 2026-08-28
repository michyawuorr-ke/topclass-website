'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode } from 'html5-qrcode';
import { Analytics } from '@vercel/analytics/react';

const SUPABASE_URL = 'https://ikhkpdfgjqqbvkyvfgrw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlraGtwZGZnanFxYnZreXZmZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjE1NzMsImV4cCI6MjA5NDg5NzU3M30.RWBlgX-xH9aYTNBjwrRNeeogpoIvkSRXh08gIDSjb4U';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type Lens = 'foryou' | 'people' | 'opportunities' | 'resources' | 'activities';
type NavTab = 'discover' | 'connections' | 'journey';

interface Presence {
  id: string;
  profile_id: string;
  space_id: string;
  zone_id: string | null;
  intent: string | null;
  need: string | null;
  offer: string | null;
  station: string | null;
  last_seen: string;
  profiles?: { name: string; title: string; domain: string };
}

interface Opportunity {
  id: string; title: string; type: string; provider: string;
  eligibility: string; location: string; deadline: string; conditions: string; next_steps: string;
}
interface ResourceItem {
  id: string; name: string; owner: string; availability: string; conditions: string;
}
interface ActivityItem {
  id: string; title: string; host: string; start_time: string; end_time: string; purpose: string;
}

export default function ToruokSpaceApp() {
  // ---- Space context ----
  const [spaceId, setSpaceId] = useState<string>('');
  const [spaceInput, setSpaceInput] = useState('');
  const [spaceName, setSpaceName] = useState('');

  // ---- Identity ----
  const [profileId, setProfileId] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [domain, setDomain] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userLinkedin, setUserLinkedin] = useState('');

  // ---- Nav / lens state ----
  const [activeNav, setActiveNav] = useState<NavTab>('discover');
  const [activeLens, setActiveLens] = useState<Lens>('foryou');
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // ---- Presence / intent ----
  const [isVisible, setIsVisible] = useState(false);
  const [need, setNeed] = useState('');
  const [offer, setOffer] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // ---- Discover data ----
  const [presentPeople, setPresentPeople] = useState<Presence[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // ---- Connections ----
  const [connections, setConnections] = useState<any[]>([]);
  const [incomingHandshakes, setIncomingHandshakes] = useState<any[]>([]);
  const [incomingTier2Requests, setIncomingTier2Requests] = useState<any[]>([]);
  const [throttled, setThrottled] = useState<Record<string, boolean>>({});
  const [selectedConnection, setSelectedConnection] = useState<any | null>(null);
  const [reqPhoneCheckbox, setReqPhoneCheckbox] = useState(false);
  const [reqLinkedinCheckbox, setReqLinkedinCheckbox] = useState(false);
  const [stickyNoteText, setStickyNoteText] = useState('');
  const [showTier2Options, setShowTier2Options] = useState(false);

  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const alert = (msg: string) => { setSystemAlert(msg); setTimeout(() => setSystemAlert(null), 3000); };

  // ============================================================
  // Bootstrap: space from URL, identity from localStorage
  // ============================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('space');
    if (s) {
      setSpaceId(s);
      localStorage.setItem('toruok_space_id', s);
    } else {
      const saved = localStorage.getItem('toruok_space_id');
      if (saved) setSpaceId(saved);
    }

    let pid = localStorage.getItem('toruok_profile_id');
    if (!pid) {
      pid = crypto.randomUUID();
      localStorage.setItem('toruok_profile_id', pid);
    }
    setProfileId(pid);

    setFullName(localStorage.getItem('p_name') || '');
    setRole(localStorage.getItem('p_role') || '');
    setDomain(localStorage.getItem('p_domain') || '');
    setUserPhone(localStorage.getItem('p_phone') || '');
    setUserLinkedin(localStorage.getItem('p_link') || '');
  }, []);

  useEffect(() => {
    if (!spaceId) return;
    supabase.from('spaces').select('name').eq('id', spaceId).single()
      .then(({ data }) => { if (data) setSpaceName(data.name); });
  }, [spaceId]);

  const confirmSpaceCode = () => {
    if (!spaceInput.trim()) return;
    setSpaceId(spaceInput.trim());
    localStorage.setItem('toruok_space_id', spaceInput.trim());
  };

  // ============================================================
  // Discover data fetches — scoped to the current space
  // ============================================================
  const fetchPresentPeople = async () => {
    if (!spaceId) return;
    const { data } = await supabase
      .from('presence')
      .select('*, profiles(name, title, domain)')
      .eq('space_id', spaceId);
    if (data) setPresentPeople(data as any);
  };

  const fetchOpportunities = async () => {
    if (!spaceId) return;
    const { data } = await supabase.from('opportunities').select('*').eq('space_id', spaceId);
    if (data) setOpportunities(data as any);
  };
  const fetchResources = async () => {
    if (!spaceId) return;
    const { data } = await supabase.from('resources').select('*').eq('space_id', spaceId);
    if (data) setResources(data as any);
  };
  const fetchActivities = async () => {
    if (!spaceId) return;
    const { data } = await supabase.from('activities').select('*').eq('space_id', spaceId);
    if (data) setActivities(data as any);
  };

  useEffect(() => {
    if (!spaceId) return;
    fetchPresentPeople();
    fetchOpportunities();
    fetchResources();
    fetchActivities();
    const interval = setInterval(fetchPresentPeople, 5000);
    return () => clearInterval(interval);
  }, [spaceId]);

  // ============================================================
  // Connections sync (handshakes, tier-2 requests)
  // ============================================================
  const syncConnections = async () => {
    if (!profileId) return;

    const { data: myConnections } = await supabase
      .from('connections')
      .select('*')
      .eq('profile_id', profileId);

    if (myConnections) {
      const live = myConnections.filter(item => {
        if (item.handshake_accepted) return true;
        const age = (Date.now() - new Date(item.created_at || Date.now()).getTime()) / 1000;
        if (age >= 180) {
          supabase.from('connections').delete().eq('id', item.id).then(() => {});
          return false;
        }
        return true;
      });
      setConnections(live);
    }

    const { data: incoming } = await supabase
      .from('connections')
      .select('*')
      .eq('profile_id', profileId)
      .eq('handshake_accepted', false)
      .eq('qr_scanned', false);
    if (incoming) {
      setIncomingHandshakes(incoming.filter(r => {
        const age = (Date.now() - new Date(r.created_at || Date.now()).getTime()) / 1000;
        return age < 5;
      }));
    }

    const { data: t2 } = await supabase
      .from('connections')
      .select('*')
      .eq('connected_profile_id', profileId)
      .eq('tier2_request_pending', true);
    if (t2) setIncomingTier2Requests(t2);
  };

  useEffect(() => {
    if (!profileId) return;
    syncConnections();
    const channel = supabase
      .channel('realtime_connections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, syncConnections)
      .subscribe();
    const clock = setInterval(syncConnections, 1000);
    return () => { supabase.removeChannel(channel); clearInterval(clock); };
  }, [profileId]);

  useEffect(() => {
    if (selectedConnection) setStickyNoteText(selectedConnection.sticky_note || '');
  }, [selectedConnection]);

  // ============================================================
  // Presence / intent
  // ============================================================
  const confirmVisibility = async () => {
    if (!fullName.trim() || !role.trim() || !need.trim() || !selectedStation.trim() || !spaceId) {
      alert('Complete your name, role, need, and station.');
      return;
    }
    setShowIntentModal(false);
    setIsVisible(true);

    await supabase.from('profiles').upsert({
      id: profileId, name: fullName, title: role, domain, phone: userPhone, linkedin: userLinkedin,
    });

    await supabase.from('presence').upsert({
      id: profileId, // reuse profile id as presence id for simplicity — one active presence per profile
      profile_id: profileId,
      space_id: spaceId,
      intent: `${need}${offer ? ' / offering: ' + offer : ''}`,
      need, offer,
      station: selectedStation,
      last_seen: new Date().toISOString(),
    });

    setTimeout(fetchPresentPeople, 300);
  };

  const saveProfileLocal = () => {
    localStorage.setItem('p_name', fullName);
    localStorage.setItem('p_role', role);
    localStorage.setItem('p_domain', domain);
    localStorage.setItem('p_phone', userPhone);
    localStorage.setItem('p_link', userLinkedin);
    setIsEditingProfile(false);
  };

  // ============================================================
  // Handshake / QR / tier-2 (ported logic, new table/column names)
  // ============================================================
  const triggerHandshake = async (target: Presence) => {
    if (target.profile_id === profileId || throttled[target.profile_id]) return;
    setThrottled(prev => ({ ...prev, [target.profile_id]: true }));

    await supabase.from('connections').insert({
      profile_id: target.profile_id,
      connected_profile_id: profileId,
      space_id: spaceId,
      handshake_accepted: false,
      qr_scanned: false,
    });

    alert(`Handshake sent to ${target.profiles?.name?.split(' ')[0] || 'them'}`);
    setTimeout(() => setThrottled(prev => ({ ...prev, [target.profile_id]: false })), 4000);
  };

  const acceptHandshake = async (request: any) => {
    setIncomingHandshakes(prev => prev.filter(h => h.id !== request.id));
    await supabase.from('connections').update({ handshake_accepted: true }).eq('id', request.id);
    await supabase.from('connections').insert({
      profile_id: profileId,
      connected_profile_id: request.connected_profile_id,
      space_id: spaceId,
      handshake_accepted: true,
      qr_scanned: false,
    });
    alert('Connection made.');
    setSelectedConnection(null);
    setActiveNav('connections');
  };

  const declineHandshake = async (id: string) => {
    setIncomingHandshakes(prev => prev.filter(h => h.id !== id));
    await supabase.from('connections').delete().eq('id', id);
    setSelectedConnection(null);
  };

  const saveStickyNote = async () => {
    if (!selectedConnection) return;
    await supabase.from('connections').update({ sticky_note: stickyNoteText }).eq('id', selectedConnection.id);
    setSelectedConnection((prev: any) => prev ? { ...prev, sticky_note: stickyNoteText } : null);
    alert('Note saved.');
  };

  const startQrScanner = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('scanner-viewport');
        html5QrCodeRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            const scannedProfileId = decodedText.split('||')[0];
            if (html5QrCodeRef.current) { await html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current = null; }
            setIsScanning(false);

            const { data: targetProfile } = await supabase.from('profiles').select('*').eq('id', scannedProfileId).single();
            if (targetProfile) {
              await supabase.from('connections').upsert({
                profile_id: profileId, connected_profile_id: targetProfile.id, space_id: spaceId,
                handshake_accepted: true, qr_scanned: true,
              });
              await supabase.from('connections').upsert({
                profile_id: targetProfile.id, connected_profile_id: profileId, space_id: spaceId,
                handshake_accepted: true, qr_scanned: true,
              });
              alert('Connected.');
              setActiveNav('connections');
            }
          },
          () => {}
        );
      } catch { setIsScanning(false); }
    }, 150);
  };
  const stopQrScanner = async () => {
    if (html5QrCodeRef.current) { await html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current = null; }
    setIsScanning(false);
  };

  const submitTier2Request = async () => {
    if (!selectedConnection) return;
    await supabase.from('connections').update({
      tier2_request_pending: true, requested_phone: reqPhoneCheckbox, requested_linkedin: reqLinkedinCheckbox,
    }).eq('profile_id', profileId).eq('connected_profile_id', selectedConnection.connected_profile_id);
    alert('Access requested.');
    setShowTier2Options(false);
    setSelectedConnection(null);
  };

  const resolveTier2Request = async (request: any, approvePhone: boolean, approveLinkedin: boolean) => {
    setIncomingTier2Requests(prev => prev.filter(r => r.id !== request.id));
    await supabase.from('connections').update({
      tier2_request_pending: false, shared_phone: approvePhone, shared_linkedin: approveLinkedin,
    }).eq('profile_id', request.profile_id).eq('connected_profile_id', profileId);
    alert('Permissions saved.');
  };

  // ============================================================
  // Render
  // ============================================================
  if (!spaceId) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Toruok Space</h1>
        <p style={{ opacity: 0.7, marginBottom: 20, textAlign: 'center' }}>Enter or scan the space code for where you are</p>
        <input value={spaceInput} onChange={e => setSpaceInput(e.target.value)} placeholder="Space ID"
          style={{ padding: 12, borderRadius: 8, width: '100%', maxWidth: 320, marginBottom: 12, border: 'none' }} />
        <button onClick={confirmSpaceCode} style={{ padding: '12px 24px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>
          Enter Space
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', fontFamily: 'sans-serif', paddingBottom: 70 }}>
      {systemAlert && (
        <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', background: '#E26D34', color: '#fff', padding: '8px 16px', borderRadius: 8, zIndex: 50 }}>
          {systemAlert}
        </div>
      )}

      {/* Top context header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>You are in</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{spaceName || 'this space'}</div>
        </div>
        <button onClick={() => setShowProfilePanel(true)}
          style={{ width: 40, height: 40, borderRadius: 20, background: '#D4AF37', color: '#1C1C2E', border: 'none', fontWeight: 700 }}>
          {fullName ? fullName[0].toUpperCase() : '?'}
        </button>
      </div>

      {/* DISCOVER */}
      {activeNav === 'discover' && (
        <div style={{ padding: '0 16px' }}>
          {!isVisible && (
            <button onClick={() => setShowIntentModal(true)}
              style={{ width: '100%', padding: 14, borderRadius: 10, background: '#E26D34', color: '#fff', border: 'none', marginBottom: 16 }}>
              Become visible in this space
            </button>
          )}

          {/* Lens switcher */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16 }}>
            {(['foryou', 'people', 'opportunities', 'resources', 'activities'] as Lens[]).map(lens => (
              <button key={lens} onClick={() => setActiveLens(lens)}
                style={{
                  padding: '8px 14px', borderRadius: 20, whiteSpace: 'nowrap', border: 'none',
                  background: activeLens === lens ? '#D4AF37' : 'rgba(255,255,255,0.08)',
                  color: activeLens === lens ? '#1C1C2E' : '#F5EFE3',
                }}>
                {lens === 'foryou' ? 'For You' : lens.charAt(0).toUpperCase() + lens.slice(1)}
              </button>
            ))}
          </div>

          {(activeLens === 'foryou' || activeLens === 'people') && (
            <div>
              {presentPeople.filter(p => p.profile_id !== profileId).length === 0 && (
                <p style={{ opacity: 0.5 }}>No one else visible here yet.</p>
              )}
              {presentPeople.filter(p => p.profile_id !== profileId).map(p => (
                <div key={p.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600 }}>{p.profiles?.name || 'Someone'}</div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>{p.profiles?.title} · {p.profiles?.domain}</div>
                  {p.need && <div style={{ fontSize: 13, marginTop: 6 }}>Needs: {p.need}</div>}
                  {p.offer && <div style={{ fontSize: 13 }}>Offers: {p.offer}</div>}
                  <button onClick={() => triggerHandshake(p)} disabled={throttled[p.profile_id]}
                    style={{ marginTop: 10, padding: '6px 14px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeLens === 'opportunities' && (
            <div>
              {opportunities.length === 0 && <p style={{ opacity: 0.5 }}>No opportunities posted yet.</p>}
              {opportunities.map(o => (
                <div key={o.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600 }}>{o.title}</div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>{o.type} · {o.provider}</div>
                  {o.eligibility && <div style={{ fontSize: 13, marginTop: 6 }}>Eligibility: {o.eligibility}</div>}
                  {o.deadline && <div style={{ fontSize: 13 }}>Deadline: {new Date(o.deadline).toLocaleDateString()}</div>}
                </div>
              ))}
            </div>
          )}

          {activeLens === 'resources' && (
            <div>
              {resources.length === 0 && <p style={{ opacity: 0.5 }}>No resources listed yet.</p>}
              {resources.map(r => (
                <div key={r.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>{r.owner}</div>
                  {r.availability && <div style={{ fontSize: 13, marginTop: 6 }}>Availability: {r.availability}</div>}
                </div>
              ))}
            </div>
          )}

          {activeLens === 'activities' && (
            <div>
              {activities.length === 0 && <p style={{ opacity: 0.5 }}>No activities scheduled yet.</p>}
              {activities.map(a => (
                <div key={a.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>{a.host}</div>
                  {a.start_time && <div style={{ fontSize: 13, marginTop: 6 }}>{new Date(a.start_time).toLocaleString()}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONNECTIONS */}
      {activeNav === 'connections' && (
        <div style={{ padding: '0 16px' }}>
          <button onClick={startQrScanner} style={{ width: '100%', padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3', border: 'none', marginBottom: 16 }}>
            Scan to connect
          </button>

          {incomingHandshakes.map(req => (
            <div key={req.id} style={{ background: '#D4AF37', color: '#1C1C2E', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div>New handshake request</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => acceptHandshake(req)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none' }}>Accept</button>
                <button onClick={() => declineHandshake(req.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent' }}>Decline</button>
              </div>
            </div>
          ))}

          {incomingTier2Requests.map(req => (
            <div key={req.id} style={{ background: 'rgba(212,175,55,0.2)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div>Contact info requested</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => resolveTier2Request(req, true, true)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none' }}>Share all</button>
                <button onClick={() => resolveTier2Request(req, false, false)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent' }}>Decline</button>
              </div>
            </div>
          ))}

          {connections.filter(c => c.handshake_accepted).length === 0 && (
            <p style={{ opacity: 0.5 }}>No connections yet.</p>
          )}
          {connections.filter(c => c.handshake_accepted).map(c => (
            <div key={c.id} onClick={() => setSelectedConnection(c)}
              style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10, cursor: 'pointer' }}>
              <div style={{ fontWeight: 600 }}>{c.connected_profile_id}</div>
              {c.sticky_note && <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{c.sticky_note}</div>}
            </div>
          ))}

          {isScanning && (
            <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 60, display: 'flex', flexDirection: 'column' }}>
              <div id="scanner-viewport" style={{ flex: 1 }} />
              <button onClick={stopQrScanner} style={{ padding: 16, background: '#E26D34', color: '#fff', border: 'none' }}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* MY JOURNEY */}
      {activeNav === 'journey' && (
        <div style={{ padding: '0 16px' }}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>My Journey</h2>
          <p style={{ opacity: 0.5, fontSize: 13, marginBottom: 16 }}>A timeline of spaces, connections, and opportunities — this grows as you use Toruok Space.</p>
          {connections.length === 0 ? (
            <p style={{ opacity: 0.5 }}>Nothing yet — connect with someone to start your journey.</p>
          ) : (
            connections.map(c => (
              <div key={c.id} style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
                Connected with {c.connected_profile_id} {c.created_at ? `· ${new Date(c.created_at).toLocaleDateString()}` : ''}
              </div>
            ))
          )}
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', background: '#15151F', padding: '10px 0' }}>
        {(['discover', 'connections', 'journey'] as NavTab[]).map(tab => (
          <button key={tab} onClick={() => setActiveNav(tab)}
            style={{ flex: 1, background: 'none', border: 'none', color: activeNav === tab ? '#E26D34' : '#888', fontWeight: activeNav === tab ? 700 : 400 }}>
            {tab === 'discover' ? 'Discover' : tab === 'connections' ? 'Connections' : 'My Journey'}
          </button>
        ))}
      </div>

      {/* Intent modal (Need / Offer) */}
      {showIntentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 40 }}>
          <div style={{ background: '#1C1C2E', width: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Become visible</h3>
            <input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
            <input placeholder="Role" value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
            <input placeholder="Domain / field" value={domain} onChange={e => setDomain(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
            <input placeholder="What are you looking for? (need)" value={need} onChange={e => setNeed(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
            <input placeholder="What can you offer? (optional)" value={offer} onChange={e => setOffer(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
            <input placeholder="Where are you in the space?" value={selectedStation} onChange={e => setSelectedStation(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: 'none' }} />
            <button onClick={confirmVisibility} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Confirm</button>
          </div>
        </div>
      )}

      {/* Profile panel */}
      {showProfilePanel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 40 }}>
          <div style={{ background: '#1C1C2E', width: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Profile</h3>
            <input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
            <input placeholder="Role" value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
            <input placeholder="Domain" value={domain} onChange={e => setDomain(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
            <input placeholder="Phone" value={userPhone} onChange={e => setUserPhone(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
            <input placeholder="LinkedIn" value={userLinkedin} onChange={e => setUserLinkedin(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: 'none' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveProfileLocal} style={{ flex: 1, padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Save</button>
              <button onClick={() => setShowProfilePanel(false)} style={{ flex: 1, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3', border: 'none' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Connection detail */}
      {selectedConnection && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 40 }}
          onClick={() => setSelectedConnection(null)}>
          <div style={{ background: '#1C1C2E', width: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 }} onClick={e => e.stopPropagation()}>
            <textarea placeholder="Sticky note..." value={stickyNoteText} onChange={e => setStickyNoteText(e.target.value)}
              style={{ width: '100%', minHeight: 80, padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
            <button onClick={saveStickyNote} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', marginBottom: 8 }}>Save note</button>
            {!showTier2Options ? (
              <button onClick={() => setShowTier2Options(true)} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3', border: 'none' }}>Request contact info</button>
            ) : (
              <div>
                <label style={{ display: 'block', marginBottom: 6 }}><input type="checkbox" checked={reqPhoneCheckbox} onChange={e => setReqPhoneCheckbox(e.target.checked)} /> Phone</label>
                <label style={{ display: 'block', marginBottom: 6 }}><input type="checkbox" checked={reqLinkedinCheckbox} onChange={e => setReqLinkedinCheckbox(e.target.checked)} /> LinkedIn</label>
                <button onClick={submitTier2Request} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Send request</button>
              </div>
            )}
          </div>
        </div>
      )}

      <Analytics />
    </div>
  );
}

