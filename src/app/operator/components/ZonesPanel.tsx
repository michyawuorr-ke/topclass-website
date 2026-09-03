import React, { useState } from 'react';
import { Zone, inputStyle, labelStyle, zonePath, roomQrPayload, qrImageUrl } from '../types';

interface ZoneFormState { name: string; description: string; capacity: string; parent_zone_id: string; building_tag: string; }

export function ZonesPanel({ zones, zoneForm, setZoneForm, addZone, spaceId }: {
  zones: Zone[]; zoneForm: ZoneFormState; setZoneForm: (v: ZoneFormState) => void; addZone: () => void; spaceId: string;
}) {
  const [qrFor, setQrFor] = useState<string | null>(null);

  return (
    <div>
      {zones.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12 }}>No rooms/zones added yet.</p>}
      {zones.map(z => (
        <div key={z.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{z.name}</div>
              {z.building_tag && <div style={{ fontSize: 11, opacity: 0.5 }}>{z.building_tag}</div>}
              {z.parent_zone_id && <div style={{ fontSize: 11, opacity: 0.5 }}>Inside: {zonePath(z.parent_zone_id, zones)}</div>}
              {z.capacity && <div style={{ fontSize: 12, opacity: 0.6 }}>Capacity: {z.capacity}</div>}
              {z.description && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{z.description}</div>}
            </div>
            <button onClick={() => setQrFor(qrFor === z.id ? null : z.id)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'none', color: '#F5EFE3', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
              {qrFor === z.id ? 'Hide QR' : 'Door QR'}
            </button>
          </div>
          {qrFor === z.id && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <img src={qrImageUrl(roomQrPayload(spaceId, z.id))} alt={`QR code for ${z.name}`} style={{ width: 180, height: 180, borderRadius: 8, background: '#fff', padding: 8 }} />
              <div style={{ fontSize: 11, opacity: 0.45, marginTop: 8 }}>Print and mount at the door for check-in.</div>
              <a href={qrImageUrl(roomQrPayload(spaceId, z.id), 600)} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#E26D34' }}>
                Open full-size to print →
              </a>
            </div>
          )}
        </div>
      ))}
      <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Add a room / zone</h2>
      <label style={labelStyle}>Name *</label>
      <input value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="e.g. Classroom L5, Lecture Hall B, Lab 302" style={inputStyle} />
      <label style={labelStyle}>Building tag</label>
      <input value={zoneForm.building_tag} onChange={e => setZoneForm({ ...zoneForm, building_tag: e.target.value })} placeholder="e.g. Chiromo Campus, Block C" style={inputStyle} />
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

