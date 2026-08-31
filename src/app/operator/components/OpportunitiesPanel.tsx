import React from 'react';
import { Item, Zone, OPPORTUNITY_TYPES, inputStyle, labelStyle, zonePath } from '../types';

interface OppFormState {
  title: string; type: string; provider: string; description: string; eligibility: string;
  compensation: string; deadline: string; application_method: string; zone_id: string; location: string; status: string;
  image_url: string;
}

export function OpportunitiesPanel({ opportunities, oppForm, setOppForm, addOpportunity, zones, uploadingImage, onImageSelected }: {
  opportunities: Item[]; oppForm: OppFormState; setOppForm: (v: OppFormState) => void; addOpportunity: () => void; zones: Zone[];
  uploadingImage: boolean; onImageSelected: (file: File) => void;
}) {
  return (
    <div>
      {opportunities.map(o => (
        <div key={o.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{o.title}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{o.type} · {o.provider}</div>
        </div>
      ))}
      <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Add an opportunity</h2>
      <label style={labelStyle}>Title *</label>
      <input value={oppForm.title} onChange={e => setOppForm({ ...oppForm, title: e.target.value })} placeholder="e.g. Merit Scholarship 2027" style={inputStyle} />
      <label style={labelStyle}>Type</label>
      <select value={oppForm.type} onChange={e => setOppForm({ ...oppForm, type: e.target.value })} style={inputStyle}>
        {OPPORTUNITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <label style={labelStyle}>Provider</label>
      <input value={oppForm.provider} onChange={e => setOppForm({ ...oppForm, provider: e.target.value })} placeholder="Who's offering this?" style={inputStyle} />
      <label style={labelStyle}>Description</label>
      <textarea value={oppForm.description} onChange={e => setOppForm({ ...oppForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} />
      <label style={labelStyle}>Eligibility</label>
      <textarea value={oppForm.eligibility} onChange={e => setOppForm({ ...oppForm, eligibility: e.target.value })} placeholder="Who can apply?" style={{ ...inputStyle, minHeight: 50 }} />
      <label style={labelStyle}>Compensation / value</label>
      <input value={oppForm.compensation} onChange={e => setOppForm({ ...oppForm, compensation: e.target.value })} placeholder="e.g. Ksh 30,000/month, or Unpaid" style={inputStyle} />
      <label style={labelStyle}>Deadline</label>
      <input type="date" value={oppForm.deadline} onChange={e => setOppForm({ ...oppForm, deadline: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>How to apply</label>
      <input value={oppForm.application_method} onChange={e => setOppForm({ ...oppForm, application_method: e.target.value })} placeholder="Link, email, or in-person instructions" style={inputStyle} />
      <label style={labelStyle}>Room / zone (optional)</label>
      <select value={oppForm.zone_id} onChange={e => setOppForm({ ...oppForm, zone_id: e.target.value })} style={inputStyle}>
        <option value="">Anywhere in this space</option>
        {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
      </select>
      <label style={labelStyle}>Location (if off-site / remote)</label>
      <input value={oppForm.location} onChange={e => setOppForm({ ...oppForm, location: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>Image</label>
      {oppForm.image_url && (
        <img src={oppForm.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
      )}
      <input type="file" accept="image/*" disabled={uploadingImage}
        onChange={e => { const f = e.target.files?.[0]; if (f) onImageSelected(f); }}
        style={{ ...inputStyle, padding: 8 }} />
      {uploadingImage && <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>Uploading...</p>}
      <label style={labelStyle}>Or paste an image URL directly</label>
      <input value={oppForm.image_url} onChange={e => setOppForm({ ...oppForm, image_url: e.target.value })} placeholder="https://..." style={inputStyle} />
      <button onClick={addOpportunity} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Add opportunity</button>
    </div>
  );
}

