import React from 'react';

interface Stats {
  activePopulation: number;
  pendingApplications: number;
  upcomingActivities: number;
  connectionsCount: number;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, flex: '1 1 45%', minWidth: 120 }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export function HomePanel({ stats }: { stats: Stats }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        <StatCard label="Active right now" value={stats.activePopulation} />
        <StatCard label="Applications to review" value={stats.pendingApplications} />
        <StatCard label="Upcoming activities" value={stats.upcomingActivities} />
        <StatCard label="Connections made" value={stats.connectionsCount} />
      </div>
      {stats.pendingApplications > 0 && (
        <div style={{ marginTop: 16, fontSize: 13, opacity: 0.75, background: 'rgba(212,175,55,0.15)', padding: 12, borderRadius: 10 }}>
          {stats.pendingApplications} application{stats.pendingApplications === 1 ? '' : 's'} waiting on the Applications tab.
        </div>
      )}
    </div>
  );
}

