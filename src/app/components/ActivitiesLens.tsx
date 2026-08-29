import React from 'react';
import { ActivityItem } from '../types';

export function ActivitiesLens({ activities }: { activities: ActivityItem[] }) {
  return (
    <div>
      {activities.length === 0 && <p style={{ opacity: 0.5 }}>No activities scheduled yet.</p>}
      {activities.map(a => (
        <div key={a.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{a.title}</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>{a.host}</div>
          {a.start_time && <div style={{ fontSize: 13, marginTop: 6 }}>{new Date(a.start_time).toLocaleString()}</div>}
        </div>
      ))}
    </div>
  );
}

