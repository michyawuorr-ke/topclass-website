import React from 'react';

export interface Stat { label: string; value: number | string; sub?: string; accent?: boolean; }

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: s.accent ? 'rgba(226,109,52,0.12)' : 'rgba(255,255,255,0.05)',
          border: s.accent ? '1px solid rgba(226,109,52,0.3)' : '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '16px 18px',
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: s.accent ? '#E26D34' : '#F5EFE3' }}>{s.value}</div>
          <div style={{ fontSize: 12, opacity: 0.55, marginTop: 6 }}>{s.label}</div>
          {s.sub && <div style={{ fontSize: 11, opacity: 0.4, marginTop: 2 }}>{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}
