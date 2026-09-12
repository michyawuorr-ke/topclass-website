'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { OperatorShell } from './OperatorShell';
import { OperatorIcons } from './icons';
import { StatGrid, Stat } from './StatGrid';

type Tab = 'home' | 'classes' | 'materials' | 'publish' | 'attendance';

const border = 'rgba(255,255,255,0.08)';
const accent = '#E26D34';
const teal   = '#1D9E75';
const gold   = '#D4AF37';
const purple = '#8A6DE2';
const text   = '#F5EFE3';
const sub    = 'rgba(245,239,227,0.45)';
const panel  = '#1C1C2E';
const card   = 'rgba(255,255,255,0.04)';

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  width: '100%', padding: '10px 12px', marginBottom: 10, borderRadius: 8,
  background: 'rgba(255,255,255,0.07)', border: `1px solid ${border}`,
  color: text, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', ...extra,
});
const lbl: React.CSSProperties = { fontSize: 11, color: sub, marginBottom: 4, display: 'block', letterSpacing: 0.5 };
const addBtn: React.CSSProperties = { padding: '9px 16px', borderRadius: 8, background: accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 };
const primaryBtn: React.CSSProperties = { width: '100%', padding: '11px', borderRadius: 8, background: accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginBottom: 8 };

function Drawer({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: panel, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: sub, marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: sub, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SubTabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
          background: active === t.id ? accent : 'rgba(255,255,255,0.08)',
          color: active === t.id ? '#fff' : text,
          fontWeight: active === t.id ? 600 : 400, fontSize: 13, fontFamily: 'inherit',
        }}>{t.label}</button>
      ))}
    </div>
  );
}

interface Schedule {
  id: string; course_code: string; course_name: string;
  day_of_week: string; start_time: string; end_time: string;
  team_id: string;
  zones?: { id: string; name: string } | null;
  teams?: { name: string } | null;
}

interface AttendanceSession {
  id: string; schedule_id: string; zone_id: string;
  opened_at: string; closed_at: string | null;
}

interface AttendanceLog {
  id: string; profile_id: string; scanned_at: string;
  profiles?: { name: string; title: string };
}

interface Material {
  id: string; title: string; file_url: string; file_type: string;
  unit_code: string; unit_name: string; uploaded_at: string; schedule_id: string;
}

export function LecturerView({ userId, signOut }: { userId: string; signOut: () => void }) {
  const [tab, setTab] = useState<Tab>('home');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, AttendanceSession | null>>({});
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);

  // Publish forms
  const [publishSub, setPublishSub] = useState('opportunities');
  const [oppDrawer, setOppDrawer] = useState(false);
  const [actDrawer, setActDrawer] = useState(false);
  const [annDrawer, setAnnDrawer] = useState(false);
  const [oppForm, setOppForm] = useState({ title: '', type: 'TA Opening', description: '', deadline: '', compensation: '' });
  const [actForm, setActForm] = useState({ title: '', host: '', description: '', start_time: '', end_time: '' });
  const [annForm, setAnnForm] = useState({ title: '', body: '' });

  // Materials
  const [matDrawer, setMatDrawer] = useState(false);
  const [matForm, setMatForm] = useState({ title: '', unit_code: '', unit_name: '', file_url: '', file_type: 'PDF', schedule_id: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAll(); }, [userId]);

  const loadAll = async () => {
    // Get all schedules this lecturer is assigned to
    const { data: assignments } = await supabase
      .from('schedule_lecturers')
      .select('schedule_id')
      .eq('user_id', userId);

    const scheduleIds = (assignments || []).map((a: any) => a.schedule_id);
    if (scheduleIds.length === 0) { setSchedules([]); return; }

    const { data: sched } = await supabase
      .from('schedules')
      .select('*, zones(id, name), teams(name)')
      .in('id', scheduleIds);

    setSchedules(sched || []);
    if (sched && sched.length > 0 && !activeScheduleId) setActiveScheduleId(sched[0].id);

    // Check for open sessions per schedule
    const { data: openSessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .in('schedule_id', scheduleIds)
      .is('closed_at', null);

    const bySchedule: Record<string, AttendanceSession | null> = {};
    scheduleIds.forEach((id: string) => bySchedule[id] = null);
    (openSessions || []).forEach((s: any) => { bySchedule[s.schedule_id] = s; });
    setSessions(bySchedule);

    // Materials
    const { data: mats } = await supabase
      .from('course_materials')
      .select('*')
      .in('schedule_id', scheduleIds)
      .order('uploaded_at', { ascending: false });
    setMaterials(mats || []);

    // Stats
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayClasses = (sched || []).filter((s: any) => s.day_of_week === today);
    const totalSessions = Object.values(bySchedule).filter(Boolean).length;

    setStats([
      { label: 'My units', value: (sched || []).length },
      { label: 'Classes today', value: todayClasses.length },
      { label: 'Active sessions', value: totalSessions, accent: totalSessions > 0 },
      { label: 'Materials uploaded', value: (mats || []).length },
    ]);
  };

  const loadLogs = async (sessionId: string) => {
    const { data } = await supabase
      .from('attendance_logs')
      .select('*, profiles(name, title)')
      .eq('session_id', sessionId)
      .order('scanned_at', { ascending: false });
    setLogs(data || []);
  };

  const openSession = async (schedule: Schedule) => {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert({ schedule_id: schedule.id, zone_id: schedule.zones?.id || null, opened_by: userId })
      .select().single();
    if (error) { window.alert(error.message); return; }
    setSessions(prev => ({ ...prev, [schedule.id]: data }));
    setStats(prev => prev.map(s => s.label === 'Active sessions' ? { ...s, value: (s.value as number) + 1, accent: true } : s));
  };

  const closeSession = async (scheduleId: string, sessionId: string) => {
    await supabase.from('attendance_sessions').update({ closed_at: new Date().toISOString() }).eq('id', sessionId);
    setSessions(prev => ({ ...prev, [scheduleId]: null }));
    setLogs([]);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `materials/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('toruok-media').upload(path, file);
    if (error) { window.alert(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from('toruok-media').getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadMaterial = async () => {
    if (!matForm.title.trim() || !matForm.file_url) return;
    const activeSchedule = schedules.find(s => s.id === (matForm.schedule_id || activeScheduleId));
    const { error } = await supabase.from('course_materials').insert({
      schedule_id: matForm.schedule_id || activeScheduleId,
      team_id: activeSchedule?.team_id,
      title: matForm.title,
      file_url: matForm.file_url,
      file_type: matForm.file_type,
      unit_code: matForm.unit_code || activeSchedule?.course_code,
      unit_name: matForm.unit_name || activeSchedule?.course_name,
      uploader_id: userId,
    });
    if (error) { window.alert(error.message); return; }
    setMatForm({ title: '', unit_code: '', unit_name: '', file_url: '', file_type: 'PDF', schedule_id: '' });
    setMatDrawer(false);
    loadAll();
  };

  const postOpportunity = async () => {
    if (!oppForm.title.trim() || !activeScheduleId) return;
    const sched = schedules.find(s => s.id === activeScheduleId);
    if (!sched) return;
    await supabase.from('opportunities').insert({
      space_id: null, team_id: sched.team_id,
      title: oppForm.title, type: oppForm.type,
      description: oppForm.description || null,
      deadline: oppForm.deadline ? new Date(oppForm.deadline).toISOString() : null,
      compensation: oppForm.compensation || null,
      status: 'open',
    });
    setOppForm({ title: '', type: 'TA Opening', description: '', deadline: '', compensation: '' });
    setOppDrawer(false);
  };

  const postActivity = async () => {
    if (!actForm.title.trim() || !activeScheduleId) return;
    const sched = schedules.find(s => s.id === activeScheduleId);
    if (!sched) return;
    await supabase.from('activities').insert({
      space_id: null, team_id: sched.team_id,
      title: actForm.title, host: actForm.host || null,
      description: actForm.description || null,
      start_time: actForm.start_time ? new Date(actForm.start_time).toISOString() : null,
      end_time: actForm.end_time ? new Date(actForm.end_time).toISOString() : null,
    });
    setActForm({ title: '', host: '', description: '', start_time: '', end_time: '' });
    setActDrawer(false);
  };

  const postAnnouncement = async () => {
    if (!annForm.title.trim() || !activeScheduleId) return;
    const sched = schedules.find(s => s.id === activeScheduleId);
    if (!sched) return;
    await supabase.from('announcements').insert({ team_id: sched.team_id, title: annForm.title, body: annForm.body || null });
    setAnnForm({ title: '', body: '' });
    setAnnDrawer(false);
  };

  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const activeSchedule = schedules.find(s => s.id === activeScheduleId);
  const activeSession = activeScheduleId ? sessions[activeScheduleId] : null;

  const nav = [
    { id: 'home',       label: 'Home',       icon: OperatorIcons.home },
    { id: 'classes',    label: 'My Units',   icon: OperatorIcons.classes },
    { id: 'attendance', label: 'Attendance', icon: OperatorIcons.attendance, badge: Object.values(sessions).filter(Boolean).length },
    { id: 'materials',  label: 'Materials',  icon: OperatorIcons.materials },
    { id: 'publish',    label: 'Publish',    icon: OperatorIcons.publish },
  ];

  return (
    <OperatorShell
      orgName="Lecturer"
      spaceName={activeSchedule?.teams?.name || 'My Units'}
      roleBadge="Lecturer"
      roleColor={purple}
      nav={nav}
      activeTab={tab}
      onTab={t => setTab(t as Tab)}
      onSignOut={signOut}
    >
      {/* Unit switcher */}
      {schedules.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, paddingTop: 4 }}>
          {schedules.map(s => (
            <button key={s.id} onClick={() => setActiveScheduleId(s.id)} style={{
              padding: '6px 14px', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: activeScheduleId === s.id ? accent : 'rgba(255,255,255,0.08)',
              color: activeScheduleId === s.id ? '#fff' : text,
              fontWeight: activeScheduleId === s.id ? 600 : 400, fontSize: 13, fontFamily: 'inherit',
            }}>
              {s.course_code || s.course_name}
              {sessions[s.id] && <span style={{ marginLeft: 6, color: teal, fontSize: 10 }}>● LIVE</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── Home ── */}
      {tab === 'home' && (
        <>
          <StatGrid stats={stats} />

          {schedules.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: sub }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 600, color: text, marginBottom: 6 }}>No units assigned yet</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>Ask your HOD to assign you to a course schedule.</div>
            </div>
          )}

          {/* Today's classes */}
          {(() => {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const todayClasses = schedules.filter(s => s.day_of_week === today);
            if (todayClasses.length === 0) return null;
            return (
              <>
                <div style={{ fontSize: 11, color: sub, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>TODAY</div>
                {todayClasses.map(s => {
                  const session = sessions[s.id];
                  return (
                    <div key={s.id} style={{ background: session ? `${teal}12` : card, border: `1px solid ${session ? teal + '40' : border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{s.course_name}</div>
                          {s.course_code && <div style={{ fontSize: 11, color: session ? teal : accent, marginTop: 2 }}>{s.course_code}</div>}
                          <div style={{ fontSize: 12, color: sub, marginTop: 4 }}>
                            {s.start_time}–{s.end_time}{s.zones?.name ? ` · ${s.zones.name}` : ''}
                          </div>
                        </div>
                        {session ? (
                          <button onClick={() => closeSession(s.id, session.id)} style={{ padding: '7px 14px', borderRadius: 10, background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            End session
                          </button>
                        ) : (
                          <button onClick={() => openSession(s)} style={{ padding: '7px 14px', borderRadius: 10, background: `${teal}20`, border: `1px solid ${teal}40`, color: teal, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            Open attendance
                          </button>
                        )}
                      </div>
                      {session && (
                        <div style={{ marginTop: 10, fontSize: 12, color: teal }}>
                          ● Session open since {new Date(session.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })()}

          {/* All units summary */}
          <div style={{ fontSize: 11, color: sub, fontWeight: 600, marginBottom: 10, marginTop: 8, letterSpacing: 0.5 }}>ALL UNITS</div>
          {schedules.map(s => (
            <div key={s.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.course_name}</div>
                <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{s.day_of_week} · {s.start_time}–{s.end_time}</div>
                {s.teams?.name && <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{s.teams.name}</div>}
              </div>
              {sessions[s.id] && <span style={{ fontSize: 11, color: teal, fontWeight: 700 }}>● LIVE</span>}
            </div>
          ))}
        </>
      )}

      {/* ── My Units detail ── */}
      {tab === 'classes' && activeSchedule && (
        <>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{activeSchedule.course_name}</div>
          {activeSchedule.course_code && <div style={{ fontSize: 12, color: accent, marginBottom: 12 }}>{activeSchedule.course_code}</div>}

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><div style={{ fontSize: 10, color: sub }}>Department</div><div style={{ fontSize: 13, marginTop: 3 }}>{activeSchedule.teams?.name || '—'}</div></div>
              <div><div style={{ fontSize: 10, color: sub }}>Room</div><div style={{ fontSize: 13, marginTop: 3 }}>{activeSchedule.zones?.name || '—'}</div></div>
              <div><div style={{ fontSize: 10, color: sub }}>Day</div><div style={{ fontSize: 13, marginTop: 3 }}>{activeSchedule.day_of_week}</div></div>
              <div><div style={{ fontSize: 10, color: sub }}>Time</div><div style={{ fontSize: 13, marginTop: 3 }}>{activeSchedule.start_time}–{activeSchedule.end_time}</div></div>
            </div>
          </div>

          {/* Attendance control */}
          {activeSession ? (
            <div style={{ background: `${teal}12`, border: `1px solid ${teal}40`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: teal }}>● Attendance open</div>
                  <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>Since {new Date(activeSession.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <button onClick={() => closeSession(activeSchedule.id, activeSession.id)} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Close
                </button>
              </div>
              <button onClick={() => { setTab('attendance'); loadLogs(activeSession.id); }}
                style={{ width: '100%', padding: 10, borderRadius: 10, background: `${teal}20`, border: `1px solid ${teal}40`, color: teal, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                View live roster →
              </button>
            </div>
          ) : (
            <button onClick={() => openSession(activeSchedule)}
              style={{ ...primaryBtn, background: teal }}>
              Open attendance for this class
            </button>
          )}
        </>
      )}

      {/* ── Attendance ── */}
      {tab === 'attendance' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Live Attendance</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{activeSchedule?.course_name}</div>
            </div>
            {!activeSession ? (
              <button onClick={() => activeSchedule && openSession(activeSchedule)} style={{ ...addBtn, background: teal }}>Open session</button>
            ) : (
              <button onClick={() => closeSession(activeSchedule!.id, activeSession.id)}
                style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                End session
              </button>
            )}
          </div>

          {!activeSession && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: sub }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🚪</div>
              <div style={{ fontWeight: 600, color: text, marginBottom: 6 }}>No active session</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>Open a session to start recording attendance. Students scan the room QR to check in.</div>
            </div>
          )}

          {activeSession && (
            <>
              <div style={{ background: `${teal}12`, border: `1px solid ${teal}30`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: teal }}>
                ● Session open · {logs.length} student{logs.length !== 1 ? 's' : ''} checked in
              </div>
              {logs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: sub, fontSize: 13 }}>
                  Waiting for students to scan the room QR…
                </div>
              )}
              {logs.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#D4AF37,#E26D34)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>
                    {l.profiles?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{l.profiles?.name || 'Unknown'}</div>
                    {l.profiles?.title && <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{l.profiles.title}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: sub }}>{new Date(l.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* ── Materials ── */}
      {tab === 'materials' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Course Materials</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>Upload PDFs, slides, and docs per unit</div>
            </div>
            <button onClick={() => setMatDrawer(true)} style={addBtn}>+ Upload</button>
          </div>

          {/* Group by unit */}
          {(() => {
            const byUnit: Record<string, Material[]> = {};
            materials.forEach(m => {
              const key = m.unit_code ? `${m.unit_code}: ${m.unit_name}` : (m.unit_name || 'General');
              (byUnit[key] ||= []).push(m);
            });
            if (Object.keys(byUnit).length === 0) return (
              <div style={{ textAlign: 'center', padding: '48px 0', color: sub }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📁</div>
                <div style={{ fontWeight: 600, color: text, marginBottom: 6 }}>No materials yet</div>
                <div style={{ fontSize: 13 }}>Upload your first file.</div>
              </div>
            );
            return Object.entries(byUnit).map(([unit, items]) => (
              <div key={unit} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: accent, fontWeight: 700, marginBottom: 10, letterSpacing: 0.5 }}>{unit.toUpperCase()}</div>
                {items.map(m => (
                  <div key={m.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{m.file_type === 'PDF' ? '📄' : m.file_type === 'Slides' ? '📊' : m.file_type === 'Video' ? '🎥' : '📎'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
                      <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{new Date(m.uploaded_at).toLocaleDateString()}</div>
                    </div>
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', color: text, textDecoration: 'none', fontSize: 12 }}>
                      View
                    </a>
                  </div>
                ))}
              </div>
            ));
          })()}

          <Drawer open={matDrawer} onClose={() => setMatDrawer(false)} title="Upload Material" subtitle="Students see this in their Learn tab">
            <label style={lbl}>Unit *</label>
            <select value={matForm.schedule_id} onChange={e => {
              const s = schedules.find(sc => sc.id === e.target.value);
              setMatForm(f => ({ ...f, schedule_id: e.target.value, unit_code: s?.course_code || '', unit_name: s?.course_name || '' }));
            }} style={inp()}>
              <option value="">Select unit</option>
              {schedules.map(s => <option key={s.id} value={s.id}>{s.course_code ? `${s.course_code}: ` : ''}{s.course_name}</option>)}
            </select>
            <label style={lbl}>Title *</label>
            <input value={matForm.title} onChange={e => setMatForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Week 3 Lecture Notes" style={inp()} />
            <label style={lbl}>File type</label>
            <select value={matForm.file_type} onChange={e => setMatForm(f => ({ ...f, file_type: e.target.value }))} style={inp()}>
              {['PDF', 'Slides', 'Video', 'Document', 'Other'].map(t => <option key={t}>{t}</option>)}
            </select>
            <label style={lbl}>Upload file</label>
            <input ref={fileRef} type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.mov" onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              const ext = file.name.split('.').pop();
              const path = `materials/${crypto.randomUUID()}.${ext}`;
              const { error } = await supabase.storage.from('toruok-media').upload(path, file);
              if (error) { window.alert(error.message); setUploading(false); return; }
              const { data } = supabase.storage.from('toruok-media').getPublicUrl(path);
              setMatForm(f => ({ ...f, file_url: data.publicUrl }));
              setUploading(false);
            }} style={{ ...inp(), paddingTop: 8 }} />
            {uploading && <div style={{ fontSize: 12, color: gold, marginBottom: 8 }}>Uploading…</div>}
            {matForm.file_url && <div style={{ fontSize: 12, color: teal, marginBottom: 10 }}>✓ File ready</div>}
            <button onClick={uploadMaterial} disabled={!matForm.title.trim() || !matForm.file_url || uploading}
              style={{ ...primaryBtn, opacity: !matForm.title.trim() || !matForm.file_url ? 0.5 : 1 }}>
              Upload material
            </button>
          </Drawer>
        </>
      )}

      {/* ── Publish ── */}
      {tab === 'publish' && (
        <>
          <SubTabs active={publishSub} onChange={setPublishSub} tabs={[
            { id: 'opportunities', label: 'Opportunities' },
            { id: 'activities', label: 'Activities' },
            { id: 'notices', label: 'Notices' },
          ]} />

          {/* Scope indicator */}
          <div style={{ background: `${accent}10`, border: `1px solid ${accent}25`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: sub }}>
            Publishing to <strong style={{ color: text }}>{activeSchedule?.teams?.name || 'your department'}</strong> — students in this department will see this.
          </div>

          {publishSub === 'opportunities' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button onClick={() => setOppDrawer(true)} style={addBtn}>+ Post</button>
              </div>
              <Drawer open={oppDrawer} onClose={() => setOppDrawer(false)} title="Post an Opportunity" subtitle="TA opening, research role, or departmental posting">
                <label style={lbl}>Title *</label>
                <input value={oppForm.title} onChange={e => setOppForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Research Assistant – SOC 201" style={inp()} />
                <label style={lbl}>Type</label>
                <select value={oppForm.type} onChange={e => setOppForm(f => ({ ...f, type: e.target.value }))} style={inp()}>
                  {['TA Opening', 'Research Assistantship', 'Stipend', 'Scholarship', 'Internship', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
                <label style={lbl}>Description</label>
                <textarea value={oppForm.description} onChange={e => setOppForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp(), minHeight: 70 }} />
                <label style={lbl}>Compensation</label>
                <input value={oppForm.compensation} onChange={e => setOppForm(f => ({ ...f, compensation: e.target.value }))} placeholder="e.g. Ksh 8,000/month or Unpaid" style={inp()} />
                <label style={lbl}>Deadline</label>
                <input type="date" value={oppForm.deadline} onChange={e => setOppForm(f => ({ ...f, deadline: e.target.value }))} style={inp()} />
                <button onClick={postOpportunity} disabled={!oppForm.title.trim()} style={{ ...primaryBtn, opacity: !oppForm.title.trim() ? 0.5 : 1 }}>Post opportunity</button>
              </Drawer>
            </>
          )}

          {publishSub === 'activities' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button onClick={() => setActDrawer(true)} style={addBtn}>+ Add</button>
              </div>
              <Drawer open={actDrawer} onClose={() => setActDrawer(false)} title="Add an Activity" subtitle="Class event, guest lecture, field trip">
                <label style={lbl}>Title *</label>
                <input value={actForm.title} onChange={e => setActForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Guest Lecture — Urban Planning" style={inp()} />
                <label style={lbl}>Host</label>
                <input value={actForm.host} onChange={e => setActForm(f => ({ ...f, host: e.target.value }))} style={inp()} />
                <label style={lbl}>Description</label>
                <textarea value={actForm.description} onChange={e => setActForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp(), minHeight: 60 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={lbl}>Start</label><input type="datetime-local" value={actForm.start_time} onChange={e => setActForm(f => ({ ...f, start_time: e.target.value }))} style={inp()} /></div>
                  <div><label style={lbl}>End</label><input type="datetime-local" value={actForm.end_time} onChange={e => setActForm(f => ({ ...f, end_time: e.target.value }))} style={inp()} /></div>
                </div>
                <button onClick={postActivity} disabled={!actForm.title.trim()} style={{ ...primaryBtn, opacity: !actForm.title.trim() ? 0.5 : 1 }}>Add activity</button>
              </Drawer>
            </>
          )}

          {publishSub === 'notices' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button onClick={() => setAnnDrawer(true)} style={addBtn}>+ Post</button>
              </div>
              <Drawer open={annDrawer} onClose={() => setAnnDrawer(false)} title="Post a Notice" subtitle="Goes to students in your department">
                <label style={lbl}>Title *</label>
                <input value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. CAT moved to Friday" style={inp()} />
                <label style={lbl}>Body</label>
                <textarea value={annForm.body} onChange={e => setAnnForm(f => ({ ...f, body: e.target.value }))} style={{ ...inp(), minHeight: 80 }} />
                <button onClick={postAnnouncement} disabled={!annForm.title.trim()} style={{ ...primaryBtn, opacity: !annForm.title.trim() ? 0.5 : 1 }}>Post notice</button>
              </Drawer>
            </>
          )}
        </>
      )}
    </OperatorShell>
  );
}

