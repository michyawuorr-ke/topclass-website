'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Org, Space, Zone, Team, TeamLead, TeamOperator, Schedule, Announcement, Item, Application,
  emptyOpportunity, emptyResource, emptyActivity, emptySchedule, emptyAnnouncement,
  OPPORTUNITY_TYPES, zonePath, roomQrPayload, qrImageUrl,
} from '../types';
import { OperatorShell } from './OperatorShell';
import { OperatorIcons } from './icons';
import { StatGrid, Stat } from './StatGrid';
import { ApplicationsPanel } from './ApplicationsPanel';

type Tab = 'home' | 'rooms' | 'publish' | 'applications' | 'announcements' | 'schedules';
type PublishSub = 'opportunities' | 'activities' | 'resources';

// ── primitives ───────────────────────────────────────────────────────────────
const dark = '#13131F';
const panel = '#1C1C2E';
const border = 'rgba(255,255,255,0.08)';
const accent = '#E26D34';
const purple = '#8A6DE2';
const teal = '#1D9E75';
const text = '#F5EFE3';
const sub = 'rgba(245,239,227,0.45)';

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  width: '100%', padding: '10px 12px', marginBottom: 10, borderRadius: 8,
  background: 'rgba(255,255,255,0.07)', border: `1px solid ${border}`,
  color: text, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', ...extra,
});
const lbl: React.CSSProperties = { fontSize: 11, color: sub, marginBottom: 4, display: 'block', letterSpacing: 0.5 };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 };
const primaryBtn: React.CSSProperties = { width: '100%', padding: '11px', borderRadius: 8, background: accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginBottom: 8 };
const addBtn: React.CSSProperties = { padding: '9px 16px', borderRadius: 8, background: accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 };
const ghostBtn: React.CSSProperties = { padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'none', color: text, cursor: 'pointer', fontSize: 12 };

// ── Drawer ───────────────────────────────────────────────────────────────────
function Drawer({ open, onClose, title, sub: subtitle, children }: { open: boolean; onClose: () => void; title: string; sub?: string; children: React.ReactNode }) {
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: sub, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── sub-tab pill row ─────────────────────────────────────────────────────────
function SubTabs({ active, onChange, tabs }: { active: string; onChange: (v: string) => void; tabs: { id: string; label: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13,
          background: active === t.id ? accent : 'rgba(255,255,255,0.08)',
          color: active === t.id ? '#fff' : text,
          fontWeight: active === t.id ? 600 : 400,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────
export function HODView({ org, space, teams, signOut }: {
  org: Org | null; space: Space | null; teams: Team[]; signOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>('home');
  const [publishSub, setPublishSub] = useState<PublishSub>('opportunities');
  const [activeTeamId, setActiveTeamId] = useState<string>(teams[0]?.id || '');
  const activeTeam = teams.find(t => t.id === activeTeamId) || null;

  // Data
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [rooms, setRooms] = useState<Zone[]>([]); // child zones of this dept
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [opportunities, setOpportunities] = useState<Item[]>([]);
  const [resources, setResources] = useState<Item[]>([]);
  const [activities, setActivities] = useState<Item[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [pendingApps, setPendingApps] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Drawers
  const [roomDrawer, setRoomDrawer] = useState(false);
  const [scheduleDrawer, setScheduleDrawer] = useState(false);
  const [oppDrawer, setOppDrawer] = useState(false);
  const [actDrawer, setActDrawer] = useState(false);
  const [resDrawer, setResDrawer] = useState(false);
  const [annDrawer, setAnnDrawer] = useState(false);
  const [qrRoom, setQrRoom] = useState<Zone | null>(null);

  // Forms
  const [roomForm, setRoomForm] = useState({ name: '', capacity: '', description: '' });
  const [scheduleForm, setScheduleForm] = useState({ ...emptySchedule });
  const [oppForm, setOppForm] = useState({ ...emptyOpportunity });
  const [actForm, setActForm] = useState({ ...emptyActivity });
  const [resForm, setResForm] = useState({ ...emptyResource });
  const [annForm, setAnnForm] = useState({ ...emptyAnnouncement });
  const [scheduleLecturers, setScheduleLecturers] = useState<Record<string, { id: string; invite_email: string | null; user_id: string | null }[]>>({});
  const [lecturerDrawerFor, setLecturerDrawerFor] = useState<string | null>(null);
  const [lecturerInviteEmail, setLecturerInviteEmail] = useState('');

  // Editing (null = creating new; set = editing that row)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editingOppId, setEditingOppId] = useState<string | null>(null);
  const [editingActId, setEditingActId] = useState<string | null>(null);
  const [editingResId, setEditingResId] = useState<string | null>(null);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);

  useEffect(() => {
    if (space) supabase.from('zones').select('*').eq('space_id', space.id).then(({ data }) => setAllZones(data || []));
  }, [space?.id]);

  useEffect(() => {
    if (activeTeamId) loadTeam(activeTeamId);
  }, [activeTeamId]);

  const loadTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    const [{ data: sched }, { data: opps }, { data: res }, { data: acts }, { data: anns }] = await Promise.all([
      supabase.from('schedules').select('*').eq('team_id', teamId),
      supabase.from('opportunities').select('*').eq('team_id', teamId),
      supabase.from('resources').select('*').eq('team_id', teamId),
      supabase.from('activities').select('*').eq('team_id', teamId),
      supabase.from('announcements').select('*').eq('team_id', teamId).order('created_at', { ascending: false }),
    ]);
    setSchedules(sched || []);
    setOpportunities(opps || []);
    setResources(res || []);
    setActivities(acts || []);
    setAnnouncements(anns || []);

    const scheduleIds = (sched || []).map((s: any) => s.id);
    if (scheduleIds.length > 0) {
      const { data: sl } = await supabase.from('schedule_lecturers').select('*').in('schedule_id', scheduleIds);
      const byschedule: Record<string, any[]> = {};
      (sl || []).forEach((row: any) => { (byschedule[row.schedule_id] ||= []).push(row); });
      setScheduleLecturers(byschedule);
    } else {
      setScheduleLecturers({});
    }

    // Rooms = child zones of this team's primary zone
    if (team?.primary_zone_id) {
      const { data: childZones } = await supabase.from('zones').select('*').eq('parent_zone_id', team.primary_zone_id);
      setRooms(childZones || []);
    } else {
      setRooms([]);
    }

    const oppIds = (opps || []).map((o: any) => o.id);
    let apps: any[] = [], pending = 0;
    if (oppIds.length > 0) {
      const { data: a } = await supabase.from('opportunity_applications')
        .select('*, opportunities(title), profiles(name, title, domain)').in('opportunity_id', oppIds).order('created_at', { ascending: false });
      apps = a || [];
      pending = apps.filter((x: any) => x.status === 'applied').length;
    }
    setApplications(apps);
    setPendingApps(pending);

    const { count: present } = await supabase.from('presence').select('id', { count: 'exact', head: true }).eq('zone_id', team?.primary_zone_id || '');
    setStats([
      { label: 'Present now', value: present || 0 },
      { label: 'Rooms', value: 0 },
      { label: 'Upcoming activities', value: (acts || []).filter((a: any) => a.start_time && new Date(a.start_time) > new Date()).length },
      { label: 'Pending applications', value: pending, accent: pending > 0 },
    ]);
  };

  // Fix stats after rooms load
  useEffect(() => {
    setStats(prev => prev.map(s => s.label === 'Rooms' ? { ...s, value: rooms.length } : s));
  }, [rooms]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('toruok-media').upload(path, file);
    if (error) { window.alert(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from('toruok-media').getPublicUrl(path);
    return data.publicUrl;
  };
  const handleOppImg = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setOppForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };
  const handleActImg = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setActForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };
  const handleResImg = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setResForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };

  const addRoom = async () => {
    if (!roomForm.name.trim() || !activeTeam?.primary_zone_id) return;
    const payload = { name: roomForm.name.trim(), capacity: roomForm.capacity || null, description: roomForm.description || null };
    const { error } = editingRoomId
      ? await supabase.from('zones').update(payload).eq('id', editingRoomId)
      : await supabase.from('zones').insert({ space_id: space?.id, parent_zone_id: activeTeam.primary_zone_id, ...payload });
    if (error) { window.alert(error.message); return; }
    setRoomForm({ name: '', capacity: '', description: '' });
    setRoomDrawer(false); setEditingRoomId(null);
    loadTeam(activeTeamId);
  };
  const openEditRoom = (z: Zone) => {
    setRoomForm({ name: z.name, capacity: z.capacity || '', description: z.description || '' });
    setEditingRoomId(z.id); setRoomDrawer(true);
  };

  const addSchedule = async () => {
    if (!scheduleForm.course_name.trim()) return;
    const payload = {
      course_code: scheduleForm.course_code || null, course_name: scheduleForm.course_name,
      zone_id: scheduleForm.zone_id || null, day_of_week: scheduleForm.day_of_week || null,
      start_time: scheduleForm.start_time || null, end_time: scheduleForm.end_time || null,
    };
    const { error } = editingScheduleId
      ? await supabase.from('schedules').update(payload).eq('id', editingScheduleId)
      : await supabase.from('schedules').insert({ team_id: activeTeamId, ...payload });
    if (error) { window.alert(error.message); return; }
    setScheduleForm({ ...emptySchedule });
    setScheduleDrawer(false); setEditingScheduleId(null);
    loadTeam(activeTeamId);
  };
  const openEditSchedule = (s: Schedule) => {
    setScheduleForm({
      course_code: s.course_code || '', course_name: s.course_name || '', zone_id: s.zone_id || '',
      day_of_week: s.day_of_week || '', start_time: s.start_time || '', end_time: s.end_time || '',
    });
    setEditingScheduleId(s.id); setScheduleDrawer(true);
  };

  const assignLecturer = async () => {
    if (!lecturerDrawerFor || !lecturerInviteEmail.trim()) return;
    const { error } = await supabase.from('schedule_lecturers').insert({ schedule_id: lecturerDrawerFor, invite_email: lecturerInviteEmail.trim() });
    if (error) { window.alert(error.message); return; }
    setLecturerInviteEmail('');
    loadTeam(activeTeamId);
  };
  const removeLecturer = async (id: string) => {
    const { error } = await supabase.from('schedule_lecturers').delete().eq('id', id);
    if (error) { window.alert(error.message); return; }
    loadTeam(activeTeamId);
  };

  const addOpportunity = async () => {
    if (!oppForm.title.trim() || !space) return;
    const payload = {
      title: oppForm.title, type: oppForm.type,
      provider: oppForm.provider || null, description: oppForm.description || null,
      eligibility: oppForm.eligibility || null, compensation: oppForm.compensation || null,
      deadline: oppForm.deadline ? new Date(oppForm.deadline).toISOString() : null,
      application_method: oppForm.application_method || null, zone_id: oppForm.zone_id || null,
      location: oppForm.location || null, status: oppForm.status, image_url: oppForm.image_url || null,
    };
    const { error } = editingOppId
      ? await supabase.from('opportunities').update(payload).eq('id', editingOppId)
      : await supabase.from('opportunities').insert({ space_id: space.id, team_id: activeTeamId, ...payload });
    if (error) { window.alert(error.message); return; }
    setOppForm({ ...emptyOpportunity }); setOppDrawer(false); setEditingOppId(null); loadTeam(activeTeamId);
  };
  const openEditOpp = (o: Item) => {
    setOppForm({
      title: o.title || '', type: o.type || OPPORTUNITY_TYPES[0], provider: o.provider || '', description: o.description || '',
      eligibility: o.eligibility || '', compensation: o.compensation || '',
      deadline: o.deadline ? o.deadline.slice(0, 10) : '', application_method: o.application_method || '',
      zone_id: o.zone_id || '', location: o.location || '', status: o.status || 'open', image_url: o.image_url || '',
    });
    setEditingOppId(o.id); setOppDrawer(true);
  };

  const addActivity = async () => {
    if (!actForm.title.trim() || !space) return;
    const payload = {
      title: actForm.title, host: actForm.host || null, description: actForm.description || null,
      category: actForm.category || null,
      start_time: actForm.start_time ? new Date(actForm.start_time).toISOString() : null,
      end_time: actForm.end_time ? new Date(actForm.end_time).toISOString() : null,
      zone_id: actForm.zone_id || null, capacity: actForm.capacity || null,
      registration_link: actForm.registration_link || null, image_url: actForm.image_url || null,
    };
    const { error } = editingActId
      ? await supabase.from('activities').update(payload).eq('id', editingActId)
      : await supabase.from('activities').insert({ space_id: space.id, team_id: activeTeamId, ...payload });
    if (error) { window.alert(error.message); return; }
    setActForm({ ...emptyActivity }); setActDrawer(false); setEditingActId(null); loadTeam(activeTeamId);
  };
  const openEditAct = (a: Item) => {
    setActForm({
      title: a.title || '', host: a.host || '', description: a.description || '', category: a.category || '',
      start_time: a.start_time ? a.start_time.slice(0, 16) : '', end_time: a.end_time ? a.end_time.slice(0, 16) : '',
      zone_id: a.zone_id || '', capacity: a.capacity || '', registration_link: a.registration_link || '', image_url: a.image_url || '',
    });
    setEditingActId(a.id); setActDrawer(true);
  };

  const addResource = async () => {
    if (!resForm.name.trim() || !space) return;
    const payload = {
      name: resForm.name, owner: resForm.owner || null, description: resForm.description || null,
      availability: resForm.availability || null, capacity: resForm.capacity || null,
      zone_id: resForm.zone_id || null, image_url: resForm.image_url || null,
    };
    const { error } = editingResId
      ? await supabase.from('resources').update(payload).eq('id', editingResId)
      : await supabase.from('resources').insert({ space_id: space.id, team_id: activeTeamId, ...payload });
    if (error) { window.alert(error.message); return; }
    setResForm({ ...emptyResource }); setResDrawer(false); setEditingResId(null); loadTeam(activeTeamId);
  };
  const openEditRes = (r: Item) => {
    setResForm({
      name: r.name || '', owner: r.owner || '', description: r.description || '',
      availability: r.availability || '', capacity: r.capacity || '', zone_id: r.zone_id || '', image_url: r.image_url || '',
    });
    setEditingResId(r.id); setResDrawer(true);
  };

  const addAnnouncement = async () => {
    if (!annForm.title.trim()) return;
    const payload = { title: annForm.title, body: annForm.body || null };
    const { error } = editingAnnId
      ? await supabase.from('announcements').update(payload).eq('id', editingAnnId)
      : await supabase.from('announcements').insert({ team_id: activeTeamId, ...payload });
    if (error) { window.alert(error.message); return; }
    setAnnForm({ ...emptyAnnouncement }); setAnnDrawer(false); setEditingAnnId(null); loadTeam(activeTeamId);
  };
  const openEditAnn = (a: Announcement) => {
    setAnnForm({ title: a.title, body: a.body || '' });
    setEditingAnnId(a.id); setAnnDrawer(true);
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    await supabase.from('opportunity_applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setPendingApps(prev => status !== 'applied' ? Math.max(0, prev - 1) : prev);
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const nav = [
    { id: 'home',          label: 'Home',          icon: OperatorIcons.home },
    { id: 'rooms',         label: 'Rooms',         icon: OperatorIcons.rooms, badge: rooms.length },
    { id: 'schedules',     label: 'Schedules',     icon: OperatorIcons.schedules },
    { id: 'publish',       label: 'Publish',       icon: OperatorIcons.publish },
    { id: 'applications',  label: 'Applications',  icon: OperatorIcons.applications, badge: pendingApps },
    { id: 'announcements', label: 'Notices',       icon: OperatorIcons.notices },
  ];

  return (
    <OperatorShell
      orgName={org?.name || 'Operator'}
      spaceName={activeTeam?.name || 'Department'}
      roleBadge="Head of Department"
      roleColor={purple}
      nav={nav}
      activeTab={tab}
      onTab={t => setTab(t as Tab)}
      onSignOut={signOut}
    >
      {/* Department switcher if HOD manages more than one */}
      {teams.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {teams.map(t => (
            <button key={t.id} onClick={() => setActiveTeamId(t.id)} style={{
              padding: '6px 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 13,
              background: activeTeamId === t.id ? accent : 'rgba(255,255,255,0.08)',
              color: activeTeamId === t.id ? '#fff' : text,
              fontWeight: activeTeamId === t.id ? 600 : 400,
            }}>{t.name}</button>
          ))}
        </div>
      )}

      {/* ── Home ── */}
      {tab === 'home' && (
        <>
          <StatGrid stats={stats} />
          {pendingApps > 0 && (
            <div onClick={() => setTab('applications')} style={{ background: 'rgba(226,109,52,0.1)', border: '1px solid rgba(226,109,52,0.3)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{pendingApps} application{pendingApps > 1 ? 's' : ''} waiting for review</span>
              <span style={{ opacity: 0.6 }}>→</span>
            </div>
          )}
          <div style={{ fontSize: 11, color: sub, marginTop: 16, lineHeight: 1.7 }}>
            You manage <strong style={{ color: text }}>{activeTeam?.name}</strong>. Use the tabs above to manage rooms, schedules, publish content, and broadcast notices to your department.
          </div>
        </>
      )}

      {/* ── Rooms ── */}
      {tab === 'rooms' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Rooms</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>Classrooms, labs, and lecture halls in your department</div>
            </div>
            <button onClick={() => { setRoomForm({ name: '', capacity: '', description: '' }); setEditingRoomId(null); setRoomDrawer(true); }} style={addBtn}>+ Add room</button>
          </div>

          {!activeTeam?.primary_zone_id && (
            <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 10, padding: 14, fontSize: 13, lineHeight: 1.6 }}>
              ⚠️ Your department has no home building assigned. Contact your Space Admin to link a building to this department before adding rooms.
            </div>
          )}

          {rooms.length === 0 && activeTeam?.primary_zone_id && (
            <p style={{ opacity: 0.4, fontSize: 13 }}>No rooms added yet.</p>
          )}

          {rooms.map(r => (
            <div key={r.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  {r.capacity && <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{r.capacity} seats</div>}
                  {r.description && <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{r.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEditRoom(r)} style={ghostBtn}>Edit</button>
                  <button
                    onClick={() => setQrRoom(r)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid rgba(29,158,117,0.4)`, background: 'rgba(29,158,117,0.1)', color: teal, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    Door QR
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add/Edit room drawer */}
          <Drawer open={roomDrawer} onClose={() => { setRoomDrawer(false); setEditingRoomId(null); }} title={editingRoomId ? 'Edit Room' : 'Add a Room'} sub="Rooms get a permanent door QR code for student check-in">
            <label style={lbl}>Room name *</label>
            <input value={roomForm.name} onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Classroom L5, Lab 302" style={inp()} />
            <label style={lbl}>Seating capacity</label>
            <input value={roomForm.capacity} onChange={e => setRoomForm(f => ({ ...f, capacity: e.target.value }))} placeholder="e.g. 40" style={inp()} />
            <label style={lbl}>Notes</label>
            <textarea value={roomForm.description} onChange={e => setRoomForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Projector, AC" style={{ ...inp(), minHeight: 60 }} />
            {!editingRoomId && (
              <div style={{ background: 'rgba(29,158,117,0.08)', border: `1px solid rgba(29,158,117,0.2)`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: sub }}>
                ✓ A permanent door QR code will be generated automatically for student attendance scanning.
              </div>
            )}
            <button onClick={addRoom} disabled={!roomForm.name.trim() || !activeTeam?.primary_zone_id} style={{ ...primaryBtn, opacity: !roomForm.name.trim() || !activeTeam?.primary_zone_id ? 0.5 : 1 }}>
              {editingRoomId ? 'Save changes' : 'Add room & generate QR'}
            </button>
          </Drawer>

          {/* QR modal */}
          {qrRoom && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              onClick={() => setQrRoom(null)}>
              <div style={{ background: panel, borderRadius: 16, padding: 28, width: '100%', maxWidth: 320, textAlign: 'center' }}
                onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{qrRoom.name}</div>
                <div style={{ fontSize: 12, color: sub, marginBottom: 20 }}>Mount at the door for student check-in</div>
                {space && (
                  <>
                    <img src={qrImageUrl(roomQrPayload(space.id, qrRoom.id), 200)} alt="Door QR" style={{ width: 200, height: 200, borderRadius: 8, background: '#fff', padding: 8 }} />
                    <div style={{ marginTop: 16 }}>
                      <a href={qrImageUrl(roomQrPayload(space.id, qrRoom.id), 600)} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'block', padding: '10px', borderRadius: 8, background: accent, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                        Open full-size to print
                      </a>
                      <button onClick={() => setQrRoom(null)} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${border}`, background: 'none', color: text, cursor: 'pointer', fontSize: 13 }}>
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Schedules ── */}
      {tab === 'schedules' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Class Schedules</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>Timetable for courses in this department</div>
            </div>
            <button onClick={() => { setScheduleForm({ ...emptySchedule }); setEditingScheduleId(null); setScheduleDrawer(true); }} style={addBtn}>+ Add class</button>
          </div>

          {schedules.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No schedules yet.</p>}
          {schedules.map(s => {
            const lecturers = scheduleLecturers[s.id] || [];
            return (
              <div key={s.id} style={card}>
                <div style={{ fontWeight: 600 }}>{s.course_name}</div>
                <div style={{ fontSize: 12, color: sub, marginTop: 3 }}>
                  {[s.course_code, s.day_of_week, s.start_time && s.end_time ? `${s.start_time} – ${s.end_time}` : s.start_time].filter(Boolean).join(' · ')}
                </div>
                {s.zone_id && <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{zonePath(s.zone_id, allZones)}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: sub }}>
                    Lecturer: {lecturers.length > 0 ? lecturers.map(l => l.invite_email).join(', ') : 'unassigned'}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEditSchedule(s)} style={ghostBtn}>Edit</button>
                    <button onClick={() => setLecturerDrawerFor(s.id)} style={ghostBtn}>Assign</button>
                  </div>
                </div>
              </div>
            );
          })}

          <Drawer open={!!lecturerDrawerFor} onClose={() => { setLecturerDrawerFor(null); setLecturerInviteEmail(''); }} title="Assign a Lecturer" sub="They'll get their own dashboard for this specific class">
            {lecturerDrawerFor && (scheduleLecturers[lecturerDrawerFor] || []).map(l => (
              <div key={l.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{l.invite_email}</div>
                  <div style={{ fontSize: 11, color: sub }}>{l.user_id ? 'Active' : 'Invited — not yet signed in'}</div>
                </div>
                <button onClick={() => removeLecturer(l.id)} style={ghostBtn}>Remove</button>
              </div>
            ))}
            <label style={lbl}>Email *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={lecturerInviteEmail} onChange={e => setLecturerInviteEmail(e.target.value)} placeholder="lecturer@school.edu" style={{ ...inp(), marginBottom: 0, flex: 1 }} />
              <button onClick={assignLecturer} style={{ ...addBtn, whiteSpace: 'nowrap' }}>Assign</button>
            </div>
          </Drawer>

          <Drawer open={scheduleDrawer} onClose={() => { setScheduleDrawer(false); setEditingScheduleId(null); }} title={editingScheduleId ? 'Edit Class' : 'Add a Class'} sub="Map a course to a room and time slot">
            <label style={lbl}>Course name *</label>
            <input value={scheduleForm.course_name} onChange={e => setScheduleForm(f => ({ ...f, course_name: e.target.value }))} placeholder="e.g. Urban Sociology" style={inp()} />
            <label style={lbl}>Course code</label>
            <input value={scheduleForm.course_code || ''} onChange={e => setScheduleForm(f => ({ ...f, course_code: e.target.value }))} placeholder="e.g. SOC 201" style={inp()} />
            <label style={lbl}>Room</label>
            <select value={scheduleForm.zone_id || ''} onChange={e => setScheduleForm(f => ({ ...f, zone_id: e.target.value }))} style={inp()}>
              <option value="">No room assigned</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <label style={lbl}>Day</label>
            <select value={scheduleForm.day_of_week || ''} onChange={e => setScheduleForm(f => ({ ...f, day_of_week: e.target.value }))} style={inp()}>
              <option value="">Select day</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Start time</label>
                <input type="time" value={scheduleForm.start_time || ''} onChange={e => setScheduleForm(f => ({ ...f, start_time: e.target.value }))} style={inp()} />
              </div>
              <div>
                <label style={lbl}>End time</label>
                <input type="time" value={scheduleForm.end_time || ''} onChange={e => setScheduleForm(f => ({ ...f, end_time: e.target.value }))} style={inp()} />
              </div>
            </div>
            <button onClick={addSchedule} disabled={!scheduleForm.course_name.trim()} style={{ ...primaryBtn, opacity: !scheduleForm.course_name.trim() ? 0.5 : 1 }}>
              {editingScheduleId ? 'Save changes' : 'Add to timetable'}
            </button>
          </Drawer>
        </>
      )}

      {/* ── Publish ── */}
      {tab === 'publish' && (
        <>
          <SubTabs
            active={publishSub}
            onChange={v => setPublishSub(v as PublishSub)}
            tabs={[
              { id: 'opportunities', label: 'Opportunities' },
              { id: 'activities', label: 'Activities' },
              { id: 'resources', label: 'Resources' },
            ]}
          />

          {/* Opportunities sub-tab */}
          {publishSub === 'opportunities' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 600 }}>Opportunities</div>
                <button onClick={() => { setOppForm({ ...emptyOpportunity }); setEditingOppId(null); setOppDrawer(true); }} style={addBtn}>+ Post</button>
              </div>
              {opportunities.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No opportunities posted yet.</p>}
              {opportunities.map(o => (
                <div key={o.id} style={card}>
                  <div style={{ fontWeight: 600 }}>{o.title}</div>
                  <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{o.type}{o.provider ? ` · ${o.provider}` : ''}</div>
                  {o.deadline && <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>Deadline: {new Date(o.deadline).toLocaleDateString()}</div>}
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => openEditOpp(o)} style={ghostBtn}>Edit</button>
                  </div>
                </div>
              ))}
              <Drawer open={oppDrawer} onClose={() => { setOppDrawer(false); setEditingOppId(null); }} title={editingOppId ? 'Edit Opportunity' : 'Post an Opportunity'} sub="TA opening, research role, stipend, scholarship">
                <label style={lbl}>Title *</label>
                <input value={oppForm.title} onChange={e => setOppForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Research Assistantship" style={inp()} />
                <label style={lbl}>Type</label>
                <select value={oppForm.type} onChange={e => setOppForm(f => ({ ...f, type: e.target.value }))} style={inp()}>
                  {OPPORTUNITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <label style={lbl}>Provider</label>
                <input value={oppForm.provider} onChange={e => setOppForm(f => ({ ...f, provider: e.target.value }))} placeholder="Department / unit offering this" style={inp()} />
                <label style={lbl}>Description</label>
                <textarea value={oppForm.description} onChange={e => setOppForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp(), minHeight: 60 }} />
                <label style={lbl}>Eligibility</label>
                <textarea value={oppForm.eligibility} onChange={e => setOppForm(f => ({ ...f, eligibility: e.target.value }))} placeholder="Who can apply?" style={{ ...inp(), minHeight: 50 }} />
                <label style={lbl}>Compensation</label>
                <input value={oppForm.compensation} onChange={e => setOppForm(f => ({ ...f, compensation: e.target.value }))} placeholder="e.g. Ksh 15,000/month or Unpaid" style={inp()} />
                <label style={lbl}>Deadline</label>
                <input type="date" value={oppForm.deadline} onChange={e => setOppForm(f => ({ ...f, deadline: e.target.value }))} style={inp()} />
                <label style={lbl}>How to apply</label>
                <input value={oppForm.application_method} onChange={e => setOppForm(f => ({ ...f, application_method: e.target.value }))} placeholder="Link, email, or instructions" style={inp()} />
                <label style={lbl}>Image</label>
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleOppImg(e.target.files[0])} style={inp()} />
                {uploadingImage && <div style={{ fontSize: 11, color: sub, marginBottom: 8 }}>Uploading…</div>}
                <button onClick={addOpportunity} disabled={!oppForm.title.trim()} style={{ ...primaryBtn, opacity: !oppForm.title.trim() ? 0.5 : 1 }}>
                  {editingOppId ? 'Save changes' : 'Post opportunity'}
                </button>
              </Drawer>
            </>
          )}

          {/* Activities sub-tab */}
          {publishSub === 'activities' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 600 }}>Activities</div>
                <button onClick={() => { setActForm({ ...emptyActivity }); setEditingActId(null); setActDrawer(true); }} style={addBtn}>+ Add</button>
              </div>
              {activities.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No activities yet.</p>}
              {activities.map(a => (
                <div key={a.id} style={card}>
                  <div style={{ fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{a.host}{a.category ? ` · ${a.category}` : ''}</div>
                  {a.start_time && <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{new Date(a.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => openEditAct(a)} style={ghostBtn}>Edit</button>
                  </div>
                </div>
              ))}
              <Drawer open={actDrawer} onClose={() => { setActDrawer(false); setEditingActId(null); }} title={editingActId ? 'Edit Activity' : 'Add an Activity'} sub="Workshop, seminar, meetup, departmental event">
                <label style={lbl}>Title *</label>
                <input value={actForm.title} onChange={e => setActForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Research Methods Workshop" style={inp()} />
                <label style={lbl}>Host</label>
                <input value={actForm.host} onChange={e => setActForm(f => ({ ...f, host: e.target.value }))} style={inp()} />
                <label style={lbl}>Category</label>
                <input value={actForm.category} onChange={e => setActForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Workshop, Seminar, Talk" style={inp()} />
                <label style={lbl}>Description</label>
                <textarea value={actForm.description} onChange={e => setActForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp(), minHeight: 60 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={lbl}>Start</label><input type="datetime-local" value={actForm.start_time} onChange={e => setActForm(f => ({ ...f, start_time: e.target.value }))} style={inp()} /></div>
                  <div><label style={lbl}>End</label><input type="datetime-local" value={actForm.end_time} onChange={e => setActForm(f => ({ ...f, end_time: e.target.value }))} style={inp()} /></div>
                </div>
                <label style={lbl}>Room</label>
                <select value={actForm.zone_id} onChange={e => setActForm(f => ({ ...f, zone_id: e.target.value }))} style={inp()}>
                  <option value="">No specific room</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <label style={lbl}>Capacity</label>
                <input value={actForm.capacity} onChange={e => setActForm(f => ({ ...f, capacity: e.target.value }))} style={inp()} />
                <label style={lbl}>Image</label>
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleActImg(e.target.files[0])} style={inp()} />
                {uploadingImage && <div style={{ fontSize: 11, color: sub, marginBottom: 8 }}>Uploading…</div>}
                <button onClick={addActivity} disabled={!actForm.title.trim()} style={{ ...primaryBtn, opacity: !actForm.title.trim() ? 0.5 : 1 }}>
                  {editingActId ? 'Save changes' : 'Add activity'}
                </button>
              </Drawer>
            </>
          )}

          {/* Resources sub-tab */}
          {publishSub === 'resources' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 600 }}>Resources</div>
                <button onClick={() => { setResForm({ ...emptyResource }); setEditingResId(null); setResDrawer(true); }} style={addBtn}>+ Add</button>
              </div>
              {resources.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No resources yet.</p>}
              {resources.map(r => (
                <div key={r.id} style={card}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{r.owner}</div>
                  {r.availability && <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{r.availability}</div>}
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => openEditRes(r)} style={ghostBtn}>Edit</button>
                  </div>
                </div>
              ))}
              <Drawer open={resDrawer} onClose={() => { setResDrawer(false); setEditingResId(null); }} title={editingResId ? 'Edit Resource' : 'Add a Resource'} sub="Equipment, space, or material available to the department">
                <label style={lbl}>Name *</label>
                <input value={resForm.name} onChange={e => setResForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Projector, Microscope, Meeting Room" style={inp()} />
                <label style={lbl}>Owner / department</label>
                <input value={resForm.owner} onChange={e => setResForm(f => ({ ...f, owner: e.target.value }))} style={inp()} />
                <label style={lbl}>Description</label>
                <textarea value={resForm.description} onChange={e => setResForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp(), minHeight: 50 }} />
                <label style={lbl}>Availability</label>
                <input value={resForm.availability} onChange={e => setResForm(f => ({ ...f, availability: e.target.value }))} placeholder="e.g. Mon–Fri 9am–5pm" style={inp()} />
                <label style={lbl}>Capacity</label>
                <input value={resForm.capacity} onChange={e => setResForm(f => ({ ...f, capacity: e.target.value }))} style={inp()} />
                <label style={lbl}>Image</label>
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleResImg(e.target.files[0])} style={inp()} />
                {uploadingImage && <div style={{ fontSize: 11, color: sub, marginBottom: 8 }}>Uploading…</div>}
                <button onClick={addResource} disabled={!resForm.name.trim()} style={{ ...primaryBtn, opacity: !resForm.name.trim() ? 0.5 : 1 }}>
                  {editingResId ? 'Save changes' : 'Add resource'}
                </button>
              </Drawer>
            </>
          )}
        </>
      )}

      {/* ── Applications ── */}
      {tab === 'applications' && (
        <ApplicationsPanel applications={applications} updateApplicationStatus={updateApplicationStatus} />
      )}

      {/* ── Announcements ── */}
      {tab === 'announcements' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Notices</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>Broadcast updates to students in this department</div>
            </div>
            <button onClick={() => { setAnnForm({ ...emptyAnnouncement }); setEditingAnnId(null); setAnnDrawer(true); }} style={addBtn}>+ Post notice</button>
          </div>
          {announcements.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No notices yet.</p>}
          {announcements.map(a => (
            <div key={a.id} style={card}>
              <div style={{ fontWeight: 600 }}>{a.title}</div>
              {a.body && <div style={{ fontSize: 13, color: sub, marginTop: 6, lineHeight: 1.6 }}>{a.body}</div>}
              <div style={{ fontSize: 11, color: sub, marginTop: 6, opacity: 0.5 }}>{new Date(a.created_at).toLocaleDateString()}</div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => openEditAnn(a)} style={ghostBtn}>Edit</button>
              </div>
            </div>
          ))}
          <Drawer open={annDrawer} onClose={() => { setAnnDrawer(false); setEditingAnnId(null); }} title={editingAnnId ? 'Edit Notice' : 'Post a Notice'} sub="Goes directly to students registered in this department">
            <label style={lbl}>Title *</label>
            <input value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. CAT postponed to Friday" style={inp()} />
            <label style={lbl}>Body</label>
            <textarea value={annForm.body || ''} onChange={e => setAnnForm(f => ({ ...f, body: e.target.value }))} placeholder="Optional details…" style={{ ...inp(), minHeight: 80 }} />
            <button onClick={addAnnouncement} disabled={!annForm.title.trim()} style={{ ...primaryBtn, opacity: !annForm.title.trim() ? 0.5 : 1 }}>
              {editingAnnId ? 'Save changes' : 'Post notice'}
            </button>
          </Drawer>
        </>
      )}
    </OperatorShell>
  );
}


