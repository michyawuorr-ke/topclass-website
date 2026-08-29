'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Org {
  id: string; name: string; owner_id: string; approved: boolean;
  description?: string; website?: string; contact_email?: string; contact_phone?: string;
}
interface Space { id: string; organization_id: string; name: string; type: string; }
interface Zone { id: string; space_id: string; name: string; description?: string; capacity?: string; parent_zone_id?: string | null; }
interface Item { id: string; [key: string]: any; }

const SPACE_TYPES = ['university', 'innovation_hub'];
const OPPORTUNITY_TYPES = ['Scholarship', 'Job', 'Internship', 'Grant', 'Program', 'Workshop', 'Consultation', 'Other'];

const emptyOpportunity = {
  title: '', type: OPPORTUNITY_TYPES[0], provider: '', description: '', eligibility: '',
  compensation: '', deadline: '', application_method: '', zone_id: '', location: '', status: 'open',
};
const emptyResource = { name: '', owner: '', description: '', availability: '', capacity: '', zone_id: '' };
const emptyActivity = {
  title: '', host: '', description: '', category: '', start_time: '', end_time: '',
  zone_id: '', capacity: '', registration_link: '',
};

const inputStyle: React.CSSProperties = { width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none', fontFamily: 'inherit' };
const labelStyle: React.CSSProperties = { fontSize: 11, opacity: 0.6, marginBottom: 4, display: 'block' };

export default function OperatorDashboard() {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [org, setOrg] = useState<Org | null>(null);
  const [orgForm, setOrgForm] = useState({ name: '', description: '', website: '', contact_email: '', contact_phone: '' });

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState(SPACE_TYPES[0]);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);

  type ContentTab = 'zones' | 'opportunities' | 'resources' | 'activities';
  const [contentTab, setContentTab] = useState<ContentTab>('zones');

  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneForm, setZoneForm] = useState({ name: '', description: '', capacity: '', parent_zone_id: '' });

  const [opportunities, setOpportunities] = useState<Item[]>([]);
  const [oppForm, setOppForm] = useState({ ...emptyOpportunity });

  const [resources, setResources] = useState<Item[]>([]);
  const [resForm, setResForm] = useState({ ...emptyResource });

  const [activities, setActivities] = useState<Item[]>([]);
  const [actForm, setActForm] = useState({ ...emptyActivity });

  // ---- Auth ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const sendMagicLink = async () => {
    if (!email.trim()) return;
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    if (!error) setMagicLinkSent(true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setOrg(null);
    setSpaces([]);
    setActiveSpace(null);
  };

  // ---- Organization ----
  useEffect(() => {
    if (!session) return;
    supabase.from('organizations').select('*').eq('owner_id', session.user.id).maybeSingle()
      .then(({ data }) => { if (data) setOrg(data); });
  }, [session]);

  const createOrg = async () => {
    if (!orgForm.name.trim() || !session) return;
    const { data, error } = await supabase.from('organizations')
      .insert({
        name: orgForm.name.trim(), owner_id: session.user.id,
        description: orgForm.description || null, website: orgForm.website || null,
        contact_email: orgForm.contact_email || null, contact_phone: orgForm.contact_phone || null,
      })
      .select().single();
    if (!error && data) setOrg(data);
  };

  // ---- Spaces ----
  useEffect(() => {
    if (!org) return;
    supabase.from('spaces').select('*').eq('organization_id', org.id)
      .then(({ data }) => { if (data) setSpaces(data); });
  }, [org]);

  const createSpace = async () => {
    if (!newSpaceName.trim() || !org) return;
    const { data, error } = await supabase.from('spaces')
      .insert({ name: newSpaceName.trim(), type: newSpaceType, organization_id: org.id })
      .select().single();
    if (!error && data) {
      setSpaces(prev => [...prev, data]);
      setNewSpaceName('');
    }
  };

  // ---- Zones ----
  const fetchZones = async (space: Space) => {
    const { data } = await supabase.from('zones').select('*').eq('space_id', space.id);
    setZones(data || []);
  };

  const addZone = async () => {
    if (!zoneForm.name.trim() || !activeSpace) return;
    await supabase.from('zones').insert({
      space_id: activeSpace.id, name: zoneForm.name,
      description: zoneForm.description || null, capacity: zoneForm.capacity || null,
      parent_zone_id: zoneForm.parent_zone_id || null,
    });
    setZoneForm({ name: '', description: '', capacity: '', parent_zone_id: '' });
    fetchZones(activeSpace);
  };

  // Build "Faculty > Building > Room" style path labels from the flat zone list
  const zonePath = (zoneId: string | null | undefined, list: Zone[]): string => {
    if (!zoneId) return '';
    const z = list.find(zz => zz.id === zoneId);
    if (!z) return '';
    const parent = z.parent_zone_id ? zonePath(z.parent_zone_id, list) : '';
    return parent ? `${parent} > ${z.name}` : z.name;
  };

  // ---- Content ----
  const fetchContent = async (space: Space) => {
    const [{ data: opps }, { data: res }, { data: acts }] = await Promise.all([
      supabase.from('opportunities').select('*').eq('space_id', space.id),
      supabase.from('resources').select('*').eq('space_id', space.id),
      supabase.from('activities').select('*').eq('space_id', space.id),
    ]);
    setOpportunities(opps || []);
    setResources(res || []);
    setActivities(acts || []);
  };

  useEffect(() => {
    if (activeSpace) { fetchZones(activeSpace); fetchContent(activeSpace); }
  }, [activeSpace]);

  const addOpportunity = async () => {
    if (!oppForm.title.trim() || !activeSpace) return;
    await supabase.from('opportunities').insert({
      space_id: activeSpace.id,
      title: oppForm.title, type: oppForm.type, provider: oppForm.provider || null,
      description: oppForm.description || null, eligibility: oppForm.eligibility || null,
      compensation: oppForm.compensation || null,
      deadline: oppForm.deadline ? new Date(oppForm.deadline).toISOString() : null,
      application_method: oppForm.application_method || null,
      zone_id: oppForm.zone_id || null, location: oppForm.location || null, status: oppForm.status,
    });
    setOppForm({ ...emptyOpportunity });
    fetchContent(activeSpace);
  };

  const addResource = async () => {
    if (!resForm.name.trim() || !activeSpace) return;
    await supabase.from('resources').insert({
      space_id: activeSpace.id,
      name: resForm.name, owner: resForm.owner || null, description: resForm.description || null,
      availability: resForm.availability || null, capacity: resForm.capacity || null,
      zone_id: resForm.zone_id || null,
    });
    setResForm({ ...emptyResource });
    fetchContent(activeSpace);
  };

  const addActivity = async () => {
    if (!actForm.title.trim() || !activeSpace) return;
    await supabase.from('activities').insert({
      space_id: activeSpace.id,
      title: actForm.title, host: actForm.host || null, description: actForm.description || null,
      category: actForm.category || null,
      start_time: actForm.start_time ? new Date(actForm.start_time).toISOString() : null,
      end_time: actForm.end_time ? new Date(actForm.end_time).toISOString() : null,
      zone_id: actForm.zone_id || null, capacity: actForm.capacity || null,
      registration_link: actForm.registration_link || null,
    });
    setActForm({ ...emptyActivity });
    fetchContent(activeSpace);
  };

  // ============================================================
  // Render
  // ============================================================
  if (authLoading) return <div style={{ padding: 24, color: '#F5EFE3', background: '#1C1C2E', minHeight: '100vh' }}>Loading...</div>;

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Toruok Space — Operator</h1>
        <p style={{ opacity: 0.7, marginBottom: 20, textAlign: 'center', maxWidth: 320 }}>Sign in with your email to manage your space.</p>
        {magicLinkSent ? (
          <p>Check your email for a sign-in link.</p>
        ) : (
          <>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@organization.com"
              style={{ ...inputStyle, maxWidth: 320 }} />
            <button onClick={sendMagicLink} style={{ padding: '12px 24px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>
              Send sign-in link
            </button>
          </>
        )}
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', padding: 24, fontFamily: 'sans-serif', maxWidth: 420, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Set up your organization</h1>
        <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 16 }}>Only the name is required — the rest helps participants and your approval move faster.</p>
        <label style={labelStyle}>Organization name *</label>
        <input value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="e.g. Sunrise Hotel Group" style={inputStyle} />
        <label style={labelStyle}>Description</label>
        <textarea value={orgForm.description} onChange={e => setOrgForm({ ...orgForm, description: e.target.value })} placeholder="What is this organization?" style={{ ...inputStyle, minHeight: 60 }} />
        <label style={labelStyle}>Website</label>
        <input value={orgForm.website} onChange={e => setOrgForm({ ...orgForm, website: e.target.value })} placeholder="https://..." style={inputStyle} />
        <label style={labelStyle}>Contact email</label>
        <input value={orgForm.contact_email} onChange={e => setOrgForm({ ...orgForm, contact_email: e.target.value })} style={inputStyle} />
        <label style={labelStyle}>Contact phone</label>
        <input value={orgForm.contact_phone} onChange={e => setOrgForm({ ...orgForm, contact_phone: e.target.value })} style={inputStyle} />
        <button onClick={createOrg} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', marginTop: 4 }}>Create</button>
      </div>
    );
  }

  if (!activeSpace) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', padding: 20, fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 18 }}>{org.name}</h1>
          <button onClick={signOut} style={{ background: 'none', border: 'none', color: '#E26D34', fontSize: 13 }}>Sign out</button>
        </div>

        {!org.approved && (
          <div style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13 }}>
            Pending approval. Your spaces and content are saved, but participants won't see them until your organization is approved.
          </div>
        )}

        <h2 style={{ fontSize: 14, opacity: 0.6, marginBottom: 10 }}>Your spaces</h2>
        {spaces.length === 0 && <p style={{ opacity: 0.5, marginBottom: 16 }}>No spaces yet — create your first one below.</p>}
        {spaces.map(s => (
          <div key={s.id} onClick={() => setActiveSpace(s)}
            style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ fontWeight: 600 }}>{s.name}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{s.type} · id: {s.id}</div>
          </div>
        ))}

        <h2 style={{ fontSize: 14, opacity: 0.6, margin: '20px 0 10px' }}>Add a space</h2>
        <input value={newSpaceName} onChange={e => setNewSpaceName(e.target.value)} placeholder="Space name" style={inputStyle} />
        <select value={newSpaceType} onChange={e => setNewSpaceType(e.target.value)} style={inputStyle}>
          {SPACE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={createSpace} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Create space</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', padding: 20, fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <button onClick={() => setActiveSpace(null)} style={{ background: 'none', border: 'none', color: '#E26D34', marginBottom: 12 }}>&larr; All spaces</button>
      <h1 style={{ fontSize: 18, marginBottom: 4 }}>{activeSpace.name}</h1>
      <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 16 }}>
        Participant link: {typeof window !== 'undefined' ? window.location.origin : ''}/?space={activeSpace.id}
      </p>
      {!org.approved && (
        <div style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13 }}>
          Not live yet — this space won't appear for participants until your organization is approved.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {(['zones', 'opportunities', 'resources', 'activities'] as ContentTab[]).map(tab => (
          <button key={tab} onClick={() => setContentTab(tab)}
            style={{ padding: '8px 14px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', background: contentTab === tab ? '#D4AF37' : 'rgba(255,255,255,0.08)', color: contentTab === tab ? '#1C1C2E' : '#F5EFE3' }}>
            {tab === 'zones' ? 'Rooms / Zones' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {contentTab === 'zones' && (
        <div>
          {zones.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12 }}>No rooms/zones added yet.</p>}
          {zones.map(z => (
            <div key={z.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>{z.name}</div>
              {z.parent_zone_id && <div style={{ fontSize: 11, opacity: 0.5 }}>Inside: {zonePath(z.parent_zone_id, zones)}</div>}
              {z.capacity && <div style={{ fontSize: 12, opacity: 0.6 }}>Capacity: {z.capacity}</div>}
              {z.description && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{z.description}</div>}
            </div>
          ))}
          <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Add a room / zone</h2>
          <label style={labelStyle}>Name *</label>
          <input value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="e.g. Faculty of Science, Room 204, Maker Lab" style={inputStyle} />
          <label style={labelStyle}>Inside (optional)</label>
          <select value={zoneForm.parent_zone_id} onChange={e => setZoneForm({ ...zoneForm, parent_zone_id: e.target.value })} style={inputStyle}>
            <option value="">Top level (not inside another zone)</option>
            {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
          </select>
          <label style={labelStyle}>Capacity</label>
          <input value={zoneForm.capacity} onChange={e => setZoneForm({ ...zoneForm, capacity: e.target.value })} placeholder="e.g. 20 people" style={inputStyle} />
          <label style={labelStyle}>Description</label>
          <textarea value={zoneForm.description} onChange={e => setZoneForm({ ...zoneForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 50 }} />
          <button onClick={addZone} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Add room / zone</button>
        </div>
      )}

      {contentTab === 'opportunities' && (
        <div>
          {opportunities.map(o => (
            <div key={o.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>{o.title}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{o.type} · {o.provider}</div>
            </div>
          ))}
          <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Add an opportunity</h2>
          <label style={labelStyle}>Title *</label>
          <input value={oppForm.title} onChange={e => setOppForm({ ...oppForm, title: e.target.value })} placeholder="e.g. Merit Scholarship 2027" style={inputStyle} />
          <label style={labelStyle}>Type</label>
          <select value={oppForm.type} onChange={e => setOppForm({ ...oppForm, type: e.target.value })} style={inputStyle}>
            {OPPORTUNITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <label style={labelStyle}>Provider</label>
          <input value={oppForm.provider} onChange={e => setOppForm({ ...oppForm, provider: e.target.value })} placeholder="Who's offering this?" style={inputStyle} />
          <label style={labelStyle}>Description</label>
          <textarea value={oppForm.description} onChange={e => setOppForm({ ...oppForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} />
          <label style={labelStyle}>Eligibility</label>
          <textarea value={oppForm.eligibility} onChange={e => setOppForm({ ...oppForm, eligibility: e.target.value })} placeholder="Who can apply?" style={{ ...inputStyle, minHeight: 50 }} />
          <label style={labelStyle}>Compensation / value</label>
          <input value={oppForm.compensation} onChange={e => setOppForm({ ...oppForm, compensation: e.target.value })} placeholder="e.g. Ksh 30,000/month, or Unpaid" style={inputStyle} />
          <label style={labelStyle}>Deadline</label>
          <input type="date" value={oppForm.deadline} onChange={e => setOppForm({ ...oppForm, deadline: e.target.value })} style={inputStyle} />
          <label style={labelStyle}>How to apply</label>
          <input value={oppForm.application_method} onChange={e => setOppForm({ ...oppForm, application_method: e.target.value })} placeholder="Link, email, or in-person instructions" style={inputStyle} />
          <label style={labelStyle}>Room / zone (optional)</label>
          <select value={oppForm.zone_id} onChange={e => setOppForm({ ...oppForm, zone_id: e.target.value })} style={inputStyle}>
            <option value="">Anywhere in this space</option>
            {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
          </select>
          <label style={labelStyle}>Location (if off-site / remote)</label>
          <input value={oppForm.location} onChange={e => setOppForm({ ...oppForm, location: e.target.value })} style={inputStyle} />
          <button onClick={addOpportunity} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Add opportunity</button>
        </div>
      )}

      {contentTab === 'resources' && (
        <div>
          {resources.map(r => (
            <div key={r.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{r.owner}</div>
            </div>
          ))}
          <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Add a resource</h2>
          <label style={labelStyle}>Name *</label>
          <input value={resForm.name} onChange={e => setResForm({ ...resForm, name: e.target.value })} placeholder="e.g. Meeting Room B, Projector" style={inputStyle} />
          <label style={labelStyle}>Owner / department</label>
          <input value={resForm.owner} onChange={e => setResForm({ ...resForm, owner: e.target.value })} style={inputStyle} />
          <label style={labelStyle}>Description</label>
          <textarea value={resForm.description} onChange={e => setResForm({ ...resForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 50 }} />
          <label style={labelStyle}>Availability</label>
          <input value={resForm.availability} onChange={e => setResForm({ ...resForm, availability: e.target.value })} placeholder="e.g. Mon–Fri, 9am–5pm" style={inputStyle} />
          <label style={labelStyle}>Capacity</label>
          <input value={resForm.capacity} onChange={e => setResForm({ ...resForm, capacity: e.target.value })} placeholder="e.g. Seats 12" style={inputStyle} />
          <label style={labelStyle}>Room / zone (optional)</label>
          <select value={resForm.zone_id} onChange={e => setResForm({ ...resForm, zone_id: e.target.value })} style={inputStyle}>
            <option value="">Anywhere in this space</option>
            {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
          </select>
          <button onClick={addResource} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Add resource</button>
        </div>
      )}

      {contentTab === 'activities' && (
        <div>
          {activities.map(a => (
            <div key={a.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>{a.title}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{a.host}</div>
            </div>
          ))}
          <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>Add an activity</h2>
          <label style={labelStyle}>Title *</label>
          <input value={actForm.title} onChange={e => setActForm({ ...actForm, title: e.target.value })} placeholder="e.g. Founder Meetup" style={inputStyle} />
          <label style={labelStyle}>Host</label>
          <input value={actForm.host} onChange={e => setActForm({ ...actForm, host: e.target.value })} style={inputStyle} />
          <label style={labelStyle}>Description</label>
          <textarea value={actForm.description} onChange={e => setActForm({ ...actForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 50 }} />
          <label style={labelStyle}>Category</label>
          <input value={actForm.category} onChange={e => setActForm({ ...actForm, category: e.target.value })} placeholder="e.g. Workshop, Talk, Networking" style={inputStyle} />
          <label style={labelStyle}>Start time</label>
          <input type="datetime-local" value={actForm.start_time} onChange={e => setActForm({ ...actForm, start_time: e.target.value })} style={inputStyle} />
          <label style={labelStyle}>End time</label>
          <input type="datetime-local" value={actForm.end_time} onChange={e => setActForm({ ...actForm, end_time: e.target.value })} style={inputStyle} />
          <label style={labelStyle}>Room / zone (optional)</label>
          <select value={actForm.zone_id} onChange={e => setActForm({ ...actForm, zone_id: e.target.value })} style={inputStyle}>
            <option value="">Anywhere in this space</option>
            {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
          </select>
          <label style={labelStyle}>Capacity</label>
          <input value={actForm.capacity} onChange={e => setActForm({ ...actForm, capacity: e.target.value })} style={inputStyle} />
          <label style={labelStyle}>Registration link</label>
          <input value={actForm.registration_link} onChange={e => setActForm({ ...actForm, registration_link: e.target.value })} style={inputStyle} />
          <button onClick={addActivity} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Add activity</button>
        </div>
      )}
    </div>
  );
}

