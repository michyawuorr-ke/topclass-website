import React from 'react';
import { Opportunity } from '../types';

export function OpportunitiesLens({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <div>
      {opportunities.length === 0 && <p style={{ opacity: 0.5 }}>No opportunities posted yet.</p>}
      {opportunities.map(o => (
        <div key={o.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{o.title}</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>{o.type} · {o.provider}</div>
          {o.eligibility && <div style={{ fontSize: 13, marginTop: 6 }}>Eligibility: {o.eligibility}</div>}
          {o.deadline && <div style={{ fontSize: 13 }}>Deadline: {new Date(o.deadline).toLocaleDateString()}</div>}
        </div>
      ))}
    </div>
  );
}

