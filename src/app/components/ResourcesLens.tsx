import React from 'react';
import { ResourceItem } from '../types';

function DetailRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13, marginTop: 4 }}>
      <span>{icon}</span>
      <span><strong>{label}:</strong> {value}</span>
    </div>
  );
}

export function ResourcesLens({ resources }: { resources: ResourceItem[] }) {
  return (
    <div>
      {resources.length === 0 && <p style={{ opacity: 0.5 }}>No resources listed yet.</p>}
      {resources.map(r => (
        <div key={r.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 14, overflow: 'hidden' }}>
          {r.image_url && <img src={r.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />}
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{r.name}</div>
            {r.owner && <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{r.owner}</div>}
            {r.description && <p style={{ fontSize: 13, marginTop: 10, opacity: 0.9, lineHeight: 1.5 }}>{r.description}</p>}

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <DetailRow icon="📍" label="Location" value={r.zones?.name} />
              <DetailRow icon="🕐" label="Availability" value={r.availability} />
              <DetailRow icon="👥" label="Capacity" value={r.capacity} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

