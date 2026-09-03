import React from 'react';
import { Team, Zone, TEAM_TYPES, inputStyle, labelStyle, zonePath } from '../types';
import { TeamWorkspace } from './TeamWorkspace';

export function TeamsPanel({
  teams, teamForm, setTeamForm, addTeam, zones,
  activeTeam, setActiveTeamId, teamDetailProps,
}: {
  teams: Team[]; teamForm: any; setTeamForm: (v: any) => void; addTeam: () => void; zones: Zone[];
  activeTeam: Team | null; setActiveTeamId: (id: string | null) => void;
  teamDetailProps: any;
}) {
  if (activeTeam) {
    return (
      <div>
        <button onClick={() => setActiveTeamId(null)} style={{ background: 'none', border: 'none', color: '#E26D34', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
          ← All teams
        </button>
        <TeamWorkspace team={activeTeam} zones={zones} canManage {...teamDetailProps} />
      </div>
    );
  }

  return (
    <div>
      {teams.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12 }}>No departments or crews yet.</p>}
      {teams.map(t => (
        <div key={t.id} onClick={() => setActiveTeamId(t.id)}
          style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10, cursor: 'pointer' }}>
          <div style={{ fontWeight: 600 }}>{t.name}</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
            {t.type === 'department' ? 'Department' : 'Crew'}
            {t.primary_zone_id ? ` · ${zonePath(t.primary_zone_id, zones)}` : ''}
          </div>
        </div>
      ))}

      <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Create a department / crew</h2>
      <label style={labelStyle}>Name *</label>
      <input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} placeholder="e.g. Department of Sociology" style={inputStyle} />
      <label style={labelStyle}>Type</label>
      <select value={teamForm.type} onChange={e => setTeamForm({ ...teamForm, type: e.target.value })} style={inputStyle}>
        {TEAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <label style={labelStyle}>Home room (optional)</label>
      <select value={teamForm.primary_zone_id} onChange={e => setTeamForm({ ...teamForm, primary_zone_id: e.target.value })} style={inputStyle}>
        <option value="">Not set</option>
        {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
      </select>
      <label style={labelStyle}>Description</label>
      <textarea value={teamForm.description} onChange={e => setTeamForm({ ...teamForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 50 }} />
      <button onClick={addTeam} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Create</button>
    </div>
  );
}

