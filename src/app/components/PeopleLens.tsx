import React from 'react';
import { Presence } from '../types';

export function PeopleLens({ presentPeople, profileId, throttled, triggerHandshake }: {
  presentPeople: Presence[]; profileId: string; throttled: Record<string, boolean>; triggerHandshake: (p: Presence) => void;
}) {
  const others = presentPeople.filter(p => p.profile_id !== profileId);
  return (
    <div>
      {others.length === 0 && <p style={{ opacity: 0.5 }}>No one else visible here yet.</p>}
      {others.map(p => (
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
  );
}

