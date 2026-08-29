import React from 'react';

export function IntentModal({
  fullName, setFullName, role, setRole, domain, setDomain,
  need, setNeed, offer, setOffer, selectedStation, setSelectedStation,
  confirmVisibility,
}: {
  fullName: string; setFullName: (v: string) => void;
  role: string; setRole: (v: string) => void;
  domain: string; setDomain: (v: string) => void;
  need: string; setNeed: (v: string) => void;
  offer: string; setOffer: (v: string) => void;
  selectedStation: string; setSelectedStation: (v: string) => void;
  confirmVisibility: () => void;
}) {
  return (
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
  );
}

