import React from 'react';
import { Item, Zone, inputStyle, labelStyle, zonePath } from '../types';

interface ActFormState {
  title: string; host: string; description: string; category: string; start_time: string; end_time: string;
  zone_id: string; capacity: string; registration_link: string; image_url: string;
}

export function ActivitiesPanel({ activities, actForm, setActForm, addActivity, zones, uploadingImage, onImageSelected }: {
  activities: Item[]; actForm: ActFormState; setActForm: (v: ActFormState) => void; addActivity: () => void; zones: Zone[];
  uploadingImage: boolean; onImageSelected: (file: File) => void;
}) {
  return (
    <div>
      {activities.map(a => (
        <div key={a.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{a.title}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{a.host}</div>
        </div>
      ))}
      <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Add an activity</h2>
      <label style={labelStyle}>Title *</label>
      <input value={actForm.title} onChange={e => setActForm({ ...actForm, title: e.target.value })} placeholder="e.g. Founder Meetup" style={inputStyle} />
      <label style={labelStyle}>Host</label>
      <input value={actForm.host} onChange={e => setActForm({ ...actForm, host: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>Description</label>
      <textarea value={actForm.description} onChange={e => setActForm({ ...actForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 50 }} />
      <label style={labelStyle}>Category</label>
      <input value={actForm.category} onChange={e => setActForm({ ...actForm, category: e.target.value })} placeholder="e.g. Workshop, Talk, Networking" style={inputStyle} />
      <label style={labelStyle}>Start time</label>
      <input type="datetime-local" value={actForm.start_time} onChange={e => setActForm({ ...actForm, start_time: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>End time</label>
      <input type="datetime-local" value={actForm.end_time} onChange={e => setActForm({ ...actForm, end_time: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>Room / zone (optional)</label>
      <select value={actForm.zone_id} onChange={e => setActForm({ ...actForm, zone_id: e.target.value })} style={inputStyle}>
        <option value="">Anywhere in this space</option>
        {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
      </select>
      <label style={labelStyle}>Capacity</label>
      <input value={actForm.capacity} onChange={e => setActForm({ ...actForm, capacity: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>Registration link</label>
      <input value={actForm.registration_link} onChange={e => setActForm({ ...actForm, registration_link: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>Image</label>
      {actForm.image_url && (
        <img src={actForm.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
      )}
      <input type="file" accept="image/*" disabled={uploadingImage}
        onChange={e => { const f = e.target.files?.[0]; if (f) onImageSelected(f); }}
        style={{ ...inputStyle, padding: 8 }} />
      {uploadingImage && <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>Uploading...</p>}
      <label style={labelStyle}>Or paste an image URL directly</label>
      <input value={actForm.image_url} onChange={e => setActForm({ ...actForm, image_url: e.target.value })} placeholder="https://..." style={inputStyle} />
      <button onClick={addActivity} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Add activity</button>
    </div>
  );
}

