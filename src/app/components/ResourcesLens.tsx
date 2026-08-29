import React from 'react';
import { ResourceItem } from '../types';

export function ResourcesLens({ resources }: { resources: ResourceItem[] }) {
  return (
    <div>
      {resources.length === 0 && <p style={{ opacity: 0.5 }}>No resources listed yet.</p>}
      {resources.map(r => (
        <div key={r.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>{r.owner}</div>
          {r.availability && <div style={{ fontSize: 13, marginTop: 6 }}>Availability: {r.availability}</div>}
        </div>
      ))}
    </div>
  );
}

