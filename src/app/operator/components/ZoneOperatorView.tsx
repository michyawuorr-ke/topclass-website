'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Org, Space, Zone, Item, Application, inputStyle, labelStyle, emptyOpportunity, emptyResource, emptyActivity, zonePath } from '../types';
import { OpportunitiesPanel } from './OpportunitiesPanel';
import { ResourcesPanel } from './ResourcesPanel';
import { ActivitiesPanel } from './ActivitiesPanel';
import { ApplicationsPanel } from './ApplicationsPanel';

const S = {
  wrap: { minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', fontFamily: 'sans-serif' } as React.CSSProperties,
  header: { padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
  badge: { background: 'rgba(186,117,23,0.15)', border: '1px solid rgba(186,117,23,0.4)', color: '#EF9F27', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 } as React.CSSProperties,
  tabs: { display: 'flex', gap: 8, padding: '14px 20px 0', overflowX: 'auto' as any },
  tab: (active: boolean): React.CSSProperties => ({ padding: '8px 16px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', cursor: 'pointer', background: active ? '#D4AF37' : 'rgba(255,255,255,0.08)', color: active ? '#1C1C2E' : '#F5EFE3', fontWeight: active ? 600 : 400 }),
  body: { padding: 20, maxWidth: 540, margin: '0 auto' } as React.CSSProperties,
  signOut: { background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#888', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 } as React.CSSProperties,
  card: { background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 10 } as React.CSSProperties,
};

type Tab = 'overview' | 'opportunities' | 'applications' | 'resources' | 'activities';

export function ZoneOperatorView({ org, space, zones, signOut }: { org: Org | null; space: Space | null; zones: Zone[]; signOut: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [activeZoneId, setActiveZoneId] = useState<string>(zones[0]?.id || '');
  const [opportunities, setOpportunities] = useState<Item[]>([]);
  const [oppForm, setOppForm] = useState({ ...emptyOpportunity, zone_id: activeZoneId });
  const [resources, setResources] = useState<Item[]>([]);
  const [resForm, setResForm] = useState({ ...emptyResource, zone_id: activeZoneId });
  const [activities, setActivities] = useState<Item[]>([]);
  const [actForm, setActForm] = useState({ ...emptyActivity, zone_id: activeZoneId });
  const [applications, setApplications] = useState<Application[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [zoneStats, setZoneStats] = useState({ present: 0, upcomingActivities: 0, pendingApps: 0 });

  const fetchContent = async (zoneId: string) => {
    const [{ data: opps }, { data: res }, { data: acts }] = await Promise.all([
      supabase.from('opportunities').select('*').eq('zone_id', zoneId),
      supabase.from('resources').select('*').eq('zone_id', zoneId),
      supabase.from('activities').select('*').eq('zone_id', zoneId),
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

  const fetchZoneStats = async (zoneId: string) => {
    const nowIso = new Date().toISOString();
    const [{ count: present }, { count: upcoming }] = await Promise.all([
      supabase.from('presence').select('id', { count: 'exact', head: true }).eq('zone_id', zoneId),
      supabase.from('activities').select('id', { count: 'exact', head: true }).eq('zone_id', zoneId).gt('start_time', nowIso),
    ]);
    const { data: opps } = await supabase.from('opportunities').select('id').eq('zone_id', zoneId);
    const oppIds = (opps || []).map((o: any) => o.id);
    let pendingApps = 0;
    if (oppIds.length > 0) {
      const { count } = await supabase.from('opportunity_applications').select('id', { count: 'exact', head: true }).in('opportunity_id', oppIds).eq('status', 'applied');
      pendingApps = count || 0;
    }
    setZoneStats({ present: present || 0, upcomingActivities: upcoming || 0, pendingApps });
  };

  useEffect(() => {
    if (activeZoneId) { fetchContent(activeZoneId); fetchZoneStats(activeZoneId); }
  }, [activeZoneId]);

  useEffect(() => {
    setOppForm(prev => ({ ...prev, zone_id: activeZoneId }));
    setResForm(prev => ({ ...prev, zone_id: activeZoneId }));
    setActForm(prev => ({ ...prev, zone_id: activeZoneId }));
  }, [activeZoneId]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('toruok-media').upload(path, file);
    if (error) { window.alert(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from('toruok-media').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleOppImage = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setOppForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };
  const handleResImage = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setResForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };
  const handleActImage = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setActForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };

  const addOpportunity = async () => {
    if (!oppForm.title.trim() || !space) return;
    const { error } = await supabase.from('opportunities').insert({ space_id: space.id, zone_id: activeZoneId, title: oppForm.title, type: oppForm.type, provider: oppForm.provider || null, description: oppForm.description || null, eligibility: oppForm.eligibility || null, compensation: oppForm.compensation || null, deadline: oppForm.deadline ? new Date(oppForm.deadline).toISOString() : null, application_method: oppForm.application_method || null, location: oppForm.location || null, status: oppForm.status, image_url: oppForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setOppForm({ ...emptyOpportunity, zone_id: activeZoneId }); fetchContent(activeZoneId);
  };

  const addResource = async () => {
    if (!resForm.name.trim() || !space) return;
    const { error } = await supabase.from('resources').insert({ space_id: space.id, zone_id: activeZoneId, name: resForm.name, owner: resForm.owner || null, description: resForm.description || null, availability: resForm.availability || null, capacity: resForm.capacity || null, image_url: resForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setResForm({ ...emptyResource, zone_id: activeZoneId }); fetchContent(activeZoneId);
  };

  const addActivity = async () => {
    if (!actForm.title.trim() || !space) return;
    const { error } = await supabase.from('activities').insert({ space_id: space.id, zone_id: activeZoneId, title: actForm.title, host: actForm.host || null, description: actForm.description || null, category: actForm.category || null, start_time: actForm.start_time ? new Date(actForm.start_time).toISOString() : null, end_time: actForm.end_time ? new Date(actForm.end_time).toISOString() : null, capacity: actForm.capacity || null, registration_link: actForm.registration_link || null, image_url: actForm.image_url || null });
    if (error) { window.alert(error.message); return; }
    setActForm({ ...emptyActivity, zone_id: activeZoneId }); fetchContent(activeZoneId);
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    await supabase.from('opportunity_applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const activeZone = zones.find(z => z.id === activeZoneId);

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{activeZone ? zonePath(activeZoneId, zones) : 'Zone operator'}</div>
          <div style={{ fontSize: 12, opacity: 0.5 }}>{org?.name || space?.name || ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={S.badge}>Zone operator</span>
          <button style={S.signOut} onClick={signOut}>Sign out</button>
        </div>
      </div>

      {/* Zone picker — if they manage more than one zone */}
      {zones.length > 1 && (
        <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {zones.map(z => (
            <button key={z.id} onClick={() => setActiveZoneId(z.id)}
              style={{ padding: '5px 12px', borderRadius: 16, border: 'none', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: 13, background: activeZoneId === z.id ? '#E26D34' : 'rgba(255,255,255,0.08)', color: activeZoneId === z.id ? '#fff' : '#F5EFE3' }}>
              {z.name}
            </button>
          ))}
        </div>
      )}

      <div style={S.tabs}>
        {(['overview', 'opportunities', 'applications', 'resources', 'activities'] as Tab[]).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={S.body}>
        {tab === 'overview' && (
          <>
            <div style={{ marginTop: 16, fontSize: 11, opacity: 0.5, letterSpacing: 1, marginBottom: 10 }}>ZONE METRICS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Present now', value: zoneStats.present },
                { label: 'Upcoming activities', value: zoneStats.upcomingActivities },
                { label: 'Pending applications', value: zoneStats.pendingApps },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
                  <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 6 }}>Your zone is scoped to this area only. Contact your space admin to change zone settings or hierarchy.</div>
          </>
        )}
        {tab === 'opportunities' && <OpportunitiesPanel opportunities={opportunities} oppForm={oppForm} setOppForm={setOppForm} addOpportunity={addOpportunity} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleOppImage} />}
        {tab === 'applications' && <ApplicationsPanel applications={applications} updateApplicationStatus={updateApplicationStatus} />}
        {tab === 'resources' && <ResourcesPanel resources={resources} resForm={resForm} setResForm={setResForm} addResource={addResource} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleResImage} />}
        {tab === 'activities' && <ActivitiesPanel activities={activities} actForm={actForm} setActForm={setActForm} addActivity={addActivity} zones={zones} uploadingImage={uploadingImage} onImageSelected={handleActImage} />}
      </div>
    </div>
  );
}
