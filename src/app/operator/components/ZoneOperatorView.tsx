'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Org, Space, Zone, Item, Application, emptyOpportunity, emptyResource, emptyActivity, zonePath } from '../types';
import { OperatorShell } from './OperatorShell';
import { StatGrid, Stat } from './StatGrid';
import { SectionHeader } from './SectionHeader';
import { OpportunitiesPanel } from './OpportunitiesPanel';
import { ResourcesPanel } from './ResourcesPanel';
import { ActivitiesPanel } from './ActivitiesPanel';
import { ApplicationsPanel } from './ApplicationsPanel';

type Tab = 'home' | 'opportunities' | 'applications' | 'resources' | 'activities';

export function ZoneOperatorView({ org, space, zones, signOut }: { org: Org | null; space: Space | null; zones: Zone[]; signOut: () => void }) {
  const [tab, setTab] = useState<Tab>('home');
  const [activeZoneId, setActiveZoneId] = useState<string>(zones[0]?.id || '');
  const [opportunities, setOpportunities] = useState<Item[]>([]);
  const [oppForm, setOppForm] = useState({ ...emptyOpportunity, zone_id: zones[0]?.id || '' });
  const [resources, setResources] = useState<Item[]>([]);
  const [resForm, setResForm] = useState({ ...emptyResource, zone_id: zones[0]?.id || '' });
  const [activities, setActivities] = useState<Item[]>([]);
  const [actForm, setActForm] = useState({ ...emptyActivity, zone_id: zones[0]?.id || '' });
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [pendingApps, setPendingApps] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (activeZoneId) loadZone(activeZoneId);
  }, [activeZoneId]);

  useEffect(() => {
    setOppForm(p => ({ ...p, zone_id: activeZoneId }));
    setResForm(p => ({ ...p, zone_id: activeZoneId }));
    setActForm(p => ({ ...p, zone_id: activeZoneId }));
  }, [activeZoneId]);

  const loadZone = async (zoneId: string) => {
    const nowIso = new Date().toISOString();
    const [{ data: opps }, { data: res }, { data: acts }, { count: present }, { count: upcoming }] = await Promise.all([
      supabase.from('opportunities').select('*').eq('zone_id', zoneId),
      supabase.from('resources').select('*').eq('zone_id', zoneId),
      supabase.from('activities').select('*').eq('zone_id', zoneId),
      supabase.from('presence').select('id', { count: 'exact', head: true }).eq('zone_id', zoneId),
      supabase.from('activities').select('id', { count: 'exact', head: true }).eq('zone_id', zoneId).gt('start_time', nowIso),
    ]);
    setOpportunities(opps || []);
    setResources(res || []);
    setActivities(acts || []);

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

    setStats([
      { label: 'Present in zone now', value: present || 0 },
      { label: 'Upcoming activities', value: upcoming || 0 },
      { label: 'Opportunities posted', value: (opps || []).length },
      { label: 'Pending applications', value: pending, accent: pending > 0 },
    ]);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('toruok-media').upload(path, file);
    if (error) { window.alert(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from('toruok-media').getPublicUrl(path);
    return data.publicUrl;
  };
  const handleOppImg = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setOppForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };
  const handleResImg = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setResForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };
  const handleActImg = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setActForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };

  const addOpportunity = async () => {
    if (!oppForm.title.trim() || !space) return;
    const { error } = await supabase.from('opportunities').insert({ space_id: space.id, zone_id: activeZoneId, title: oppForm.title, type: oppForm.type, provider: oppForm.provider || null, description: oppForm.description || null, eligibility: oppForm.eligibility || null, compensation: oppForm.compensation || null, deadline: oppForm.deadline ? new Date(oppForm.deadline).toISOString() : null, application_method: oppForm.application_method || null, location: oppForm.location || null, status: oppForm.status, image_url: oppForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setOppForm({ ...emptyOpportunity, zone_id: activeZoneId }); loadZone(activeZoneId);
  };
  const addResource = async () => {
    if (!resForm.name.trim() || !space) return;
    const { error } = await supabase.from('resources').insert({ space_id: space.id, zone_id: activeZoneId, name: resForm.name, owner: resForm.owner || null, description: resForm.description || null, availability: resForm.availability || null, capacity: resForm.capacity || null, image_url: resForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setResForm({ ...emptyResource, zone_id: activeZoneId }); loadZone(activeZoneId);
  };
  const addActivity = async () => {
    if (!actForm.title.trim() || !space) return;
    const { error } = await supabase.from('activities').insert({ space_id: space.id, zone_id: activeZoneId, title: actForm.title, host: actForm.host || null, description: actForm.description || null, category: actForm.category || null, start_time: actForm.start_time ? new Date(actForm.start_time).toISOString() : null, end_time: actForm.end_time ? new Date(actForm.end_time).toISOString() : null, capacity: actForm.capacity || null, registration_link: actForm.registration_link || null, image_url: actForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setActForm({ ...emptyActivity, zone_id: activeZoneId }); loadZone(activeZoneId);
  };
  const updateApplicationStatus = async (id: string, status: string) => {
    await supabase.from('opportunity_applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const activeZone = zones.find(z => z.id === activeZoneId);
  const nav = [
    { id: 'home',          label: 'Home',          icon: '◈' },
    { id: 'opportunities', label: 'Opportunities', icon: '✦' },
    { id: 'applications',  label: 'Applications',  icon: '📋', badge: pendingApps },
    { id: 'resources',     label: 'Resources',     icon: '📦' },
    { id: 'activities',    label: 'Activities',    icon: '📅' },
  ];

  return (
    <OperatorShell
      orgName={org?.name || 'Operator'}
      spaceName={activeZone ? zonePath(activeZoneId, zones) : 'Zone operator'}
      roleBadge="Zone operator"
      roleColor="#EF9F27"
      nav={nav}
      activeTab={tab}
      onTab={t => setTab(t as Tab)}
      onSignOut={signOut}
    >
      {/* Zone picker — shown when they manage more than one zone */}
      {zones.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {zones.map(z => (
            <button key={z.id} onClick={() => setActiveZoneId(z.id)} style={{
              padding: '6px 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 13,
              background: activeZoneId === z.id ? '#E26D34' : 'rgba(255,255,255,0.08)',
              color: activeZoneId === z.id ? '#fff' : '#F5EFE3',
              fontWeight: activeZoneId === z.id ? 600 : 400,
            }}>
              {z.name}
            </button>
          ))}
        </div>
      )}

      {tab === 'home' && (
        <>
          <SectionHeader title="Zone metrics" sub={activeZone?.description || ''} />
          <StatGrid stats={stats} />

          {pendingApps > 0 && (
            <div onClick={() => setTab('applications')} style={{ background: 'rgba(226,109,52,0.1)', border: '1px solid rgba(226,109,52,0.3)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{pendingApps} application{pendingApps > 1 ? 's' : ''} waiting for review</span>
              <span style={{ opacity: 0.6 }}>→</span>
            </div>
          )}

          <SectionHeader title="Upcoming activities in this zone" />
          {activities.filter(a => a.start_time && new Date(a.start_time) > new Date()).length === 0
            ? <p style={{ opacity: 0.4, fontSize: 13 }}>No upcoming activities. Add one in the Activities tab.</p>
            : activities
                .filter(a => a.start_time && new Date(a.start_time) > new Date())
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .slice(0, 5)
                .map(a => (
                  <div key={a.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>
                      {a.start_time ? new Date(a.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      {a.host ? ` · ${a.host}` : ''}
                    </div>
                  </div>
                ))
          }

          <div style={{ marginTop: 20, fontSize: 12, opacity: 0.4, lineHeight: 1.7 }}>
            Your scope is limited to this zone. Contact your space admin to change zone settings, hierarchy, or your access level.
          </div>
        </>
      )}

      {tab === 'opportunities' && <OpportunitiesPanel opportunities={opportunities} oppForm={oppForm} setOppForm={setOppForm} addOpportunity={addOpportunity} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleOppImg} />}
      {tab === 'applications'  && <ApplicationsPanel applications={applications} updateApplicationStatus={updateApplicationStatus} />}
      {tab === 'resources'     && <ResourcesPanel resources={resources} resForm={resForm} setResForm={setResForm} addResource={addResource} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleResImg} />}
      {tab === 'activities'    && <ActivitiesPanel activities={activities} actForm={actForm} setActForm={setActForm} addActivity={addActivity} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleActImg} />}
    </OperatorShell>
  );
}
