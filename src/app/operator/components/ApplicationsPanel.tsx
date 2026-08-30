import React from 'react';
import { Application } from '../types';

const STATUS_OPTIONS = ['applied', 'shortlisted', 'accepted', 'rejected'];

export function ApplicationsPanel({ applications, updateApplicationStatus }: {
  applications: Application[]; updateApplicationStatus: (id: string, status: string) => void;
}) {
  return (
    <div>
      {applications.length === 0 && <p style={{ opacity: 0.5 }}>No applications yet.</p>}
      {applications.map(a => (
        <div key={a.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontSize: 11, opacity: 0.5 }}>{a.opportunities?.title || 'Opportunity'}</div>
          <div style={{ fontWeight: 600, marginTop: 2 }}>{a.profiles?.name || 'Applicant'}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{a.profiles?.title} · {a.profiles?.domain}</div>
          {a.note && <div style={{ fontSize: 13, marginTop: 6, opacity: 0.85 }}>{a.note}</div>}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
            <select value={a.status} onChange={e => updateApplicationStatus(a.id, e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, border: 'none' }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

