import React from 'react';

export function JourneyTab({ connections }: { connections: any[] }) {
  return (
    <div style={{ padding: '0 16px' }}>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>My Journey</h2>
      <p style={{ opacity: 0.5, fontSize: 13, marginBottom: 16 }}>A timeline of spaces, connections, and opportunities — this grows as you use Toruok Space.</p>
      {connections.length === 0 ? (
        <p style={{ opacity: 0.5 }}>Nothing yet — connect with someone to start your journey.</p>
      ) : (
        connections.map(c => (
          <div key={c.id} style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
            Connected with {c.connected_profile_id} {c.created_at ? `· ${new Date(c.created_at).toLocaleDateString()}` : ''}
          </div>
        ))
      )}
    </div>
  );
}

