import React from 'react';

const accent = '#E26D34';
const gold = '#D4AF37';
const text = '#F0EBE1';
const muted = 'rgba(240,235,225,0.45)';
const border = 'rgba(255,255,255,0.08)';
const cardBg = 'rgba(255,255,255,0.04)';

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #D4AF37, #E26D34)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, color: '#fff',
    }}>{initials}</div>
  );
}

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
  const pending  = connections.filter(c => !c.handshake_accepted);

  return (
    <div style={{ padding: '16px 16px 0' }}>

      {/* Incoming handshakes */}
      {incomingHandshakes.map(req => {
        const name = getNameFor(req.profile_id);
        return (
          <div key={req.id} style={{ background: `${gold}15`, border: `1px solid ${gold}40`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>wants to connect</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => acceptHandshake(req)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                Accept
              </button>
              <button onClick={() => declineHandshake(req.id)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', color: text, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                Ignore
              </button>
            </div>
          </div>
        );
      })}

      {/* Contact share requests */}
      {incomingTier2Requests.map(req => {
        const name = getNameFor(req.profile_id);
        return (
          <div key={req.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{name} requested your contact info</div>
            <div style={{ fontSize: 12, color: muted, marginBottom: 12 }}>Phone and LinkedIn</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => resolveTier2Request(req, true, true)} style={{ flex: 1, padding: '9px', borderRadius: 10, background: accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                Share
              </button>
              <button onClick={() => resolveTier2Request(req, false, false)} style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', color: text, border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Decline
              </button>
            </div>
          </div>
        );
      })}

      {/* Section header */}
      {accepted.length > 0 && (
        <div style={{ fontSize: 12, color: muted, marginBottom: 12, fontWeight: 600 }}>
          {accepted.length} connection{accepted.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Empty */}
      {accepted.length === 0 && incomingHandshakes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: muted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤝</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 6 }}>No connections yet</div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>Tap someone on Discover to send a connection request.</div>
        </div>
      )}

      {/* Connection list — LinkedIn-style */}
      {accepted.map(c => {
        const name = getNameFor(c.connected_profile_id);
        return (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${border}` }}>
            <Avatar name={name} />
            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setSelectedConnection(c)}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
              {c.sticky_note && (
                <div style={{ fontSize: 12, color: muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.sticky_note}
                </div>
              )}
            </div>
            <button
              onClick={() => onMessageRequest(c.connected_profile_id, name)}
              style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${border}`, background: 'none', color: text, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}
            >
              Message
            </button>
          </div>
        );
      })}
    </div>
  );
}
