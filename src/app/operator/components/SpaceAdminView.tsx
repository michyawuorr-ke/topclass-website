'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Org, Space, Zone, Item, SpaceAdmin, ZonePublisher, AccessRequest, Application, inputStyle, labelStyle, emptyOpportunity, emptyResource, emptyActivity, zonePath } from '../types';
import { ZonesPanel } from './ZonesPanel';
import { OpportunitiesPanel } from './OpportunitiesPanel';
import { ResourcesPanel } from './ResourcesPanel';
import { ActivitiesPanel } from './ActivitiesPanel';
import { ApplicationsPanel } from './ApplicationsPanel';
import { PeoplePanel } from './PeoplePanel';
import { HomePanel } from './HomePanel';
import { SpaceTeamPanel } from './SpaceTeamPanel';

const S = {
  wrap: { minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', fontFamily: 'sans-serif' } as React.CSSProperties,
  header: { padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
  badge: { background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.4)', color: '#1D9E75', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 } as React.CSSProperties,
  tabs: { display: 'flex', gap: 8, padding: '14px 20px 0', overflowX: 'auto' as any },
  tab: (active: boolean): React.CSSProperties => ({ padding: '8px 16px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', cursor: 'pointer', background: active ? '#D4AF37' : 'rgba(255,255,255,0.08)', color: active ? '#1C1C2E' : '#F5EFE3', fontWeight: active ? 600 : 400 }),
  body: { padding: 20, maxWidth: 540, margin: '0 auto' } as React.CSSProperties,
  signOut: { background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#888', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 } as React.CSSProperties,
};

type Tab = 'home' | 'people' | 'zones' | 'opportunities' | 'applications' | 'resources' | 'activities' | 'team';

export function SpaceAdminView({ org, space, signOut }: { org: Org | null; space: Space; signOut: () => void }) {
  const [tab, setTab] = useState<Tab>('home');
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneForm, setZoneForm] = useState({ name: '', description: '', capacity: '', parent_zone_id: '' });
  const [opportunities, setOpportunities] = useState<Item[]>([]);
  const [oppForm, setOppForm] = useState({ ...emptyOpportunity });
  const [resources, setResources] = useState<Item[]>([]);
  const [resForm, setResForm] = useState({ ...emptyResource });
  const [activities, setActivities] = useState<Item[]>([]);
  const [actForm, setActForm] = useState({ ...emptyActivity });
  const [applications, setApplications] = useState<Application[]>([]);
  const [presentPeople, setPresentPeople] = useState<any[]>([]);
  const [homeStats, setHomeStats] = useState({ activePopulation: 0, pendingApplications: 0, upcomingActivities: 0, connectionsCount: 0 });
  const [spaceAdmins, setSpaceAdmins] = useState<SpaceAdmin[]>([]);
  const [spaceAdminInviteEmail, setSpaceAdminInviteEmail] = useState('');
  const [zonePublishers, setZonePublishers] = useState<ZonePublisher[]>([]);
  const [zonePublisherInviteEmail, setZonePublisherInviteEmail] = useState('');
  const [zonePublisherZoneId, setZonePublisherZoneId] = useState('');
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchZones = async () => {
    const { data } = await supabase.from('zones').select('*').eq('space_id', space.id);
    setZones(data || []);
  };

  const fetchContent = async () => {
    const [{ data: opps }, { data: res }, { data: acts }] = await Promise.all([
      supabase.from('opportunities').select('*').eq('space_id', space.id),
      supabase.from('resources').select('*').eq('space_id', space.id),
      supabase.from('activities').select('*').eq('space_id', space.id),
    ]);
    setOpportunities(opps || []);
    setResources(res || []);
    setActivities(acts || []);
    const oppIds = (opps || []).map((o: any) => o.id);
    if (oppIds.length > 0) {
      const { data: apps } = await supabase.from('opportunity_applications')
        .select('*, opportunities(title), profiles(name, title, domain)').in('opportunity_id', oppIds).order('created_at', { ascending: false });
      setApplications(apps || []);
    } else setApplications([]);
  };

  const fetchHomeAndPeople = async () => {
    const nowIso = new Date().toISOString();
    const [{ data: presence }, { count: upcomingCount }, { data: connCount }] = await Promise.all([
      supabase.from('presence').select('*, profiles(name, title, domain, capabilities, standing_need)').eq('space_id', space.id),
      supabase.from('activities').select('id', { count: 'exact', head: true }).eq('space_id', space.id).gt('start_time', nowIso),
      supabase.rpc('count_space_connections', { check_space_id: space.id }),
    ]);
    setPresentPeople(presence || []);
    const oppIds = opportunities.map(o => o.id);
    let pendingCount = 0;
    if (oppIds.length > 0) {
      const { count } = await supabase.from('opportunity_applications').select('id', { count: 'exact', head: true }).in('opportunity_id', oppIds).eq('status', 'applied');
      pendingCount = count || 0;
    }
    setHomeStats({ activePopulation: (presence || []).length, pendingApplications: pendingCount, upcomingActivities: upcomingCount || 0, connectionsCount: typeof connCount === 'number' ? connCount : 0 });
  };

  const fetchSpaceTeam = async () => {
    const [{ data: admins }, { data: publishers }, { data: spaceRequests }] = await Promise.all([
      supabase.from('space_admins').select('*').eq('space_id', space.id),
      supabase.from('zone_publishers').select('*, zones!inner(space_id)').eq('zones.space_id', space.id),
      supabase.from('access_requests').select('*').eq('space_id', space.id).eq('status', 'pending'),
    ]);
    setSpaceAdmins(admins || []);
    setZonePublishers(publishers || []);
    setPendingRequests(spaceRequests || []);
  };

  useEffect(() => { fetchZones(); fetchContent(); fetchSpaceTeam(); }, [space.id]);
  useEffect(() => { fetchHomeAndPeople(); }, [space.id, opportunities.length]);

  const addZone = async () => {
    if (!zoneForm.name.trim()) return;
    const { error } = await supabase.from('zones').insert({ space_id: space.id, name: zoneForm.name, description: zoneForm.description || null, capacity: zoneForm.capacity || null, parent_zone_id: zoneForm.parent_zone_id || null });
    if (error) { window.alert(error.message); return; }
    setZoneForm({ name: '', description: '', capacity: '', parent_zone_id: '' });
    fetchZones();
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    await supabase.from('opportunity_applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('toruok-media').upload(path, file);
    if (error) { window.alert(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from('toruok-media').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleOppImage = async (file: File) => { setUploadingImage(true); const url = await uploadImage(file); if (url) setOppForm(prev => ({ ...prev, image_url: url })); setUploadingImage(false); };
  const handleResImage = async (file: File) => { setUploadingImage(true); const url = await uploadImage(file); if (url) setResForm(prev => ({ ...prev, image_url: url })); setUploadingImage(false); };
  const handleActImage = async (file: File) => { setUploadingImage(true); const url = await uploadImage(file); if (url) setActForm(prev => ({ ...prev, image_url: url })); setUploadingImage(false); };

  const addOpportunity = async () => {
    if (!oppForm.title.trim()) return;
    const { error } = await supabase.from('opportunities').insert({ space_id: space.id, title: oppForm.title, type: oppForm.type, provider: oppForm.provider || null, description: oppForm.description || null, eligibility: oppForm.eligibility || null, compensation: oppForm.compensation || null, deadline: oppForm.deadline ? new Date(oppForm.deadline).toISOString() : null, application_method: oppForm.application_method || null, zone_id: oppForm.zone_id || null, location: oppForm.location || null, status: oppForm.status, image_url: oppForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setOppForm({ ...emptyOpportunity }); fetchContent();
  };

  const addResource = async () => {
    if (!resForm.name.trim()) return;
    const { error } = await supabase.from('resources').insert({ space_id: space.id, name: resForm.name, owner: resForm.owner || null, description: resForm.description || null, availability: resForm.availability || null, capacity: resForm.capacity || null, zone_id: resForm.zone_id || null, image_url: resForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setResForm({ ...emptyResource }); fetchContent();
  };

  const addActivity = async () => {
    if (!actForm.title.trim()) return;
    const { error } = await supabase.from('activities').insert({ space_id: space.id, title: actForm.title, host: actForm.host || null, description: actForm.description || null, category: actForm.category || null, start_time: actForm.start_time ? new Date(actForm.start_time).toISOString() : null, end_time: actForm.end_time ? new Date(actForm.end_time).toISOString() : null, zone_id: actForm.zone_id || null, capacity: actForm.capacity || null, registration_link: actForm.registration_link || null, image_url: actForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setActForm({ ...emptyActivity }); fetchContent();
  };

  const inviteSpaceAdmin = async () => {
    if (!spaceAdminInviteEmail.trim()) return;
    const { error } = await supabase.from('space_admins').insert({ space_id: space.id, invite_email: spaceAdminInviteEmail.trim() });
    if (error) { window.alert(error.message); return; }
    setSpaceAdminInviteEmail(''); fetchSpaceTeam();
  };

  const inviteZonePublisher = async () => {
    if (!zonePublisherInviteEmail.trim() || !zonePublisherZoneId) return;
    const { error } = await supabase.from('zone_publishers').insert({ zone_id: zonePublisherZoneId, invite_email: zonePublisherInviteEmail.trim() });
    if (error) { window.alert(error.message); return; }
    setZonePublisherInviteEmail(''); setZonePublisherZoneId(''); fetchSpaceTeam();
  };

  const approveRequest = async (id: string) => {
    const { error } = await supabase.rpc('approve_access_request', { request_id: id });
    if (error) { window.alert(error.message); return; }
    fetchSpaceTeam();
  };

  const denyRequest = async (id: string) => {
    const { error } = await supabase.rpc('deny_access_request', { request_id: id });
    if (error) { window.alert(error.message); return; }
    fetchSpaceTeam();
  };

  const TABS: Tab[] = ['home', 'people', 'zones', 'opportunities', 'applications', 'resources', 'activities', 'team'];
  const tabLabel = (t: Tab) => ({ zones: 'Zones', team: 'Team', applications: 'Applications' }[t] || t.charAt(0).toUpperCase() + t.slice(1));

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{space.name}</div>
          <div style={{ fontSize: 12, opacity: 0.5 }}>{org?.name || 'Space admin'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={S.badge}>Space admin</span>
          <button style={S.signOut} onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{tabLabel(t)}</button>
        ))}
      </div>

      <div style={S.body}>
        <p style={{ fontSize: 11, opacity: 0.35, marginTop: 12, marginBottom: 4 }}>
          Participant link: {typeof window !== 'undefined' ? window.location.origin : ''}/?space={space.id}
        </p>
        {tab === 'home' && <HomePanel stats={homeStats} />}
        {tab === 'people' && <PeoplePanel people={presentPeople} />}
        {tab === 'zones' && <ZonesPanel zones={zones} zoneForm={zoneForm} setZoneForm={setZoneForm} addZone={addZone} />}
        {tab === 'opportunities' && <OpportunitiesPanel opportunities={opportunities} oppForm={oppForm} setOppForm={setOppForm} addOpportunity={addOpportunity} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleOppImage} />}
        {tab === 'applications' && <ApplicationsPanel applications={applications} updateApplicationStatus={updateApplicationStatus} />}
        {tab === 'resources' && <ResourcesPanel resources={resources} resForm={resForm} setResForm={setResForm} addResource={addResource} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleResImage} />}
        {tab === 'activities' && <ActivitiesPanel activities={activities} actForm={actForm} setActForm={setActForm} addActivity={addActivity} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleActImage} />}
        {tab === 'team' && (
          <SpaceTeamPanel
            spaceAdmins={spaceAdmins} spaceAdminInviteEmail={spaceAdminInviteEmail} setSpaceAdminInviteEmail={setSpaceAdminInviteEmail} inviteSpaceAdmin={inviteSpaceAdmin}
            zonePublishers={zonePublishers} zonePublisherInviteEmail={zonePublisherInviteEmail} setZonePublisherInviteEmail={setZonePublisherInviteEmail}
            zonePublisherZoneId={zonePublisherZoneId} setZonePublisherZoneId={setZonePublisherZoneId} inviteZonePublisher={inviteZonePublisher} zones={zones}
            pendingRequests={pendingRequests} approveRequest={approveRequest} denyRequest={denyRequest}
          />
        )}
      </div>
    </div>
  );
}
