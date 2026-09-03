'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Org, Space, Zone, Item, SpaceAdmin, ZonePublisher, AccessRequest, Application,
  Team, TeamLead, TeamOperator, Schedule, Announcement,
  emptyOpportunity, emptyResource, emptyActivity, emptyTeam, emptySchedule, emptyAnnouncement,
  zonePath, genJoinCode,
} from '../types';
import { OperatorShell } from './OperatorShell';
import { StatGrid, Stat } from './StatGrid';
import { SectionHeader } from './SectionHeader';
import { ZonesPanel } from './ZonesPanel';
import { OpportunitiesPanel } from './OpportunitiesPanel';
import { ResourcesPanel } from './ResourcesPanel';
import { ActivitiesPanel } from './ActivitiesPanel';
import { ApplicationsPanel } from './ApplicationsPanel';
import { PeoplePanel } from './PeoplePanel';
import { SpaceTeamPanel } from './SpaceTeamPanel';
import { TeamsPanel } from './TeamsPanel';

type Tab = 'home' | 'people' | 'zones' | 'teams' | 'opportunities' | 'applications' | 'resources' | 'activities' | 'admins';

export function SpaceAdminView({ org, space, signOut }: { org: Org | null; space: Space; signOut: () => void }) {
  const [tab, setTab] = useState<Tab>('home');
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneForm, setZoneForm] = useState({ name: '', description: '', capacity: '', parent_zone_id: '', building_tag: '' });
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamForm, setTeamForm] = useState({ ...emptyTeam });
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [teamLeads, setTeamLeads] = useState<TeamLead[]>([]);
  const [teamOperators, setTeamOperators] = useState<TeamOperator[]>([]);
  const [teamSchedules, setTeamSchedules] = useState<Schedule[]>([]);
  const [teamOpportunities, setTeamOpportunities] = useState<Item[]>([]);
  const [teamAnnouncements, setTeamAnnouncements] = useState<Announcement[]>([]);
  const [teamRoster, setTeamRoster] = useState<any[]>([]);
  const [leadInviteEmail, setLeadInviteEmail] = useState('');
  const [operatorInviteEmail, setOperatorInviteEmail] = useState('');
  const [scheduleForm, setScheduleForm] = useState({ ...emptySchedule });
  const [teamOppForm, setTeamOppForm] = useState({ ...emptyOpportunity });
  const [annForm, setAnnForm] = useState({ ...emptyAnnouncement });
  const [opportunities, setOpportunities] = useState<Item[]>([]);
  const [oppForm, setOppForm] = useState({ ...emptyOpportunity });
  const [resources, setResources] = useState<Item[]>([]);
  const [resForm, setResForm] = useState({ ...emptyResource });
  const [activities, setActivities] = useState<Item[]>([]);
  const [actForm, setActForm] = useState({ ...emptyActivity });
  const [applications, setApplications] = useState<Application[]>([]);
  const [presentPeople, setPresentPeople] = useState<any[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [pendingApps, setPendingApps] = useState(0);
  const [spaceAdmins, setSpaceAdmins] = useState<SpaceAdmin[]>([]);
  const [spaceAdminInviteEmail, setSpaceAdminInviteEmail] = useState('');
  const [zonePublishers, setZonePublishers] = useState<ZonePublisher[]>([]);
  const [zonePublisherInviteEmail, setZonePublisherInviteEmail] = useState('');
  const [zonePublisherZoneId, setZonePublisherZoneId] = useState('');
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => { loadAll(); }, [space.id]);

  const loadAll = async () => {
    const [{ data: z }, { data: opps }, { data: res }, { data: acts }, { data: pres }, { data: tm }] = await Promise.all([
      supabase.from('zones').select('*').eq('space_id', space.id),
      supabase.from('opportunities').select('*').eq('space_id', space.id),
      supabase.from('resources').select('*').eq('space_id', space.id),
      supabase.from('activities').select('*').eq('space_id', space.id),
      supabase.from('presence').select('*, profiles(name, title, domain, capabilities, standing_need)').eq('space_id', space.id),
      supabase.from('teams').select('*').eq('space_id', space.id),
    ]);
    setZones(z || []);
    setOpportunities(opps || []);
    setResources(res || []);
    setActivities(acts || []);
    setPresentPeople(pres || []);
    setTeams(tm || []);

    const oppIds = (opps || []).map((o: any) => o.id);
    let apps: any[] = [], pending = 0;
    if (oppIds.length > 0) {
      const { data: a } = await supabase.from('opportunity_applications')
        .select('*, opportunities(title), profiles(name, title, domain)').in('opportunity_id', oppIds).order('created_at', { ascending: false });
      apps = a || [];
      pending = apps.filter(x => x.status === 'applied').length;
    }
    setApplications(apps);
    setPendingApps(pending);

    const nowIso = new Date().toISOString();
    const { count: upcoming } = await supabase.from('activities').select('id', { count: 'exact', head: true }).eq('space_id', space.id).gt('start_time', nowIso);
    const { data: connCount } = await supabase.rpc('count_space_connections', { check_space_id: space.id });

    setStats([
      { label: 'Present now', value: (pres || []).length },
      { label: 'Connections made', value: typeof connCount === 'number' ? connCount : 0 },
      { label: 'Upcoming activities', value: upcoming || 0 },
      { label: 'Pending applications', value: pending, accent: pending > 0 },
    ]);

    // Space team
    const [{ data: admins }, { data: publishers }, { data: reqs }] = await Promise.all([
      supabase.from('space_admins').select('*').eq('space_id', space.id),
      supabase.from('zone_publishers').select('*, zones!inner(space_id)').eq('zones.space_id', space.id),
      supabase.from('access_requests').select('*').eq('space_id', space.id).eq('status', 'pending'),
    ]);
    setSpaceAdmins(admins || []);
    setZonePublishers(publishers || []);
    setPendingRequests(reqs || []);
  };

  const addZone = async () => {
    if (!zoneForm.name.trim()) return;
    const { error } = await supabase.from('zones').insert({ space_id: space.id, name: zoneForm.name, description: zoneForm.description || null, capacity: zoneForm.capacity || null, parent_zone_id: zoneForm.parent_zone_id || null, building_tag: zoneForm.building_tag || null });
    if (error) { window.alert(error.message); return; }
    setZoneForm({ name: '', description: '', capacity: '', parent_zone_id: '', building_tag: '' });
    const { data } = await supabase.from('zones').select('*').eq('space_id', space.id);
    setZones(data || []);
  };

  const addTeam = async () => {
    if (!teamForm.name.trim()) return;
    const { error } = await supabase.from('teams').insert({
      space_id: space.id, name: teamForm.name.trim(), type: teamForm.type,
      description: teamForm.description || null, primary_zone_id: teamForm.primary_zone_id || null,
      join_code: genJoinCode(),
    });
    if (error) { window.alert(error.message); return; }
    setTeamForm({ ...emptyTeam });
    const { data } = await supabase.from('teams').select('*').eq('space_id', space.id);
    setTeams(data || []);
  };

  const loadTeamDetail = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    const [{ data: leads }, { data: ops }, { data: sched }, { data: opps }, { data: anns }] = await Promise.all([
      supabase.from('team_leads').select('*').eq('team_id', teamId),
      supabase.from('team_operators').select('*').eq('team_id', teamId),
      supabase.from('schedules').select('*').eq('team_id', teamId),
      supabase.from('opportunities').select('*').eq('team_id', teamId),
      supabase.from('announcements').select('*').eq('team_id', teamId).order('created_at', { ascending: false }),
    ]);
    setTeamLeads(leads || []);
    setTeamOperators(ops || []);
    setTeamSchedules(sched || []);
    setTeamOpportunities(opps || []);
    setTeamAnnouncements(anns || []);
    if (team?.primary_zone_id) {
      const { data: roster } = await supabase.from('presence').select('*, profiles(name, title, domain)').eq('zone_id', team.primary_zone_id);
      setTeamRoster(roster || []);
    } else {
      setTeamRoster([]);
    }
  };

  const selectTeam = (id: string | null) => {
    setActiveTeamId(id);
    if (id) loadTeamDetail(id);
  };

  const inviteTeamLead = async () => {
    if (!activeTeamId || !leadInviteEmail.trim()) return;
    const { error } = await supabase.from('team_leads').insert({ team_id: activeTeamId, invite_email: leadInviteEmail.trim() });
    if (error) { window.alert(error.message); return; }
    setLeadInviteEmail(''); loadTeamDetail(activeTeamId);
  };
  const inviteTeamOperator = async () => {
    if (!activeTeamId || !operatorInviteEmail.trim()) return;
    const { error } = await supabase.from('team_operators').insert({ team_id: activeTeamId, invite_email: operatorInviteEmail.trim() });
    if (error) { window.alert(error.message); return; }
    setOperatorInviteEmail(''); loadTeamDetail(activeTeamId);
  };
  const addSchedule = async () => {
    if (!activeTeamId || !scheduleForm.course_name.trim()) return;
    const { error } = await supabase.from('schedules').insert({
      team_id: activeTeamId, course_code: scheduleForm.course_code || null, course_name: scheduleForm.course_name,
      zone_id: scheduleForm.zone_id || null, day_of_week: scheduleForm.day_of_week || null,
      start_time: scheduleForm.start_time || null, end_time: scheduleForm.end_time || null,
    });
    if (error) { window.alert(error.message); return; }
    setScheduleForm({ ...emptySchedule }); loadTeamDetail(activeTeamId);
  };
  const addTeamOpportunity = async () => {
    if (!activeTeamId || !teamOppForm.title.trim()) return;
    const { error } = await supabase.from('opportunities').insert({
      space_id: space.id, team_id: activeTeamId, title: teamOppForm.title, type: teamOppForm.type,
      provider: teamOppForm.provider || null, description: teamOppForm.description || null,
      eligibility: teamOppForm.eligibility || null, compensation: teamOppForm.compensation || null,
      deadline: teamOppForm.deadline ? new Date(teamOppForm.deadline).toISOString() : null,
      application_method: teamOppForm.application_method || null, zone_id: teamOppForm.zone_id || null,
      location: teamOppForm.location || null, status: teamOppForm.status, image_url: teamOppForm.image_url || null,
    });
    if (error) { window.alert(error.message); return; }
    setTeamOppForm({ ...emptyOpportunity }); loadTeamDetail(activeTeamId);
  };
  const handleTeamOppImg = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setTeamOppForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };
  const addAnnouncement = async () => {
    if (!activeTeamId || !annForm.title.trim()) return;
    const { error } = await supabase.from('announcements').insert({ team_id: activeTeamId, title: annForm.title, body: annForm.body || null });
    if (error) { window.alert(error.message); return; }
    setAnnForm({ ...emptyAnnouncement }); loadTeamDetail(activeTeamId);
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    await supabase.from('opportunity_applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setPendingApps(prev => status === 'applied' ? prev + 1 : Math.max(0, prev - 1));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('toruok-media').upload(path, file);
    if (error) { window.alert(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from('toruok-media').getPublicUrl(path);
    return data.publicUrl;
  };
  const handleOppImg  = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setOppForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };
  const handleResImg  = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setResForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };
  const handleActImg  = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setActForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };

  const addOpportunity = async () => {
    if (!oppForm.title.trim()) return;
    const { error } = await supabase.from('opportunities').insert({ space_id: space.id, title: oppForm.title, type: oppForm.type, provider: oppForm.provider || null, description: oppForm.description || null, eligibility: oppForm.eligibility || null, compensation: oppForm.compensation || null, deadline: oppForm.deadline ? new Date(oppForm.deadline).toISOString() : null, application_method: oppForm.application_method || null, zone_id: oppForm.zone_id || null, location: oppForm.location || null, status: oppForm.status, image_url: oppForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setOppForm({ ...emptyOpportunity }); loadAll();
  };
  const addResource = async () => {
    if (!resForm.name.trim()) return;
    const { error } = await supabase.from('resources').insert({ space_id: space.id, name: resForm.name, owner: resForm.owner || null, description: resForm.description || null, availability: resForm.availability || null, capacity: resForm.capacity || null, zone_id: resForm.zone_id || null, image_url: resForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setResForm({ ...emptyResource }); loadAll();
  };
  const addActivity = async () => {
    if (!actForm.title.trim()) return;
    const { error } = await supabase.from('activities').insert({ space_id: space.id, title: actForm.title, host: actForm.host || null, description: actForm.description || null, category: actForm.category || null, start_time: actForm.start_time ? new Date(actForm.start_time).toISOString() : null, end_time: actForm.end_time ? new Date(actForm.end_time).toISOString() : null, zone_id: actForm.zone_id || null, capacity: actForm.capacity || null, registration_link: actForm.registration_link || null, image_url: actForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setActForm({ ...emptyActivity }); loadAll();
  };

  const inviteSpaceAdmin = async () => {
    if (!spaceAdminInviteEmail.trim()) return;
    const { error } = await supabase.from('space_admins').insert({ space_id: space.id, invite_email: spaceAdminInviteEmail.trim() });
    if (error) { window.alert(error.message); return; }
    setSpaceAdminInviteEmail(''); loadAll();
  };
  const inviteZonePublisher = async () => {
    if (!zonePublisherInviteEmail.trim() || !zonePublisherZoneId) return;
    const { error } = await supabase.from('zone_publishers').insert({ zone_id: zonePublisherZoneId, invite_email: zonePublisherInviteEmail.trim() });
    if (error) { window.alert(error.message); return; }
    setZonePublisherInviteEmail(''); setZonePublisherZoneId(''); loadAll();
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
    { id: 'home',          label: 'Home',          icon: '◈' },
    { id: 'people',        label: 'People',        icon: '👤', badge: presentPeople.length },
    { id: 'zones',         label: 'Zones',         icon: '⬡', badge: zones.length },
    { id: 'teams',         label: 'Teams',         icon: '🎓', badge: teams.length },
    { id: 'opportunities', label: 'Opportunities', icon: '✦' },
    { id: 'applications',  label: 'Applications',  icon: '📋', badge: pendingApps },
    { id: 'resources',     label: 'Resources',     icon: '📦' },
    { id: 'activities',    label: 'Activities',    icon: '📅' },
    { id: 'admins',        label: 'Admins',        icon: '👥', badge: pendingRequests.length },
  ];

  return (
    <OperatorShell
      orgName={org?.name || 'Operator'}
      spaceName={space.name}
      roleBadge="Space admin"
      roleColor="#1D9E75"
      nav={nav}
      activeTab={tab}
      onTab={t => setTab(t as Tab)}
      onSignOut={signOut}
    >
      {tab === 'home' && (
        <>
          <SectionHeader title="Faculty overview" sub={`Participant link: ${typeof window !== 'undefined' ? window.location.origin : ''}/?space=${space.id}`} />
          <StatGrid stats={stats} />

          {pendingApps > 0 && (
            <div onClick={() => setTab('applications')} style={{ background: 'rgba(226,109,52,0.1)', border: '1px solid rgba(226,109,52,0.3)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{pendingApps} application{pendingApps > 1 ? 's' : ''} waiting for review</span>
              <span style={{ opacity: 0.6 }}>→</span>
            </div>
          )}
          {pendingRequests.length > 0 && (
            <div onClick={() => setTab('admins')} style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{pendingRequests.length} access request{pendingRequests.length > 1 ? 's' : ''} to review</span>
              <span style={{ opacity: 0.6 }}>→</span>
            </div>
          )}

          <SectionHeader title="Zones in this space" />
          {zones.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No zones yet. Add rooms and departments in the Zones tab.</p>}
          {zones.filter(z => !z.parent_zone_id).map(z => (
            <div key={z.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{z.name}</div>
              {z.capacity && <div style={{ fontSize: 12, opacity: 0.45, marginTop: 2 }}>Capacity: {z.capacity}</div>}
              {zones.filter(c => c.parent_zone_id === z.id).map(child => (
                <div key={child.id} style={{ marginTop: 6, paddingLeft: 12, borderLeft: '2px solid rgba(255,255,255,0.1)', fontSize: 13, opacity: 0.7 }}>
                  {child.name}{child.capacity ? ` · ${child.capacity}` : ''}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {tab === 'people'        && <PeoplePanel people={presentPeople} />}
      {tab === 'zones'         && <ZonesPanel zones={zones} zoneForm={zoneForm} setZoneForm={setZoneForm} addZone={addZone} spaceId={space.id} />}
      {tab === 'teams'         && (
        <TeamsPanel
          teams={teams} teamForm={teamForm} setTeamForm={setTeamForm} addTeam={addTeam} zones={zones}
          activeTeam={teams.find(t => t.id === activeTeamId) || null} setActiveTeamId={selectTeam}
          teamDetailProps={{
            leads: teamLeads, leadInviteEmail, setLeadInviteEmail, inviteLead: inviteTeamLead,
            operators: teamOperators, operatorInviteEmail, setOperatorInviteEmail, inviteOperator: inviteTeamOperator,
            schedules: teamSchedules, scheduleForm, setScheduleForm, addSchedule,
            opportunities: teamOpportunities, oppForm: teamOppForm, setOppForm: setTeamOppForm, addOpportunity: addTeamOpportunity,
            uploadingImage, onImageSelected: handleTeamOppImg,
            roster: teamRoster,
            announcements: teamAnnouncements, annForm, setAnnForm, addAnnouncement,
          }}
        />
      )}
      {tab === 'opportunities' && <OpportunitiesPanel opportunities={opportunities} oppForm={oppForm} setOppForm={setOppForm} addOpportunity={addOpportunity} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleOppImg} />}
      {tab === 'applications'  && <ApplicationsPanel applications={applications} updateApplicationStatus={updateApplicationStatus} />}
      {tab === 'resources'     && <ResourcesPanel resources={resources} resForm={resForm} setResForm={setResForm} addResource={addResource} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleResImg} />}
      {tab === 'activities'    && <ActivitiesPanel activities={activities} actForm={actForm} setActForm={setActForm} addActivity={addActivity} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleActImg} />}
      {tab === 'admins'        && (
        <SpaceTeamPanel
          spaceAdmins={spaceAdmins} spaceAdminInviteEmail={spaceAdminInviteEmail} setSpaceAdminInviteEmail={setSpaceAdminInviteEmail} inviteSpaceAdmin={inviteSpaceAdmin}
          zonePublishers={zonePublishers} zonePublisherInviteEmail={zonePublisherInviteEmail} setZonePublisherInviteEmail={setZonePublisherInviteEmail}
          zonePublisherZoneId={zonePublisherZoneId} setZonePublisherZoneId={setZonePublisherZoneId} inviteZonePublisher={inviteZonePublisher} zones={zones}
          pendingRequests={pendingRequests} approveRequest={approveRequest} denyRequest={denyRequest}
        />
      )}
    </OperatorShell>
  );
}

