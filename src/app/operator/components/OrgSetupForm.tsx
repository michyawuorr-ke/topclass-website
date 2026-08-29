import React from 'react';
import { inputStyle, labelStyle } from '../types';

interface OrgFormState { name: string; description: string; website: string; contact_email: string; contact_phone: string; }

export function OrgSetupForm({ orgForm, setOrgForm, createOrg }: {
  orgForm: OrgFormState; setOrgForm: (v: OrgFormState) => void; createOrg: () => void;
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', padding: 24, fontFamily: 'sans-serif', maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Set up your organization</h1>
      <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 16 }}>Only the name is required — the rest helps participants and your approval move faster.</p>
      <label style={labelStyle}>Organization name *</label>
      <input value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="e.g. Faculty of Science" style={inputStyle} />
      <label style={labelStyle}>Description</label>
      <textarea value={orgForm.description} onChange={e => setOrgForm({ ...orgForm, description: e.target.value })} placeholder="What is this organization?" style={{ ...inputStyle, minHeight: 60 }} />
      <label style={labelStyle}>Website</label>
      <input value={orgForm.website} onChange={e => setOrgForm({ ...orgForm, website: e.target.value })} placeholder="https://..." style={inputStyle} />
      <label style={labelStyle}>Contact email</label>
      <input value={orgForm.contact_email} onChange={e => setOrgForm({ ...orgForm, contact_email: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>Contact phone</label>
      <input value={orgForm.contact_phone} onChange={e => setOrgForm({ ...orgForm, contact_phone: e.target.value })} style={inputStyle} />
      <button onClick={createOrg} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', marginTop: 4 }}>Create</button>
    </div>
  );
}

