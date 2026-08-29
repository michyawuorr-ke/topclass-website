import React from 'react';

export function ConnectionsTab({
  connections, incomingHandshakes, incomingTier2Requests,
  acceptHandshake, declineHandshake, resolveTier2Request,
  setSelectedConnection, isScanning, startQrScanner, stopQrScanner,
}: {
  connections: any[]; incomingHandshakes: any[]; incomingTier2Requests: any[];
  acceptHandshake: (r: any) => void; declineHandshake: (id: string) => void;
  resolveTier2Request: (r: any, phone: boolean, linkedin: boolean) => void;
  setSelectedConnection: (c: any) => void; isScanning: boolean; startQrScanner: () => void; stopQrScanner: () => void;
}) {
  const accepted = connections.filter(c => c.handshake_accepted);
  return (
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

      {accepted.length === 0 && <p style={{ opacity: 0.5 }}>No connections yet.</p>}
      {accepted.map(c => (
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
  );
}

