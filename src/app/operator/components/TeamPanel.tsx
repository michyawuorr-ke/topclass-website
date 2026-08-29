import React, { useState } from 'react';
import { Member, inputStyle, labelStyle } from '../types';

export function TeamPanel({ members, inviteEmail, setInviteEmail, inviteRole, setInviteRole, inviteMember }: {
  members: Member[]; inviteEmail: string; setInviteEmail: (v: string) => void;
  inviteRole: string; setInviteRole: (v: string) => void; inviteMember: () => void;
}) {
  return (
    <div>
      <h2 style={{ fontSize: 14, opacity: 0.6, marginBottom: 10 }}>Team</h2>
      {members.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12 }}>Just you so far.</p>}
      {members.map(m => (
        <div key={m.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{m.invite_email}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{m.role} · {m.user_id ? 'Active' : 'Invited — not yet signed in'}</div>
        </div>
      ))}
      <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Invite a teammate</h2>
      <label style={labelStyle}>Email *</label>
      <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="teammate@organization.com" style={inputStyle} />
      <label style={labelStyle}>Role</label>
      <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={inputStyle}>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={inviteMember} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Send invite</button>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>They'll get access automatically the first time they sign in at /operator with this email.</p>
    </div>
  );
}

