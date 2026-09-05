import React, { useState } from 'react';
import { Lens, Opportunity, ActivityItem, Announcement, ScheduleEntry } from '../types';

const accent = '#E26D34';
const gold = '#D4AF37';
const teal = '#1D9E75';
const text = '#F0EBE1';
const muted = 'rgba(240,235,225,0.45)';
const border = 'rgba(255,255,255,0.08)';
const card = 'rgba(255,255,255,0.04)';

function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const i = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#D4AF37,#E26D34)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, color: '#fff',
    }}>{i}</div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      background: color + '22', border: `1px solid ${color}44`,
      color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
    }}>{label}</span>
  );
}

function ScheduleCard({ entry }: { entry: ScheduleEntry }) {
  return (
    <div style={{ background: `${teal}12`, border: `1px solid ${teal}30`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{entry.course_name}</div>
          {entry.course_code && <div style={{ fontSize: 11, color: teal, marginTop: 2 }}>{entry.course_code}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: teal }}>{entry.start_time}–{entry.end_time}</div>
          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{entry.day_of_week}</div>
        </div>
      </div>
      {(entry.zone || entry.team) && (
        <div style={{ fontSize: 12, color: muted, marginTop: 8 }}>
          {entry.zone?.name && `📍 ${entry.zone.name}`}{entry.zone && entry.team ? ' · ' : ''}{entry.team?.name}
        </div>
      )}
    </div>
  );
}

function OppCard({ opp, applied, onApply }: { opp: Opportunity; applied: boolean; onApply: (id: string, note: string) => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
      {opp.image_url && <img src={opp.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} />}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Pill label={opp.type} color={gold} />
          {opp.deadline && <span style={{ fontSize: 11, color: muted }}>Due {new Date(opp.deadline).toLocaleDateString()}</span>}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{opp.title}</div>
        {opp.provider && <div style={{ fontSize: 13, color: muted, marginBottom: 6 }}>{opp.provider}</div>}
        {opp.description && <div style={{ fontSize: 13, color: muted, lineHeight: 1.6, marginBottom: 10 }}>{opp.description}</div>}
        {applied ? (
          <div style={{ color: teal, fontSize: 13, fontWeight: 600 }}>✓ Applied</div>
        ) : (
          <>
            {open ? (
              <>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Short note (optional)…"
                  style={{ width: '100%', minHeight: 60, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, color: text, fontSize: 13, resize: 'none', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { onApply(opp.id, note); setOpen(false); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, background: accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                    Apply
                  </button>
                  <button onClick={() => setOpen(false)}
                    style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', color: text, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => setOpen(true)}
                style={{ padding: '9px 20px', borderRadius: 10, background: 'rgba(226,109,52,0.15)', border: `1px solid ${accent}44`, color: accent, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                Apply now
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ActCard({ act }: { act: ActivityItem }) {
  const start = act.start_time ? new Date(act.start_time) : null;
  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
      {act.image_url && <img src={act.image_url} alt="" style={{ width: '100%', height: 130, objectFit: 'cover' }} />}
      <div style={{ padding: '14px 16px' }}>
        {act.category && <Pill label={act.category} color="#8A6DE2" />}
        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 8, marginBottom: 4 }}>{act.title}</div>
        {act.host && <div style={{ fontSize: 13, color: muted, marginBottom: 4 }}>by {act.host}</div>}
        {start && (
          <div style={{ fontSize: 12, color: muted, marginBottom: 8 }}>
            {start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {act.description && <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>{act.description}</div>}
        {act.registration_link && (
          <a href={act.registration_link} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 10, padding: '8px 18px', borderRadius: 10, background: 'rgba(138,109,226,0.15)', border: '1px solid rgba(138,109,226,0.3)', color: '#8A6DE2', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>
            Register
          </a>
        )}
      </div>
    </div>
  );
}

function NoticeCard({ ann }: { ann: Announcement }) {
  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
      {ann.team && <div style={{ fontSize: 11, color: accent, fontWeight: 600, marginBottom: 6 }}>{ann.team.name}</div>}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: ann.body ? 6 : 0 }}>{ann.title}</div>
      {ann.body && <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>{ann.body}</div>}
      <div style={{ fontSize: 11, color: muted, marginTop: 8 }}>{new Date(ann.created_at).toLocaleDateString()}</div>
    </div>
  );
}

export function HomeTab({
  fullName, todaySchedule, opportunities, activities, announcements,
  appliedOpportunityIds, applyToOpportunity,
}: {
  fullName: string;
  todaySchedule: ScheduleEntry[];
  opportunities: Opportunity[];
  activities: ActivityItem[];
  announcements: Announcement[];
  appliedOpportunityIds: Set<string>;
  applyToOpportunity: (id: string, note: string) => void;
}) {
  const [lens, setLens] = useState<Lens>('all');
  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = fullName.split(' ')[0] || 'there';

  return (
    <div style={{ padding: '0 16px 16px', fontFamily: '"Inter", system-ui, sans-serif' }}>
      {/* Greeting */}
      <div style={{ padding: '20px 0 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{greeting}, {firstName} 👋</div>
        <div style={{ fontSize: 13, color: muted, marginTop: 3 }}>{today}</div>
      </div>

      {/* Today's classes */}
      {todaySchedule.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: muted, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>TODAY'S CLASSES</div>
          {todaySchedule.map(s => <ScheduleCard key={s.id} entry={s} />)}
        </>
      )}

      {/* Feed filter pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 16px', scrollbarWidth: 'none' }}>
        {(['all', 'opportunities', 'activities', 'notices'] as Lens[]).map(l => (
          <button key={l} onClick={() => setLens(l)} style={{
            padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 13,
            background: lens === l ? accent : 'rgba(255,255,255,0.08)',
            color: lens === l ? '#fff' : text,
            fontWeight: lens === l ? 600 : 400,
          }}>
            {l === 'all' ? 'All' : l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>

      {/* Opportunities */}
      {(lens === 'all' || lens === 'opportunities') && opportunities.length > 0 && (
        <>
          {lens === 'all' && <div style={{ fontSize: 12, color: muted, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>OPPORTUNITIES</div>}
          {opportunities.map(o => (
            <OppCard key={o.id} opp={o} applied={appliedOpportunityIds.has(o.id)} onApply={applyToOpportunity} />
          ))}
        </>
      )}

      {/* Activities */}
      {(lens === 'all' || lens === 'activities') && activities.length > 0 && (
        <>
          {lens === 'all' && <div style={{ fontSize: 12, color: muted, fontWeight: 600, margin: '4px 0 10px', letterSpacing: 0.5 }}>ACTIVITIES & EVENTS</div>}
          {activities.map(a => <ActCard key={a.id} act={a} />)}
        </>
      )}

      {/* Notices */}
      {(lens === 'all' || lens === 'notices') && announcements.length > 0 && (
        <>
          {lens === 'all' && <div style={{ fontSize: 12, color: muted, fontWeight: 600, margin: '4px 0 10px', letterSpacing: 0.5 }}>NOTICES</div>}
          {announcements.map(a => <NoticeCard key={a.id} ann={a} />)}
        </>
      )}

      {/* Empty */}
      {lens !== 'all' && opportunities.length === 0 && activities.length === 0 && announcements.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: muted }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14 }}>Nothing here yet</div>
        </div>
      )}
    </div>
  );
}
