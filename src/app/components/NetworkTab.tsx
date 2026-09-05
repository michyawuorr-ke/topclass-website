import React, { useState } from 'react';
import { NetworkSub } from '../types';

const accent = '#E26D34';
const gold = '#D4AF37';
const teal = '#1D9E75';
const text = '#F0EBE1';
const muted = 'rgba(240,235,225,0.45)';
const border = 'rgba(255,255,255,0.08)';
const card = 'rgba(255,255,255,0.04)';

function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const i = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#D4AF37,#E26D34)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.33, color: '#fff',
    }}>{i}</div>
  );
}

export function NetworkTab({
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
  const [sub, setSub] = useState<NetworkSub>('connections');

  const accepted = connections.filter(c => c.handshake_accepted);
  const pending  = connections.filter(c => !c.handshake_accepted);
  const totalRequests = incomingHandshakes.length + incomingTier2Requests.length;

  // Journey events — built from connections
  const journeyEvents = [...accepted]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(c => ({
      id: c.id,
      type: 'connection',
      name: getNameFor(c.connected_profile_id),
      date: c.created_at,
      note: c.sticky_note,
    }));

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* Sub-tab row */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, padding: '0 16px' }}>
        {([
          { id: 'connections', label: `My Network${accepted.length > 0 ? ` (${accepted.length})` : ''}` },
          { id: 'requests', label: `Requests${totalRequests > 0 ? ` (${totalRequests})` : ''}` },
          { id: 'journey', label: 'Journey' },
        ] as { id: NetworkSub; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{
            flex: 1, padding: '14px 4px', background: 'none', border: 'none',
            borderBottom: `2px solid ${sub === t.id ? accent : 'transparent'}`,
            color: sub === t.id ? accent : muted,
            fontWeight: sub === t.id ? 700 : 400, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '16px 16px 16px' }}>

        {/* My Network */}
        {sub === 'connections' && (
          <>
            {accepted.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: muted }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🤝</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 6 }}>No connections yet</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>Go to Campus to find and connect with others.</div>
              </div>
            )}
            {accepted.map(c => {
              const name = getNameFor(c.connected_profile_id);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${border}` }}>
                  <Avatar name={name} size={44} />
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setSelectedConnection(c)}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
                    {c.sticky_note && (
                      <div style={{ fontSize: 12, color: muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.sticky_note}
                      </div>
                    )}
                  </div>
                  <button onClick={() => onMessageRequest(c.connected_profile_id, name)} style={{
                    padding: '7px 16px', borderRadius: 20,
                    border: `1px solid ${border}`, background: 'none',
                    color: text, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                  }}>Message</button>
                </div>
              );
            })}
          </>
        )}

        {/* Requests */}
        {sub === 'requests' && (
          <>
            {totalRequests === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: muted }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
                <div style={{ fontSize: 14 }}>No pending requests</div>
              </div>
            )}

            {incomingHandshakes.map(req => {
              const name = getNameFor(req.profile_id);
              return (
                <div key={req.id} style={{ background: `${gold}12`, border: `1px solid ${gold}30`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Avatar name={name} size={44} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
                      <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>wants to connect with you</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => acceptHandshake(req)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                      Accept
                    </button>
                    <button onClick={() => declineHandshake(req.id)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', color: text, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                      Ignore
                    </button>
                  </div>
                </div>
              );
            })}

            {incomingTier2Requests.map(req => {
              const name = getNameFor(req.profile_id);
              return (
                <div key={req.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{name} wants your contact info</div>
                  <div style={{ fontSize: 12, color: muted, marginBottom: 12 }}>Phone and LinkedIn</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => resolveTier2Request(req, true, true)} style={{ flex: 1, padding: '9px', borderRadius: 10, background: accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Share</button>
                    <button onClick={() => resolveTier2Request(req, false, false)} style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', color: text, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Decline</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Journey */}
        {sub === 'journey' && (
          <>
            {journeyEvents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: muted }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🗺️</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 6 }}>Your journey starts here</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>Connections, activities, and opportunities you engage with will build your campus timeline.</div>
              </div>
            )}

            {/* Timeline */}
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              {/* Vertical line */}
              {journeyEvents.length > 0 && (
                <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: `linear-gradient(180deg, ${accent}, ${gold})`, borderRadius: 1 }} />
              )}

              {journeyEvents.map((e, i) => (
                <div key={e.id} style={{ position: 'relative', marginBottom: 20 }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: -21, top: 6,
                    width: 10, height: 10, borderRadius: '50%',
                    background: accent, border: `2px solid #0A0A14`,
                  }} />
                  <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Connected with {e.name}</div>
                    {e.note && <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{e.note}</div>}
                    <div style={{ fontSize: 11, color: muted, marginTop: 6 }}>{new Date(e.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
