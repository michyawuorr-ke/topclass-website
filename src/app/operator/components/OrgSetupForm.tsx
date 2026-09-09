import React from 'react';
import { inputStyle, labelStyle } from '../types';

interface OrgFormState { name: string; description: string; website: string; contact_email: string; contact_phone: string; email_domain: string; }

export function OrgSetupForm({ orgForm, setOrgForm, createOrg, creating, error }: {
  orgForm: OrgFormState; setOrgForm: (v: OrgFormState) => void; createOrg: () => void;
  creating?: boolean; error?: string;
}) {
  const fieldStyle: React.CSSProperties = { ...inputStyle, padding: '11px 12px', fontSize: 14, marginBottom: 14 };
  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', padding: '24px 20px', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Set up your organization</h1>
      <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 20 }}>Only the name is required — the rest helps participants and your approval move faster.</p>

      <label style={labelStyle}>Organization name *</label>
      <input value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="e.g. Boma University" style={fieldStyle} />

      <label style={labelStyle}>Description</label>
      <textarea value={orgForm.description} onChange={e => setOrgForm({ ...orgForm, description: e.target.value })} placeholder="What is this organization?" style={{ ...fieldStyle, minHeight: 70 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: -8, marginBottom: 16, lineHeight: 1.5 }}>
        Optional. If set, space admin and zone publisher invites can only be claimed by an account on this domain — leave blank if you don't need that restriction.
      </p>

      {error && (
        <div style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff8080', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      <button onClick={createOrg} disabled={creating} style={{ width: '100%', padding: 13, borderRadius: 8, background: creating ? 'rgba(226,109,52,0.5)' : '#E26D34', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: creating ? 'default' : 'pointer' }}>
        {creating ? 'Creating…' : 'Create'}
      </button>
    </div>
  );
}

