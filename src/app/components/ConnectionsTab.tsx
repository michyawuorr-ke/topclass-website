import React from 'react';

export function ConnectionsTab({
  connections, incomingHandshakes, incomingTier2Requests,
  acceptHandshake, declineHandshake, resolveTier2Request,
  setSelectedConnection, onMessageRequest, getNameFor,
}: {
  connections: any[]; incomingHandshakes: any[]; incomingTier2Requests: any[];
  acceptHandshake: (r: any) => void; declineHandshake: (id: string) => void;
  resolveTier2Request: (r: any, phone: boolean, linkedin: boolean) => void;
  setSelectedConnection: (c: any) => void;
  onMessageRequest: (recipientId: string, name: string) => void;
  getNameFor: (id: string) => string;
}) {
  const accepted = connections.filter(c => c.handshake_accepted);

  return (
    <div style={{ padding: '0 16px' }}>
      {incomingHandshakes.map(req => (
        <div key={req.id} style={{ background: '#D4AF37', color: '#1C1C2E', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>New handshake request</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => acceptHandshake(req)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Accept</button>
            <button onClick={() => declineHandshake(req.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#1C1C2E', cursor: 'pointer' }}>Decline</button>
          </div>
        </div>
      ))}

      {incomingTier2Requests.map(req => (
        <div key={req.id} style={{ background: 'rgba(212,175,55,0.2)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ color: '#F5EFE3', fontWeight: 500 }}>Contact info requested by {getNameFor(req.profile_id)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => resolveTier2Request(req, true, true)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Share all</button>
            <button onClick={() => resolveTier2Request(req, false, false)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#F5EFE3', cursor: 'pointer' }}>Decline</button>
          </div>
        </div>
      ))}

      {accepted.length === 0 && (
        <p style={{ opacity: 0.45, fontSize: 14, marginTop: 24, textAlign: 'center' }}>
          No connections yet.<br />Tap someone on Discover to send a handshake.
        </p>
      )}

      {accepted.map(c => (
        <div key={c.id} style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px',
          marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 20, background: '#D4AF37', color: '#1C1C2E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 16, flexShrink: 0,
          }}>
            {getNameFor(c.connected_profile_id)[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setSelectedConnection(c)}>
            <div style={{ fontWeight: 600, color: '#F5EFE3' }}>{getNameFor(c.connected_profile_id)}</div>
            {c.sticky_note && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sticky_note}</div>}
          </div>
          <button onClick={() => onMessageRequest(c.connected_profile_id, getNameFor(c.connected_profile_id))}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 8, color: '#F5EFE3', padding: '6px 10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, flexShrink: 0,
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Message
          </button>
        </div>
      ))}
    </div>
  );
}
