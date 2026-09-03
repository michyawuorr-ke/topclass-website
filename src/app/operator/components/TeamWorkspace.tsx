import React, { useState } from 'react';
import { Team, TeamLead, TeamOperator, Schedule, Announcement, Zone, Item, zonePath, inputStyle, labelStyle, DAYS_OF_WEEK } from '../types';
import { OpportunitiesPanel } from './OpportunitiesPanel';

type SubTab = 'overview' | 'schedule' | 'operators' | 'opportunities' | 'roster' | 'notices';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 };

export function TeamWorkspace({
  team, zones, canManage,
  leads, leadInviteEmail, setLeadInviteEmail, inviteLead,
  operators, operatorInviteEmail, setOperatorInviteEmail, inviteOperator,
  schedules, scheduleForm, setScheduleForm, addSchedule,
  opportunities, oppForm, setOppForm, addOpportunity, uploadingImage, onImageSelected,
  roster,
  announcements, annForm, setAnnForm, addAnnouncement,
}: {
  team: Team; zones: Zone[]; canManage: boolean;
  leads?: TeamLead[]; leadInviteEmail?: string; setLeadInviteEmail?: (v: string) => void; inviteLead?: () => void;
  operators: TeamOperator[]; operatorInviteEmail: string; setOperatorInviteEmail: (v: string) => void; inviteOperator: () => void;
  schedules: Schedule[]; scheduleForm: any; setScheduleForm: (v: any) => void; addSchedule: () => void;
  opportunities: Item[]; oppForm: any; setOppForm: (v: any) => void; addOpportunity: () => void; uploadingImage: boolean; onImageSelected: (f: File) => void;
  roster: any[];
  announcements: Announcement[]; annForm: { title: string; body: string }; setAnnForm: (v: { title: string; body: string }) => void; addAnnouncement: () => void;
}) {
  const [sub, setSub] = useState<SubTab>('overview');
  const subTabs: { id: SubTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'operators', label: 'Lecturers/TAs' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'roster', label: 'Roster' },
    { id: 'notices', label: 'Notices' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{
            padding: '6px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 12,
            background: sub === t.id ? '#E26D34' : 'rgba(255,255,255,0.08)',
            color: sub === t.id ? '#fff' : '#F5EFE3', fontWeight: sub === t.id ? 600 : 400,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'overview' && (
        <div>
          <div style={card}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{team.name}</div>
            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>{team.type === 'department' ? 'Department' : 'Crew'}</div>
            {team.primary_zone_id && <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>Home room: {zonePath(team.primary_zone_id, zones)}</div>}
            {team.description && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>{team.description}</div>}
          </div>
          {team.join_code && (
            <div style={{ ...card, borderColor: 'rgba(226,109,52,0.35)' }}>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>Lecturer/TA join code</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3 }}>{team.join_code}</div>
              <div style={{ fontSize: 11, opacity: 0.45, marginTop: 4 }}>Share this so operators can self-onboard instead of waiting on an email invite.</div>
            </div>
          )}
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>
            {schedules.length} scheduled unit{schedules.length === 1 ? '' : 's'} · {operators.length} operator{operators.length === 1 ? '' : 's'} · {opportunities.length} opportunit{opportunities.length === 1 ? 'y' : 'ies'} · {roster.length} present now
          </div>
        </div>
      )}

      {sub === 'schedule' && (
        <div>
          {schedules.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12 }}>No units scheduled yet.</p>}
          {schedules.map(s => (
            <div key={s.id} style={card}>
              <div style={{ fontWeight: 600 }}>{s.course_code ? `${s.course_code}: ` : ''}{s.course_name}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                {s.zone_id ? zonePath(s.zone_id, zones) : 'Room not set'}
                {s.day_of_week ? ` · ${s.day_of_week}` : ''}
                {s.start_time ? ` ${s.start_time}` : ''}{s.end_time ? `–${s.end_time}` : ''}
              </div>
            </div>
          ))}
          {canManage && (
            <>
              <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Add a unit / course</h2>
              <label style={labelStyle}>Course code</label>
              <input value={scheduleForm.course_code} onChange={e => setScheduleForm({ ...scheduleForm, course_code: e.target.value })} placeholder="e.g. SOC 201" style={inputStyle} />
              <label style={labelStyle}>Course name *</label>
              <input value={scheduleForm.course_name} onChange={e => setScheduleForm({ ...scheduleForm, course_name: e.target.value })} placeholder="e.g. Urban Sociology" style={inputStyle} />
              <label style={labelStyle}>Room</label>
              <select value={scheduleForm.zone_id} onChange={e => setScheduleForm({ ...scheduleForm, zone_id: e.target.value })} style={inputStyle}>
                <option value="">Not set</option>
                {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
              </select>
              <label style={labelStyle}>Day</label>
              <select value={scheduleForm.day_of_week} onChange={e => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })} style={inputStyle}>
                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Start</label>
                  <input type="time" value={scheduleForm.start_time} onChange={e => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>End</label>
                  <input type="time" value={scheduleForm.end_time} onChange={e => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <button onClick={addSchedule} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Add unit</button>
            </>
          )}
        </div>
      )}

      {sub === 'operators' && (
        <div>
          {leads !== undefined && (
            <>
              <h2 style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Head of Department</h2>
              {leads.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12, fontSize: 13 }}>None assigned yet.</p>}
              {leads.map(l => (
                <div key={l.id} style={card}>
                  <div style={{ fontWeight: 600 }}>{l.invite_email}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{l.user_id ? 'Active' : 'Invited — not yet signed in'}</div>
                </div>
              ))}
              {canManage && setLeadInviteEmail && inviteLead && (
                <>
                  <label style={labelStyle}>Email *</label>
                  <input value={leadInviteEmail} onChange={e => setLeadInviteEmail(e.target.value)} placeholder="hod@university.edu" style={inputStyle} />
                  <button onClick={inviteLead} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', marginBottom: 24 }}>Assign HOD</button>
                </>
              )}
            </>
          )}

          <h2 style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Lecturers &amp; TAs</h2>
          {operators.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12, fontSize: 13 }}>None yet.</p>}
          {operators.map(o => (
            <div key={o.id} style={card}>
              <div style={{ fontWeight: 600 }}>{o.invite_email || 'Joined via code'}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{o.user_id ? 'Active' : 'Invited — not yet signed in'}</div>
            </div>
          ))}
          <label style={labelStyle}>Email *</label>
          <input value={operatorInviteEmail} onChange={e => setOperatorInviteEmail(e.target.value)} placeholder="lecturer@university.edu" style={inputStyle} />
          <button onClick={inviteOperator} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Invite by email</button>
          <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>Or share the join code from Overview — they can self-onboard by entering it, no invite needed.</p>
        </div>
      )}

      {sub === 'opportunities' && (
        <OpportunitiesPanel opportunities={opportunities} oppForm={oppForm} setOppForm={setOppForm} addOpportunity={addOpportunity} zones={zones} uploadingImage={uploadingImage} onImageSelected={onImageSelected} />
      )}

      {sub === 'roster' && (
        <div>
          <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 12 }}>
            Live — people currently present in {team.primary_zone_id ? zonePath(team.primary_zone_id, zones) : 'this department\'s room'}.
          </p>
          {roster.length === 0 && <p style={{ opacity: 0.5 }}>Nobody present right now.</p>}
          {roster.map((p: any) => (
            <div key={p.id} style={card}>
              <div style={{ fontWeight: 600 }}>{p.profiles?.name || 'Unnamed'}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{p.profiles?.title || ''}{p.profiles?.title && p.profiles?.domain ? ' · ' : ''}{p.profiles?.domain || ''}</div>
            </div>
          ))}
        </div>
      )}

      {sub === 'notices' && (
        <div>
          {announcements.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12 }}>No announcements yet.</p>}
          {announcements.map(a => (
            <div key={a.id} style={card}>
              <div style={{ fontWeight: 600 }}>{a.title}</div>
              {a.body && <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{a.body}</div>}
              <div style={{ fontSize: 11, opacity: 0.4, marginTop: 6 }}>{new Date(a.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
          <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Post a notice</h2>
          <label style={labelStyle}>Title *</label>
          <input value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} placeholder="e.g. Midterm schedule change" style={inputStyle} />
          <label style={labelStyle}>Body</label>
          <textarea value={annForm.body} onChange={e => setAnnForm({ ...annForm, body: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} />
          <button onClick={addAnnouncement} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Post notice</button>
        </div>
      )}
    </div>
  );
}

