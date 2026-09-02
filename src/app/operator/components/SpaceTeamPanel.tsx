import React from 'react';
import { SpaceAdmin, ZonePublisher, AccessRequest, Zone, inputStyle, labelStyle, zonePath } from '../types';

export function SpaceTeamPanel({
  spaceAdmins, spaceAdminInviteEmail, setSpaceAdminInviteEmail, inviteSpaceAdmin,
  zonePublishers, zonePublisherInviteEmail, setZonePublisherInviteEmail,
  zonePublisherZoneId, setZonePublisherZoneId, inviteZonePublisher, zones,
  pendingRequests, approveRequest, denyRequest,
}: {
  spaceAdmins: SpaceAdmin[]; spaceAdminInviteEmail: string; setSpaceAdminInviteEmail: (v: string) => void; inviteSpaceAdmin: () => void;
  zonePublishers: ZonePublisher[]; zonePublisherInviteEmail: string; setZonePublisherInviteEmail: (v: string) => void;
  zonePublisherZoneId: string; setZonePublisherZoneId: (v: string) => void; inviteZonePublisher: () => void; zones: Zone[];
  pendingRequests: AccessRequest[]; approveRequest: (id: string) => void; denyRequest: (id: string) => void;
}) {
  return (
    <div>
      {pendingRequests.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Pending Requests</h2>
          <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>
            Self-declared — nobody invited these people, they asked for access with a verified sign-in. Review before approving.
          </p>
          {pendingRequests.map(r => (
            <div key={r.id} style={{ background: 'rgba(226,109,52,0.12)', border: '1px solid rgba(226,109,52,0.4)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>{r.requester_email}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                Requesting {r.space_id ? 'Space Admin' : `Zone Publisher — ${zonePath(r.zone_id, zones) || 'zone'}`}
              </div>
              {r.note && <div style={{ fontSize: 12, opacity: 0.6, fontStyle: 'italic', marginBottom: 8 }}>"{r.note}"</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => approveRequest(r.id)} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Approve</button>
                <button onClick={() => denyRequest(r.id)} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3', border: 'none' }}>Deny</button>
              </div>
            </div>
          ))}
        </>
      )}

      <h2 style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Space Admins</h2>
      <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>
        Full control over this space and its zones — deans, heads of department.
      </p>
      {spaceAdmins.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12 }}>None yet.</p>}
      {spaceAdmins.map(a => (
        <div key={a.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{a.invite_email}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{a.user_id ? 'Active' : 'Invited — not yet signed in'}</div>
        </div>
      ))}
      <label style={labelStyle}>Email *</label>
      <input value={spaceAdminInviteEmail} onChange={e => setSpaceAdminInviteEmail(e.target.value)} placeholder="dean@university.edu" style={inputStyle} />
      <button onClick={inviteSpaceAdmin} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', marginBottom: 28 }}>
        Add space admin
      </button>

      <h2 style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Zone Publishers</h2>
      <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>
        Can post opportunities, resources, and activities into one zone only — professors, lab leads, student coordinators.
      </p>
      {zonePublishers.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12 }}>None yet.</p>}
      {zonePublishers.map(p => (
        <div key={p.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{p.invite_email}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            {zonePath(p.zone_id, zones) || 'Unknown zone'} · {p.user_id ? 'Active' : 'Invited — not yet signed in'}
          </div>
        </div>
      ))}
      <label style={labelStyle}>Email *</label>
      <input value={zonePublisherInviteEmail} onChange={e => setZonePublisherInviteEmail(e.target.value)} placeholder="professor@university.edu" style={inputStyle} />
      <label style={labelStyle}>Zone *</label>
      <select value={zonePublisherZoneId} onChange={e => setZonePublisherZoneId(e.target.value)} style={inputStyle}>
        <option value="">Select a zone...</option>
        {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
      </select>
      <button onClick={inviteZonePublisher} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>
        Add zone publisher
      </button>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>They'll get access automatically the first time they sign in at /operator with this email.</p>
    </div>
  );
}
