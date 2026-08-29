import React from 'react';
import { Item, Zone, inputStyle, labelStyle, zonePath } from '../types';

interface ResFormState { name: string; owner: string; description: string; availability: string; capacity: string; zone_id: string; }

export function ResourcesPanel({ resources, resForm, setResForm, addResource, zones }: {
  resources: Item[]; resForm: ResFormState; setResForm: (v: ResFormState) => void; addResource: () => void; zones: Zone[];
}) {
  return (
    <div>
      {resources.map(r => (
        <div key={r.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{r.owner}</div>
        </div>
      ))}
      <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Add a resource</h2>
      <label style={labelStyle}>Name *</label>
      <input value={resForm.name} onChange={e => setResForm({ ...resForm, name: e.target.value })} placeholder="e.g. Meeting Room B, Projector" style={inputStyle} />
      <label style={labelStyle}>Owner / department</label>
      <input value={resForm.owner} onChange={e => setResForm({ ...resForm, owner: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>Description</label>
      <textarea value={resForm.description} onChange={e => setResForm({ ...resForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 50 }} />
      <label style={labelStyle}>Availability</label>
      <input value={resForm.availability} onChange={e => setResForm({ ...resForm, availability: e.target.value })} placeholder="e.g. Mon–Fri, 9am–5pm" style={inputStyle} />
      <label style={labelStyle}>Capacity</label>
      <input value={resForm.capacity} onChange={e => setResForm({ ...resForm, capacity: e.target.value })} placeholder="e.g. Seats 12" style={inputStyle} />
      <label style={labelStyle}>Room / zone (optional)</label>
      <select value={resForm.zone_id} onChange={e => setResForm({ ...resForm, zone_id: e.target.value })} style={inputStyle}>
        <option value="">Anywhere in this space</option>
        {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
      </select>
      <button onClick={addResource} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Add resource</button>
    </div>
  );
}

