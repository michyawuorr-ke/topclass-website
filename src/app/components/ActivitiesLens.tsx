import React from 'react';
import { ActivityItem } from '../types';

function DetailRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13, marginTop: 4 }}>
      <span>{icon}</span>
      <span><strong>{label}:</strong> {value}</span>
    </div>
  );
}

function formatRange(start?: string, end?: string): string | undefined {
  if (!start) return undefined;
  const s = new Date(start);
  const startStr = s.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  if (!end) return startStr;
  const e = new Date(end);
  const endStr = e.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${startStr} – ${endStr}`;
}

export function ActivitiesLens({ activities }: { activities: ActivityItem[] }) {
  return (
    <div>
      {activities.length === 0 && <p style={{ opacity: 0.5 }}>No activities scheduled yet.</p>}
      {activities.map(a => (
        <div key={a.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 14, overflow: 'hidden' }}>
          {a.image_url && <img src={a.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />}
          <div style={{ padding: 16 }}>
            {a.category && (
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, padding: '3px 10px', borderRadius: 20, background: '#4A90D9', color: '#1C1C2E' }}>
                {a.category.toUpperCase()}
              </span>
            )}
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 8 }}>{a.title}</div>
            {a.host && <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>Hosted by {a.host}</div>}
            {a.description && <p style={{ fontSize: 13, marginTop: 10, opacity: 0.9, lineHeight: 1.5 }}>{a.description}</p>}

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <DetailRow icon="🗓️" label="When" value={formatRange(a.start_time, a.end_time)} />
              <DetailRow icon="📍" label="Location" value={a.zones?.name} />
              <DetailRow icon="👥" label="Capacity" value={a.capacity} />
            </div>

            {a.registration_link && (
              <a href={a.registration_link} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', textAlign: 'center', marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#E26D34', color: '#fff', fontWeight: 600, textDecoration: 'none' }}>
                Register
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

