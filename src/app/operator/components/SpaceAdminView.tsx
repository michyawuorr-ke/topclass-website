'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Org, Space, Zone, Team, TeamLead, Item, Application, SpaceAdmin, AccessRequest,
  emptyOpportunity, emptyResource, emptyActivity, emptyTeam,
  OPPORTUNITY_TYPES,
} from '../types';
import { OperatorShell } from './OperatorShell';
import { StatGrid, Stat } from './StatGrid';
import { ApplicationsPanel } from './ApplicationsPanel';

type Tab = 'home' | 'departments' | 'buildings' | 'publish' | 'applications';
type PublishSub = 'opportunities' | 'activities' | 'resources';

// ── primitives (matches HODView's palette) ─────────────────────────────────
const panel = '#1C1C2E';
const border = 'rgba(255,255,255,0.08)';
const accent = '#E26D34';
const teal = '#1D9E75';
const gold = '#D4AF37';
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
const ghostBtn: React.CSSProperties = { padding: '7px 12px', borderRadius: 8, border: `1px solid ${border}`, background: 'none', color: text, cursor: 'pointer', fontSize: 12 };

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

export function SpaceAdminView({ org, space, signOut }: { org: Org | null; space: Space; signOut: () => void }) {
  const [tab, setTab] = useState<Tab>('home');
  const [publishSub, setPublishSub] = useState<PublishSub>('opportunities');

  // Data
  const [zones, setZones] = useState<Zone[]>([]); // all zones (buildings = top-level ones)
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamLeadsByTeam, setTeamLeadsByTeam] = useState<Record<string, TeamLead[]>>({});
  const [opportunities, setOpportunities] = useState<Item[]>([]);
  const [resources, setResources] = useState<Item[]>([]);
  const [activities, setActivities] = useState<Item[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [pendingApps, setPendingApps] = useState(0);
  const [spaceAdmins, setSpaceAdmins] = useState<SpaceAdmin[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const buildings = zones.filter(z => !z.parent_zone_id);

  // Drawers
  const [deptDrawer, setDeptDrawer] = useState(false);
  const [deptDetail, setDeptDetail] = useState<Team | null>(null);
  const [buildingDrawer, setBuildingDrawer] = useState(false);
  const [oppDrawer, setOppDrawer] = useState(false);
  const [actDrawer, setActDrawer] = useState(false);
  const [resDrawer, setResDrawer] = useState(false);

  // Forms
  const [deptForm, setDeptForm] = useState({ ...emptyTeam });
  const [buildingForm, setBuildingForm] = useState({ name: '', building_tag: '' });
  const [leadInviteEmail, setLeadInviteEmail] = useState('');
  const [oppForm, setOppForm] = useState({ ...emptyOpportunity });
  const [actForm, setActForm] = useState({ ...emptyActivity });
  const [resForm, setResForm] = useState({ ...emptyResource });
  const [zoneAdminInviteEmail, setZoneAdminInviteEmail] = useState('');

  useEffect(() => { loadAll(); }, [space.id]);

  const loadAll = async () => {
    const [{ data: z }, { data: tm }, { data: opps }, { data: res }, { data: acts }, { count: present }] = await Promise.all([
      supabase.from('zones').select('*').eq('space_id', space.id),
      supabase.from('teams').select('*').eq('space_id', space.id),
      supabase.from('opportunities').select('*').eq('space_id', space.id).is('team_id', null),
      supabase.from('resources').select('*').eq('space_id', space.id).is('team_id', null),
      supabase.from('activities').select('*').eq('space_id', space.id).is('team_id', null),
      supabase.from('presence').select('id', { count: 'exact', head: true }).eq('space_id', space.id),
    ]);
    setZones(z || []);
    setTeams(tm || []);
    setOpportunities(opps || []);
    setResources(res || []);
    setActivities(acts || []);

    const teamIds = (tm || []).map((t: any) => t.id);
    if (teamIds.length > 0) {
      const { data: leads } = await supabase.from('team_leads').select('*').in('team_id', teamIds);
      const byTeam: Record<string, TeamLead[]> = {};
      (leads || []).forEach((l: any) => { (byTeam[l.team_id] ||= []).push(l); });
      setTeamLeadsByTeam(byTeam);
    } else {
      setTeamLeadsByTeam({});
    }

    const { data: opps2 } = await supabase.from('opportunities').select('id').eq('space_id', space.id);
    const oppIds = (opps2 || []).map((o: any) => o.id);
    let apps: any[] = [], pending = 0;
    if (oppIds.length > 0) {
      const { data: a } = await supabase.from('opportunity_applications')
        .select('*, opportunities(title), profiles(name, title, domain)').in('opportunity_id', oppIds).order('created_at', { ascending: false });
      apps = a || [];
      pending = apps.filter((x: any) => x.status === 'applied').length;
    }
    setApplications(apps);
    setPendingApps(pending);

    setStats([
      { label: 'Present now', value: present || 0 },
      { label: 'Departments', value: (tm || []).length },
      { label: 'Buildings', value: (z || []).filter((zz: any) => !zz.parent_zone_id).length },
      { label: 'Pending applications', value: pending, accent: pending > 0 },
    ]);

    const [{ data: admins }, { data: reqs }] = await Promise.all([
      supabase.from('space_admins').select('*').eq('space_id', space.id),
      supabase.from('access_requests').select('*').eq('space_id', space.id).eq('status', 'pending'),
    ]);
    setSpaceAdmins(admins || []);
    setPendingRequests(reqs || []);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('toruok-media').upload(path, file);
    if (error) { window.alert(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from('toruok-media').getPublicUrl(path);
    return data.publicUrl;
  };

  // ── Departments ──
  const addDepartment = async () => {
    if (!deptForm.name.trim()) return;
    const { error } = await supabase.from('teams').insert({
      space_id: space.id, name: deptForm.name.trim(), type: 'department',
      description: deptForm.description || null, capacity: deptForm.capacity || null,
      primary_zone_id: deptForm.primary_zone_id || null,
    });
    if (error) { window.alert(error.message); return; }
    setDeptForm({ ...emptyTeam }); setDeptDrawer(false); loadAll();
  };
  const inviteHod = async () => {
    if (!deptDetail || !leadInviteEmail.trim()) return;
    const { error } = await supabase.from('team_leads').insert({ team_id: deptDetail.id, invite_email: leadInviteEmail.trim() });
    if (error) { window.alert(error.message); return; }
    setLeadInviteEmail(''); loadAll();
  };

  // ── Buildings ──
  const addBuilding = async () => {
    if (!buildingForm.name.trim()) return;
    const { error } = await supabase.from('zones').insert({ space_id: space.id, name: buildingForm.name.trim(), building_tag: buildingForm.building_tag || null });
    if (error) { window.alert(error.message); return; }
    setBuildingForm({ name: '', building_tag: '' }); setBuildingDrawer(false); loadAll();
  };

  // ── Publish (space-wide, not department-scoped) ──
  const addOpportunity = async () => {
    if (!oppForm.title.trim()) return;
    const { error } = await supabase.from('opportunities').insert({
      space_id: space.id, title: oppForm.title, type: oppForm.type,
      provider: oppForm.provider || null, description: oppForm.description || null,
      eligibility: oppForm.eligibility || null, compensation: oppForm.compensation || null,
      deadline: oppForm.deadline ? new Date(oppForm.deadline).toISOString() : null,
      application_method: oppForm.application_method || null, zone_id: oppForm.zone_id || null,
      location: oppForm.location || null, status: oppForm.status, image_url: oppForm.image_url || null,
    });
    if (error) { window.alert(error.message); return; }
    setOppForm({ ...emptyOpportunity }); setOppDrawer(false); loadAll();
  };
  const handleOppImg = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setOppForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };

  const addActivity = async () => {
    if (!actForm.title.trim()) return;
    const { error } = await supabase.from('activities').insert({
      space_id: space.id, title: actForm.title, host: actForm.host || null, description: actForm.description || null,
      category: actForm.category || null,
      start_time: actForm.start_time ? new Date(actForm.start_time).toISOString() : null,
      end_time: actForm.end_time ? new Date(actForm.end_time).toISOString() : null,
      zone_id: actForm.zone_id || null, capacity: actForm.capacity || null,
      registration_link: actForm.registration_link || null, image_url: actForm.image_url || null,
    });
    if (error) { window.alert(error.message); return; }
    setActForm({ ...emptyActivity }); setActDrawer(false); loadAll();
  };
  const handleActImg = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setActForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };

  const addResource = async () => {
    if (!resForm.name.trim()) return;
    const { error } = await supabase.from('resources').insert({
      space_id: space.id, name: resForm.name, owner: resForm.owner || null, description: resForm.description || null,
      availability: resForm.availability || null, capacity: resForm.capacity || null,
      zone_id: resForm.zone_id || null, image_url: resForm.image_url || null,
    });
    if (error) { window.alert(error.message); return; }
    setResForm({ ...emptyResource }); setResDrawer(false); loadAll();
  };
  const handleResImg = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setResForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };

  const updateApplicationStatus = async (id: string, status: string) => {
    await supabase.from('opportunity_applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setPendingApps(prev => status !== 'applied' ? Math.max(0, prev - 1) : prev);
  };

  const inviteZoneAdmin = async () => {
    if (!zoneAdminInviteEmail.trim()) return;
    const { error } = await supabase.from('space_admins').insert({ space_id: space.id, invite_email: zoneAdminInviteEmail.trim() });
    if (error) { window.alert(error.message); return; }
    setZoneAdminInviteEmail(''); loadAll();
  };
  const approveRequest = async (id: string) => {
    const { error } = await supabase.rpc('approve_access_request', { request_id: id });
    if (error) { window.alert(error.message); return; }
    loadAll();
  };
  const denyRequest = async (id: string) => {
    const { error } = await supabase.rpc('deny_access_request', { request_id: id });
    if (error) { window.alert(error.message); return; }
    loadAll();
  };

  const nav = [
    { id: 'home',         label: 'Home',         icon: '◈' },
    { id: 'departments',  label: 'Departments',  icon: '🎓', badge: teams.length },
    { id: 'buildings',    label: 'Buildings',    icon: '🏛', badge: buildings.length },
    { id: 'publish',      label: 'Publish',      icon: '✦' },
    { id: 'applications', label: 'Applications', icon: '📋', badge: pendingApps },
  ];

  return (
    <OperatorShell
      orgName={org?.name || 'Operator'}
      spaceName={space.name}
      roleBadge="Space Admin"
      roleColor={gold}
      nav={nav}
      activeTab={tab}
      onTab={t => setTab(t as Tab)}
      onSignOut={signOut}
    >
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

          <div style={{ fontWeight: 700, fontSize: 15, margin: '24px 0 12px' }}>Zone admins</div>
          {pendingRequests.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: sub, marginBottom: 6 }}>Pending access requests</div>
              {pendingRequests.map(r => (
                <div key={r.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.requester_email}</div>
                    {r.note && <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{r.note}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => approveRequest(r.id)} style={{ ...ghostBtn, borderColor: teal, color: teal }}>Approve</button>
                    <button onClick={() => denyRequest(r.id)} style={ghostBtn}>Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: sub, marginBottom: 6 }}>Zone admins</div>
          {spaceAdmins.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>Just you, so far.</p>}
          {spaceAdmins.map(a => (
            <div key={a.id} style={card}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{a.invite_email}</div>
              <div style={{ fontSize: 11, color: sub }}>{a.user_id ? 'Active' : 'Invited — not yet signed in'}</div>
            </div>
          ))}
          <label style={lbl}>Invite a zone admin</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={zoneAdminInviteEmail} onChange={e => setZoneAdminInviteEmail(e.target.value)} placeholder="zoneadmin@school.edu" style={{ ...inp(), marginBottom: 0, flex: 1 }} />
            <button onClick={inviteZoneAdmin} style={{ ...addBtn, whiteSpace: 'nowrap' }}>Invite</button>
          </div>
        </>
      )}

      {/* ── Departments ── */}
      {tab === 'departments' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Departments</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>Academic units — each gets a Head of Department</div>
            </div>
            <button onClick={() => setDeptDrawer(true)} style={addBtn}>+ Add department</button>
          </div>

          {teams.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No departments yet.</p>}
          {teams.map(t => {
            const leads = teamLeadsByTeam[t.id] || [];
            const building = zones.find(z => z.id === t.primary_zone_id);
            return (
              <div key={t.id} onClick={() => setDeptDetail(t)} style={{ ...card, cursor: 'pointer' }}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: sub, marginTop: 3 }}>
                  {building ? building.name : 'No building assigned'}{t.capacity ? ` · ${t.capacity} capacity` : ''}
                </div>
                <div style={{ fontSize: 11, color: sub, marginTop: 3 }}>
                  HOD: {leads.length > 0 ? leads.map(l => l.invite_email).join(', ') : 'unassigned'}
                </div>
              </div>
            );
          })}

          <Drawer open={deptDrawer} onClose={() => setDeptDrawer(false)} title="Add a Department" sub="An academic unit — e.g. Department of Sociology">
            <label style={lbl}>Name *</label>
            <input value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Department of Sociology" style={inp()} />
            <label style={lbl}>Description</label>
            <textarea value={deptForm.description} onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp(), minHeight: 60 }} />
            <label style={lbl}>Capacity</label>
            <input value={deptForm.capacity} onChange={e => setDeptForm(f => ({ ...f, capacity: e.target.value }))} placeholder="e.g. 300 students" style={inp()} />
            <label style={lbl}>Building</label>
            <select value={deptForm.primary_zone_id} onChange={e => setDeptForm(f => ({ ...f, primary_zone_id: e.target.value }))} style={inp()}>
              <option value="">No building assigned</option>
              {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {buildings.length === 0 && <div style={{ fontSize: 11, color: sub, marginBottom: 12 }}>No buildings yet — add one in the Buildings tab first, or assign this later.</div>}
            <button onClick={addDepartment} disabled={!deptForm.name.trim()} style={{ ...primaryBtn, opacity: !deptForm.name.trim() ? 0.5 : 1 }}>
              Create department
            </button>
            <div style={{ fontSize: 11, color: sub }}>You'll invite the Head of Department after creating it — open the department to do that.</div>
          </Drawer>

          {/* Department detail drawer */}
          <Drawer open={!!deptDetail} onClose={() => { setDeptDetail(null); setLeadInviteEmail(''); }} title={deptDetail?.name || ''} sub={deptDetail?.description || undefined}>
            {deptDetail && (
              <>
                <div style={{ fontSize: 12, color: sub, marginBottom: 16 }}>
                  {zones.find(z => z.id === deptDetail.primary_zone_id)?.name || 'No building assigned'}
                  {deptDetail.capacity ? ` · ${deptDetail.capacity} capacity` : ''}
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Head of Department</div>
                {(teamLeadsByTeam[deptDetail.id] || []).length === 0 && <p style={{ opacity: 0.4, fontSize: 13, marginBottom: 12 }}>None assigned yet.</p>}
                {(teamLeadsByTeam[deptDetail.id] || []).map(l => (
                  <div key={l.id} style={card}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{l.invite_email}</div>
                    <div style={{ fontSize: 11, color: sub }}>{l.user_id ? 'Active' : 'Invited — not yet signed in'}</div>
                  </div>
                ))}
                <label style={lbl}>Invite HOD by email</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={leadInviteEmail} onChange={e => setLeadInviteEmail(e.target.value)} placeholder="hod@school.edu" style={{ ...inp(), marginBottom: 0, flex: 1 }} />
                  <button onClick={inviteHod} style={{ ...addBtn, whiteSpace: 'nowrap' }}>Invite</button>
                </div>
                <div style={{ fontSize: 11, color: sub, marginTop: 12 }}>
                  Once they sign in with that email, they get their own dashboard for this department — rooms, schedules, publishing, and notices.
                </div>
              </>
            )}
          </Drawer>
        </>
      )}

      {/* ── Buildings ── */}
      {tab === 'buildings' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Buildings</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>Register the buildings/blocks on campus — departments reference these</div>
            </div>
            <button onClick={() => setBuildingDrawer(true)} style={addBtn}>+ Add building</button>
          </div>

          {buildings.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No buildings yet.</p>}
          {buildings.map(b => (
            <div key={b.id} style={card}>
              <div style={{ fontWeight: 600 }}>{b.name}</div>
              {b.building_tag && <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{b.building_tag}</div>}
              <div style={{ fontSize: 11, color: sub, marginTop: 4 }}>
                {teams.filter(t => t.primary_zone_id === b.id).length} department{teams.filter(t => t.primary_zone_id === b.id).length === 1 ? '' : 's'}
              </div>
            </div>
          ))}

          <Drawer open={buildingDrawer} onClose={() => setBuildingDrawer(false)} title="Add a Building" sub="A block, hall, or standalone building on campus">
            <label style={lbl}>Name *</label>
            <input value={buildingForm.name} onChange={e => setBuildingForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Chiromo Campus, Block C" style={inp()} />
            <label style={lbl}>Building tag</label>
            <input value={buildingForm.building_tag} onChange={e => setBuildingForm(f => ({ ...f, building_tag: e.target.value }))} placeholder="e.g. Main Campus" style={inp()} />
            <button onClick={addBuilding} disabled={!buildingForm.name.trim()} style={{ ...primaryBtn, opacity: !buildingForm.name.trim() ? 0.5 : 1 }}>
              Add building
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

          {publishSub === 'opportunities' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 600 }}>Opportunities</div>
                <button onClick={() => setOppDrawer(true)} style={addBtn}>+ Post</button>
              </div>
              {opportunities.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No space-wide opportunities posted yet.</p>}
              {opportunities.map(o => (
                <div key={o.id} style={card}>
                  <div style={{ fontWeight: 600 }}>{o.title}</div>
                  <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{o.type}{o.provider ? ` · ${o.provider}` : ''}</div>
                  {o.deadline && <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>Deadline: {new Date(o.deadline).toLocaleDateString()}</div>}
                </div>
              ))}
              <Drawer open={oppDrawer} onClose={() => setOppDrawer(false)} title="Post an Opportunity" sub="Space-wide — visible regardless of department">
                <label style={lbl}>Title *</label>
                <input value={oppForm.title} onChange={e => setOppForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. University-wide Innovation Grant" style={inp()} />
                <label style={lbl}>Type</label>
                <select value={oppForm.type} onChange={e => setOppForm(f => ({ ...f, type: e.target.value }))} style={inp()}>
                  {OPPORTUNITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <label style={lbl}>Provider</label>
                <input value={oppForm.provider} onChange={e => setOppForm(f => ({ ...f, provider: e.target.value }))} style={inp()} />
                <label style={lbl}>Description</label>
                <textarea value={oppForm.description} onChange={e => setOppForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp(), minHeight: 60 }} />
                <label style={lbl}>Eligibility</label>
                <textarea value={oppForm.eligibility} onChange={e => setOppForm(f => ({ ...f, eligibility: e.target.value }))} style={{ ...inp(), minHeight: 50 }} />
                <label style={lbl}>Compensation</label>
                <input value={oppForm.compensation} onChange={e => setOppForm(f => ({ ...f, compensation: e.target.value }))} style={inp()} />
                <label style={lbl}>Deadline</label>
                <input type="date" value={oppForm.deadline} onChange={e => setOppForm(f => ({ ...f, deadline: e.target.value }))} style={inp()} />
                <label style={lbl}>How to apply</label>
                <input value={oppForm.application_method} onChange={e => setOppForm(f => ({ ...f, application_method: e.target.value }))} style={inp()} />
                <label style={lbl}>Building</label>
                <select value={oppForm.zone_id} onChange={e => setOppForm(f => ({ ...f, zone_id: e.target.value }))} style={inp()}>
                  <option value="">Not set</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <label style={lbl}>Image</label>
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleOppImg(e.target.files[0])} style={inp()} />
                {uploadingImage && <div style={{ fontSize: 11, color: sub, marginBottom: 8 }}>Uploading…</div>}
                <button onClick={addOpportunity} disabled={!oppForm.title.trim()} style={{ ...primaryBtn, opacity: !oppForm.title.trim() ? 0.5 : 1 }}>
                  Post opportunity
                </button>
              </Drawer>
            </>
          )}

          {publishSub === 'activities' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 600 }}>Activities</div>
                <button onClick={() => setActDrawer(true)} style={addBtn}>+ Add</button>
              </div>
              {activities.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No space-wide activities yet.</p>}
              {activities.map(a => (
                <div key={a.id} style={card}>
                  <div style={{ fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{a.host}{a.category ? ` · ${a.category}` : ''}</div>
                  {a.start_time && <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{new Date(a.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                </div>
              ))}
              <Drawer open={actDrawer} onClose={() => setActDrawer(false)} title="Add an Activity" sub="Space-wide — visible regardless of department">
                <label style={lbl}>Title *</label>
                <input value={actForm.title} onChange={e => setActForm(f => ({ ...f, title: e.target.value }))} style={inp()} />
                <label style={lbl}>Host</label>
                <input value={actForm.host} onChange={e => setActForm(f => ({ ...f, host: e.target.value }))} style={inp()} />
                <label style={lbl}>Category</label>
                <input value={actForm.category} onChange={e => setActForm(f => ({ ...f, category: e.target.value }))} style={inp()} />
                <label style={lbl}>Description</label>
                <textarea value={actForm.description} onChange={e => setActForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp(), minHeight: 60 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={lbl}>Start</label><input type="datetime-local" value={actForm.start_time} onChange={e => setActForm(f => ({ ...f, start_time: e.target.value }))} style={inp()} /></div>
                  <div><label style={lbl}>End</label><input type="datetime-local" value={actForm.end_time} onChange={e => setActForm(f => ({ ...f, end_time: e.target.value }))} style={inp()} /></div>
                </div>
                <label style={lbl}>Building</label>
                <select value={actForm.zone_id} onChange={e => setActForm(f => ({ ...f, zone_id: e.target.value }))} style={inp()}>
                  <option value="">Not set</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <label style={lbl}>Capacity</label>
                <input value={actForm.capacity} onChange={e => setActForm(f => ({ ...f, capacity: e.target.value }))} style={inp()} />
                <label style={lbl}>Image</label>
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleActImg(e.target.files[0])} style={inp()} />
                {uploadingImage && <div style={{ fontSize: 11, color: sub, marginBottom: 8 }}>Uploading…</div>}
                <button onClick={addActivity} disabled={!actForm.title.trim()} style={{ ...primaryBtn, opacity: !actForm.title.trim() ? 0.5 : 1 }}>
                  Add activity
                </button>
              </Drawer>
            </>
          )}

          {publishSub === 'resources' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 600 }}>Resources</div>
                <button onClick={() => setResDrawer(true)} style={addBtn}>+ Add</button>
              </div>
              {resources.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No space-wide resources yet.</p>}
              {resources.map(r => (
                <div key={r.id} style={card}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{r.owner}</div>
                  {r.availability && <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{r.availability}</div>}
                </div>
              ))}
              <Drawer open={resDrawer} onClose={() => setResDrawer(false)} title="Add a Resource" sub="Space-wide — visible regardless of department">
                <label style={lbl}>Name *</label>
                <input value={resForm.name} onChange={e => setResForm(f => ({ ...f, name: e.target.value }))} style={inp()} />
                <label style={lbl}>Owner</label>
                <input value={resForm.owner} onChange={e => setResForm(f => ({ ...f, owner: e.target.value }))} style={inp()} />
                <label style={lbl}>Description</label>
                <textarea value={resForm.description} onChange={e => setResForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp(), minHeight: 50 }} />
                <label style={lbl}>Availability</label>
                <input value={resForm.availability} onChange={e => setResForm(f => ({ ...f, availability: e.target.value }))} style={inp()} />
                <label style={lbl}>Capacity</label>
                <input value={resForm.capacity} onChange={e => setResForm(f => ({ ...f, capacity: e.target.value }))} style={inp()} />
                <label style={lbl}>Image</label>
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleResImg(e.target.files[0])} style={inp()} />
                {uploadingImage && <div style={{ fontSize: 11, color: sub, marginBottom: 8 }}>Uploading…</div>}
                <button onClick={addResource} disabled={!resForm.name.trim()} style={{ ...primaryBtn, opacity: !resForm.name.trim() ? 0.5 : 1 }}>
                  Add resource
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
    </OperatorShell>
  );
}

