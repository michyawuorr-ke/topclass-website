import React from 'react';
import { inputStyle, labelStyle } from '../types';

interface OrgFormState { name: string; description: string; website: string; contact_email: string; contact_phone: string; email_domain: string; }

export function OrgSetupForm({ orgForm, setOrgForm, createOrg }: {
  orgForm: OrgFormState; setOrgForm: (v: OrgFormState) => void; createOrg: () => void;
}) {
  const fieldStyle: React.CSSProperties = { ...inputStyle, padding: '13px 14px', fontSize: 15, marginBottom: 16 };
  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', padding: '32px 24px', fontFamily: 'sans-serif', maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, marginBottom: 6 }}>Set up your organization</h1>
      <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 28 }}>Only the name is required — the rest helps participants and your approval move faster.</p>

      <label style={labelStyle}>Organization name *</label>
      <input value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="e.g. Boma University" style={fieldStyle} />

      <label style={labelStyle}>Description</label>
      <textarea value={orgForm.description} onChange={e => setOrgForm({ ...orgForm, description: e.target.value })} placeholder="What is this organization?" style={{ ...fieldStyle, minHeight: 90 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Contact email</label>
          <input value={orgForm.contact_email} onChange={e => setOrgForm({ ...orgForm, contact_email: e.target.value })} placeholder="admin@bomauniversity.ac.ke" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Contact phone</label>
          <input value={orgForm.contact_phone} onChange={e => setOrgForm({ ...orgForm, contact_phone: e.target.value })} placeholder="+254 7XX XXX XXX" style={fieldStyle} />
        </div>
      </div>

      <label style={labelStyle}>Website</label>
      <input value={orgForm.website} onChange={e => setOrgForm({ ...orgForm, website: e.target.value })} placeholder="https://www.bomauniversity.ac.ke" style={fieldStyle} />

      <label style={labelStyle}>Institutional email domain</label>
      <input value={orgForm.email_domain} onChange={e => setOrgForm({ ...orgForm, email_domain: e.target.value })} placeholder="e.g. bomauniversity.ac.ke" style={fieldStyle} />
      <p style={{ fontSize: 12, opacity: 0.5, marginTop: -10, marginBottom: 20, lineHeight: 1.6 }}>
        Optional. If set, space admin and zone publisher invites can only be claimed by an account on this domain — leave blank if you don't need that restriction.
      </p>

      <button onClick={createOrg} style={{ width: '100%', padding: 14, borderRadius: 10, background: '#E26D34', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Create</button>
    </div>
  );
}

