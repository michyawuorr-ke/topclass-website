import React from 'react';
import { Zone, inputStyle, labelStyle, zonePath } from '../types';

interface ZoneFormState { name: string; description: string; capacity: string; parent_zone_id: string; }

export function ZonesPanel({ zones, zoneForm, setZoneForm, addZone }: {
  zones: Zone[]; zoneForm: ZoneFormState; setZoneForm: (v: ZoneFormState) => void; addZone: () => void;
}) {
  return (
    <div>
      {zones.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12 }}>No rooms/zones added yet.</p>}
      {zones.map(z => (
        <div key={z.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{z.name}</div>
          {z.parent_zone_id && <div style={{ fontSize: 11, opacity: 0.5 }}>Inside: {zonePath(z.parent_zone_id, zones)}</div>}
          {z.capacity && <div style={{ fontSize: 12, opacity: 0.6 }}>Capacity: {z.capacity}</div>}
          {z.description && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{z.description}</div>}
        </div>
      ))}
      <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Add a room / zone</h2>
      <label style={labelStyle}>Name *</label>
      <input value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="e.g. Faculty of Science, Room 204, Maker Lab" style={inputStyle} />
      <label style={labelStyle}>Inside (optional)</label>
      <select value={zoneForm.parent_zone_id} onChange={e => setZoneForm({ ...zoneForm, parent_zone_id: e.target.value })} style={inputStyle}>
        <option value="">Top level (not inside another zone)</option>
        {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
      </select>
      <label style={labelStyle}>Capacity</label>
      <input value={zoneForm.capacity} onChange={e => setZoneForm({ ...zoneForm, capacity: e.target.value })} placeholder="e.g. 20 people" style={inputStyle} />
      <label style={labelStyle}>Description</label>
      <textarea value={zoneForm.description} onChange={e => setZoneForm({ ...zoneForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 50 }} />
      <button onClick={addZone} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Add room / zone</button>
    </div>
  );
}

