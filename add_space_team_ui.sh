#!/usr/bin/env bash
set -euo pipefail

# Run from the root of the topclass-website repo in Termux.
# Prereq: the previous RBAC migration script (space_admins / zone_publishers
# tables + policies) must already be applied in Supabase before this UI is
# useful — it just gives operators a form to write into those tables.

echo "==> Writing SpaceTeamPanel.tsx..."
cat > src/app/operator/components/SpaceTeamPanel.tsx <<'TSX_EOF'
import React from 'react';
import { SpaceAdmin, ZonePublisher, Zone, inputStyle, labelStyle, zonePath } from '../types';

export function SpaceTeamPanel({
  spaceAdmins, spaceAdminInviteEmail, setSpaceAdminInviteEmail, inviteSpaceAdmin,
  zonePublishers, zonePublisherInviteEmail, setZonePublisherInviteEmail,
  zonePublisherZoneId, setZonePublisherZoneId, inviteZonePublisher, zones,
}: {
  spaceAdmins: SpaceAdmin[]; spaceAdminInviteEmail: string; setSpaceAdminInviteEmail: (v: string) => void; inviteSpaceAdmin: () => void;
  zonePublishers: ZonePublisher[]; zonePublisherInviteEmail: string; setZonePublisherInviteEmail: (v: string) => void;
  zonePublisherZoneId: string; setZonePublisherZoneId: (v: string) => void; inviteZonePublisher: () => void; zones: Zone[];
}) {
  return (
    <div>
      <h2 style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Space Admins</h2>
      <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>
        Full control over this space and its zones — deans, heads of department.
      </p>
      {spaceAdmins.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12 }}>None yet.</p>}
      {spaceAdmins.map(a => (
        <div key={a.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{a.invite_email}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{a.user_id ? 'Active' : 'Invited — not yet signed in'}</div>
        </div>
      ))}
      <label style={labelStyle}>Email *</label>
      <input value={spaceAdminInviteEmail} onChange={e => setSpaceAdminInviteEmail(e.target.value)} placeholder="dean@university.edu" style={inputStyle} />
      <button onClick={inviteSpaceAdmin} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', marginBottom: 28 }}>
        Add space admin
      </button>

      <h2 style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Zone Publishers</h2>
      <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>
        Can post opportunities, resources, and activities into one zone only — professors, lab leads, student coordinators.
      </p>
      {zonePublishers.length === 0 && <p style={{ opacity: 0.5, marginBottom: 12 }}>None yet.</p>}
      {zonePublishers.map(p => (
        <div key={p.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{p.invite_email}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            {zonePath(p.zone_id, zones) || 'Unknown zone'} · {p.user_id ? 'Active' : 'Invited — not yet signed in'}
          </div>
        </div>
      ))}
      <label style={labelStyle}>Email *</label>
      <input value={zonePublisherInviteEmail} onChange={e => setZonePublisherInviteEmail(e.target.value)} placeholder="professor@university.edu" style={inputStyle} />
      <label style={labelStyle}>Zone *</label>
      <select value={zonePublisherZoneId} onChange={e => setZonePublisherZoneId(e.target.value)} style={inputStyle}>
        <option value="">Select a zone...</option>
        {zones.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
      </select>
      <button onClick={inviteZonePublisher} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>
        Add zone publisher
      </button>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>They'll get access automatically the first time they sign in at /operator with this email.</p>
    </div>
  );
}
TSX_EOF

echo "==> Writing types.ts..."
cat > src/app/operator/types.ts <<'TS_EOF'
import type { CSSProperties } from 'react';

export interface Org {
  id: string; name: string; owner_id: string; approved: boolean;
  description?: string; website?: string; contact_email?: string; contact_phone?: string;
  // Entry-flow configuration (see src/app/entry/) — optional override layer
  environment_type?: string;
  logo_url?: string;
  primary_color?: string;
  background_color?: string;
  entry_config?: Record<string, unknown> | null;
}
export interface Space {
  id: string; organization_id: string; name: string; type: string;
  entry_config?: Record<string, unknown> | null;
}
export interface Zone {
  id: string; space_id: string; name: string; description?: string; capacity?: string;
  parent_zone_id?: string | null;
}
export interface Item { id: string; [key: string]: any; }
export interface Member { id: string; organization_id: string; user_id: string | null; invite_email: string; role: string; created_at: string; }
export interface SpaceAdmin { id: string; space_id: string; user_id: string | null; invite_email: string; created_at: string; }
export interface ZonePublisher { id: string; zone_id: string; user_id: string | null; invite_email: string; created_at: string; }
export interface Application {
  id: string; opportunity_id: string; profile_id: string; note: string | null; status: string; created_at: string;
  opportunities?: { title: string };
  profiles?: { name: string; title: string; domain: string };
}

// Kept deliberately narrow — University and Innovation Hub are the two
// verticals actually being piloted. The fuller EntryConfig system
// (src/app/entry/types.ts) already supports Hotel/Coworking/Custom in
// code — enabling them here later is a one-line change, not new work.
export const SPACE_TYPES = ['university', 'innovation_hub'];
export const ENVIRONMENT_TYPES = [
  { value: 'university',     label: 'University / Campus' },
  { value: 'innovation_hub', label: 'Innovation Hub' },
];

export const OPPORTUNITY_TYPES = [
  'Scholarship', 'Fellowship', 'Grant',
  'Job', 'Internship',
  'Mentorship', 'Research Collaboration',
  'Accelerator', 'Program', 'Cohort',
  'Workshop', 'Training', 'Competition',
  'Partnership', 'Collaboration',
  'Experience / Activity',
  'Consultation', 'Other',
];

export const emptyOpportunity = {
  title: '', type: OPPORTUNITY_TYPES[0], provider: '', description: '', eligibility: '',
  compensation: '', deadline: '', application_method: '', zone_id: '', location: '', status: 'open', image_url: '',
};
export const emptyResource = { name: '', owner: '', description: '', availability: '', capacity: '', zone_id: '', image_url: '' };
export const emptyActivity = {
  title: '', host: '', description: '', category: '', start_time: '', end_time: '',
  zone_id: '', capacity: '', registration_link: '', image_url: '',
};

export const inputStyle: CSSProperties = { width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none', fontFamily: 'inherit' };
export const labelStyle: CSSProperties = { fontSize: 11, opacity: 0.6, marginBottom: 4, display: 'block' };

// Builds "Faculty > Building > Room" style path labels from a flat zone list
export function zonePath(zoneId: string | null | undefined, list: Zone[]): string {
  if (!zoneId) return '';
  const z = list.find(zz => zz.id === zoneId);
  if (!z) return '';
  const parent = z.parent_zone_id ? zonePath(z.parent_zone_id, list) : '';
  return parent ? `${parent} > ${z.name}` : z.name;
}

TS_EOF

echo "==> Writing page.tsx..."
cat > src/app/operator/page.tsx <<'PAGE_EOF'
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Org, Space, Zone, Item, Member, SpaceAdmin, ZonePublisher, Application, emptyOpportunity, emptyResource, emptyActivity } from './types';
import { AuthGate } from './components/AuthGate';
import { OrgSetupForm } from './components/OrgSetupForm';
import { SpacesList } from './components/SpacesList';
import { TeamPanel } from './components/TeamPanel';
import { SpaceTeamPanel } from './components/SpaceTeamPanel';
import { ZonesPanel } from './components/ZonesPanel';
import { OpportunitiesPanel } from './components/OpportunitiesPanel';
import { ResourcesPanel } from './components/ResourcesPanel';
import { ActivitiesPanel } from './components/ActivitiesPanel';
import { HomePanel } from './components/HomePanel';
import { PeoplePanel } from './components/PeoplePanel';
import { ApplicationsPanel } from './components/ApplicationsPanel';

export default function OperatorDashboard() {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [org, setOrg] = useState<Org | null>(null);
  const [orgForm, setOrgForm] = useState({ name: '', description: '', website: '', contact_email: '', contact_phone: '' });

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState('university');
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);

  type ContentTab = 'home' | 'zones' | 'opportunities' | 'resources' | 'activities' | 'applications' | 'people' | 'team';
  const [contentTab, setContentTab] = useState<ContentTab>('home');

  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneForm, setZoneForm] = useState({ name: '', description: '', capacity: '', parent_zone_id: '' });

  const [opportunities, setOpportunities] = useState<Item[]>([]);
  const [oppForm, setOppForm] = useState({ ...emptyOpportunity });

  const [resources, setResources] = useState<Item[]>([]);
  const [resForm, setResForm] = useState({ ...emptyResource });

  const [activities, setActivities] = useState<Item[]>([]);
  const [actForm, setActForm] = useState({ ...emptyActivity });

  const [applications, setApplications] = useState<Application[]>([]);

  const [homeStats, setHomeStats] = useState({ activePopulation: 0, pendingApplications: 0, upcomingActivities: 0, connectionsCount: 0 });
  const [presentPeople, setPresentPeople] = useState<any[]>([]);

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
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/operator` },
    });
    if (!error) setMagicLinkSent(true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setOrg(null);
    setSpaces([]);
    setActiveSpace(null);
  };

  // ---- Organization ----
  // Auto-claim any pending invite matching this email, then find the
  // org via ownership OR membership — not just owner_id.
  useEffect(() => {
    if (!session) return;

    const resolveOrg = async () => {
      const email = session.user.email;
      if (email) {
        await supabase.from('organization_members')
          .update({ user_id: session.user.id })
          .is('user_id', null)
          .eq('invite_email', email);
      }

      const { data: owned } = await supabase.from('organizations')
        .select('*').eq('owner_id', session.user.id).maybeSingle();
      if (owned) { setOrg(owned); return; }

      const { data: membership } = await supabase.from('organization_members')
        .select('organization_id').eq('user_id', session.user.id).limit(1).maybeSingle();
      if (membership) {
        const { data: memberOrg } = await supabase.from('organizations')
          .select('*').eq('id', membership.organization_id).maybeSingle();
        if (memberOrg) setOrg(memberOrg);
      }
    };
    resolveOrg();
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
    if (error) { window.alert(`Could not create organization: ${error.message}`); return; }
    if (data) setOrg(data);
  };

  // ---- Team ----
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [showTeam, setShowTeam] = useState(false);

  const fetchMembers = async () => {
    if (!org) return;
    const { data } = await supabase.from('organization_members').select('*').eq('organization_id', org.id);
    setMembers(data || []);
  };

  useEffect(() => { if (org) fetchMembers(); }, [org]);

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !org) return;
    const { error } = await supabase.from('organization_members').insert({
      organization_id: org.id, invite_email: inviteEmail.trim(), role: inviteRole,
    });
    if (error) { window.alert(`Could not send invite: ${error.message}`); return; }
    setInviteEmail('');
    fetchMembers();
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
    if (error) { window.alert(`Could not create space: ${error.message}`); return; }
    if (data) {
      setSpaces(prev => [...prev, data]);
      setNewSpaceName('');
    }
  };

  // ---- Space/Zone team (Tier 2/3 delegated admin) ----
  const [spaceAdmins, setSpaceAdmins] = useState<SpaceAdmin[]>([]);
  const [spaceAdminInviteEmail, setSpaceAdminInviteEmail] = useState('');
  const [zonePublishers, setZonePublishers] = useState<ZonePublisher[]>([]);
  const [zonePublisherInviteEmail, setZonePublisherInviteEmail] = useState('');
  const [zonePublisherZoneId, setZonePublisherZoneId] = useState('');

  const fetchSpaceTeam = async (space: Space) => {
    const [{ data: admins }, { data: publishers }] = await Promise.all([
      supabase.from('space_admins').select('*').eq('space_id', space.id),
      supabase.from('zone_publishers').select('*, zones!inner(space_id)').eq('zones.space_id', space.id),
    ]);
    setSpaceAdmins(admins || []);
    setZonePublishers(publishers || []);
  };

  const inviteSpaceAdmin = async () => {
    if (!spaceAdminInviteEmail.trim() || !activeSpace) return;
    const { error } = await supabase.from('space_admins').insert({
      space_id: activeSpace.id, invite_email: spaceAdminInviteEmail.trim(),
    });
    if (error) { window.alert(`Could not add space admin: ${error.message}`); return; }
    setSpaceAdminInviteEmail('');
    fetchSpaceTeam(activeSpace);
  };

  const inviteZonePublisher = async () => {
    if (!zonePublisherInviteEmail.trim() || !zonePublisherZoneId || !activeSpace) return;
    const { error } = await supabase.from('zone_publishers').insert({
      zone_id: zonePublisherZoneId, invite_email: zonePublisherInviteEmail.trim(),
    });
    if (error) { window.alert(`Could not add zone publisher: ${error.message}`); return; }
    setZonePublisherInviteEmail('');
    setZonePublisherZoneId('');
    fetchSpaceTeam(activeSpace);
  };

  // ---- Zones ----
  const fetchZones = async (space: Space) => {
    const { data } = await supabase.from('zones').select('*').eq('space_id', space.id);
    setZones(data || []);
  };

  const addZone = async () => {
    if (!zoneForm.name.trim() || !activeSpace) return;
    const { error } = await supabase.from('zones').insert({
      space_id: activeSpace.id, name: zoneForm.name,
      description: zoneForm.description || null, capacity: zoneForm.capacity || null,
      parent_zone_id: zoneForm.parent_zone_id || null,
    });
    if (error) { window.alert(`Could not add zone: ${error.message}`); return; }
    setZoneForm({ name: '', description: '', capacity: '', parent_zone_id: '' });
    fetchZones(activeSpace);
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

    const oppIds = (opps || []).map(o => o.id);
    if (oppIds.length > 0) {
      const { data: apps } = await supabase.from('opportunity_applications')
        .select('*, opportunities(title), profiles(name, title, domain)')
        .in('opportunity_id', oppIds)
        .order('created_at', { ascending: false });
      setApplications(apps || []);
    } else {
      setApplications([]);
    }
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    await supabase.from('opportunity_applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  // ---- Home / People ----
  const fetchHomeAndPeople = async (space: Space) => {
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
      const { count } = await supabase.from('opportunity_applications')
        .select('id', { count: 'exact', head: true }).in('opportunity_id', oppIds).eq('status', 'applied');
      pendingCount = count || 0;
    }

    setHomeStats({
      activePopulation: (presence || []).length,
      pendingApplications: pendingCount,
      upcomingActivities: upcomingCount || 0,
      connectionsCount: typeof connCount === 'number' ? connCount : 0,
    });
  };

  useEffect(() => {
    if (activeSpace) { fetchZones(activeSpace); fetchContent(activeSpace); fetchSpaceTeam(activeSpace); }
  }, [activeSpace]);

  // Depends on `opportunities` being loaded (for the pending-applications
  // count), so it runs after fetchContent populates it.
  useEffect(() => {
    if (activeSpace) fetchHomeAndPeople(activeSpace);
  }, [activeSpace, opportunities]);

  // ---- Image upload (generic — reusable for any content type's image field) ----
  const [uploadingImage, setUploadingImage] = useState(false);

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('toruok-media').upload(path, file);
    if (error) {
      window.alert(`Upload failed: ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from('toruok-media').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleOppImageSelected = async (file: File) => {
    setUploadingImage(true);
    const url = await uploadImageToStorage(file);
    if (url) setOppForm(prev => ({ ...prev, image_url: url }));
    setUploadingImage(false);
  };

  const handleResImageSelected = async (file: File) => {
    setUploadingImage(true);
    const url = await uploadImageToStorage(file);
    if (url) setResForm(prev => ({ ...prev, image_url: url }));
    setUploadingImage(false);
  };

  const handleActImageSelected = async (file: File) => {
    setUploadingImage(true);
    const url = await uploadImageToStorage(file);
    if (url) setActForm(prev => ({ ...prev, image_url: url }));
    setUploadingImage(false);
  };

  const addOpportunity = async () => {
    if (!oppForm.title.trim() || !activeSpace) return;
    const { error } = await supabase.from('opportunities').insert({
      space_id: activeSpace.id,
      title: oppForm.title, type: oppForm.type, provider: oppForm.provider || null,
      description: oppForm.description || null, eligibility: oppForm.eligibility || null,
      compensation: oppForm.compensation || null,
      deadline: oppForm.deadline ? new Date(oppForm.deadline).toISOString() : null,
      application_method: oppForm.application_method || null,
      zone_id: oppForm.zone_id || null, location: oppForm.location || null, status: oppForm.status,
      image_url: oppForm.image_url || null,
    });
    if (error) { window.alert(`Could not add opportunity: ${error.message}`); return; }
    setOppForm({ ...emptyOpportunity });
    fetchContent(activeSpace);
  };

  const addResource = async () => {
    if (!resForm.name.trim() || !activeSpace) return;
    const { error } = await supabase.from('resources').insert({
      space_id: activeSpace.id,
      name: resForm.name, owner: resForm.owner || null, description: resForm.description || null,
      availability: resForm.availability || null, capacity: resForm.capacity || null,
      zone_id: resForm.zone_id || null, image_url: resForm.image_url || null,
    });
    if (error) { window.alert(`Could not add resource: ${error.message}`); return; }
    setResForm({ ...emptyResource });
    fetchContent(activeSpace);
  };

  const addActivity = async () => {
    if (!actForm.title.trim() || !activeSpace) return;
    const { error } = await supabase.from('activities').insert({
      space_id: activeSpace.id,
      title: actForm.title, host: actForm.host || null, description: actForm.description || null,
      category: actForm.category || null,
      start_time: actForm.start_time ? new Date(actForm.start_time).toISOString() : null,
      end_time: actForm.end_time ? new Date(actForm.end_time).toISOString() : null,
      zone_id: actForm.zone_id || null, capacity: actForm.capacity || null,
      registration_link: actForm.registration_link || null, image_url: actForm.image_url || null,
    });
    if (error) { window.alert(`Could not add activity: ${error.message}`); return; }
    setActForm({ ...emptyActivity });
    fetchContent(activeSpace);
  };

  // ============================================================
  // Render — orchestration only, markup lives in components/
  // ============================================================
  if (authLoading) return <div style={{ padding: 24, color: '#F5EFE3', background: '#1C1C2E', minHeight: '100vh' }}>Loading...</div>;
  if (!session) return <AuthGate email={email} setEmail={setEmail} magicLinkSent={magicLinkSent} sendMagicLink={sendMagicLink} />;
  if (!org) return <OrgSetupForm orgForm={orgForm} setOrgForm={setOrgForm} createOrg={createOrg} />;

  if (!activeSpace) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', gap: 8, padding: '16px 20px 0', maxWidth: 480, margin: '0 auto' }}>
          <button onClick={() => setShowTeam(false)}
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', background: !showTeam ? '#D4AF37' : 'rgba(255,255,255,0.08)', color: !showTeam ? '#1C1C2E' : '#F5EFE3' }}>
            Spaces
          </button>
          <button onClick={() => setShowTeam(true)}
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', background: showTeam ? '#D4AF37' : 'rgba(255,255,255,0.08)', color: showTeam ? '#1C1C2E' : '#F5EFE3' }}>
            Team
          </button>
        </div>
        {showTeam ? (
          <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
            <TeamPanel members={members} inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} inviteRole={inviteRole} setInviteRole={setInviteRole} inviteMember={inviteMember} />
          </div>
        ) : (
          <SpacesList
            org={org} spaces={spaces} setActiveSpace={setActiveSpace}
            newSpaceName={newSpaceName} setNewSpaceName={setNewSpaceName}
            newSpaceType={newSpaceType} setNewSpaceType={setNewSpaceType}
            createSpace={createSpace} signOut={signOut}
          />
        )}
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
        {(['home', 'people', 'zones', 'opportunities', 'applications', 'resources', 'activities', 'team'] as ContentTab[]).map(tab => (
          <button key={tab} onClick={() => setContentTab(tab)}
            style={{ padding: '8px 14px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', background: contentTab === tab ? '#D4AF37' : 'rgba(255,255,255,0.08)', color: contentTab === tab ? '#1C1C2E' : '#F5EFE3' }}>
            {tab === 'zones' ? 'Rooms / Zones' : tab === 'team' ? 'Space Team' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {contentTab === 'home' && <HomePanel stats={homeStats} />}
      {contentTab === 'people' && <PeoplePanel people={presentPeople} />}
      {contentTab === 'team' && (
        <SpaceTeamPanel
          spaceAdmins={spaceAdmins} spaceAdminInviteEmail={spaceAdminInviteEmail} setSpaceAdminInviteEmail={setSpaceAdminInviteEmail} inviteSpaceAdmin={inviteSpaceAdmin}
          zonePublishers={zonePublishers} zonePublisherInviteEmail={zonePublisherInviteEmail} setZonePublisherInviteEmail={setZonePublisherInviteEmail}
          zonePublisherZoneId={zonePublisherZoneId} setZonePublisherZoneId={setZonePublisherZoneId} inviteZonePublisher={inviteZonePublisher} zones={zones}
        />
      )}
      {contentTab === 'zones' && <ZonesPanel zones={zones} zoneForm={zoneForm} setZoneForm={setZoneForm} addZone={addZone} />}
      {contentTab === 'opportunities' && (
        <OpportunitiesPanel
          opportunities={opportunities} oppForm={oppForm} setOppForm={setOppForm} addOpportunity={addOpportunity} zones={zones}
          uploadingImage={uploadingImage} onImageSelected={handleOppImageSelected}
        />
      )}
      {contentTab === 'applications' && <ApplicationsPanel applications={applications} updateApplicationStatus={updateApplicationStatus} />}
      {contentTab === 'resources' && (
        <ResourcesPanel
          resources={resources} resForm={resForm} setResForm={setResForm} addResource={addResource} zones={zones}
          uploadingImage={uploadingImage} onImageSelected={handleResImageSelected}
        />
      )}
      {contentTab === 'activities' && (
        <ActivitiesPanel
          activities={activities} actForm={actForm} setActForm={setActForm} addActivity={addActivity} zones={zones}
          uploadingImage={uploadingImage} onImageSelected={handleActImageSelected}
        />
      )}
    </div>
  );
}

PAGE_EOF

echo "==> Updating PROJECT.md..."
cat > /tmp/.pm_old3.txt <<'OLD3_EOF'
- No operator UI yet for inviting space admins or zone publishers —
  needs the same invite-by-email flow `organization_members` already
  has for team invites, just pointed at the two new tables.
OLD3_EOF
cat > /tmp/.pm_new3.txt <<'NEW3_EOF'
- Space admin / zone publisher invites are still manual, one at a
  time, from a **Space Team** tab inside each space (mirrors the
  existing org-level Team tab, same "no separate claim step" pattern
  — invited person just signs in at `/operator` with the matching
  email). SSO claims auto-provisioning these rows instead of a manual
  invite is still a separate, unbuilt integration.
NEW3_EOF
node <<'NODE_EOF'
const fs = require('fs');
const strip = s => s.replace(/\n$/, '');
let text = fs.readFileSync('PROJECT.md', 'utf8');

const oldS = strip(fs.readFileSync('/tmp/.pm_old3.txt', 'utf8'));
const newS = strip(fs.readFileSync('/tmp/.pm_new3.txt', 'utf8'));
if (!text.includes(oldS)) { console.error('anchor not found — PROJECT.md may have changed since this script was written'); process.exit(1); }
text = text.replace(oldS, newS);

fs.writeFileSync('PROJECT.md', text);
console.log('PROJECT.md updated.');
NODE_EOF
rm -f /tmp/.pm_old3.txt /tmp/.pm_new3.txt

echo "==> Type-checking..."
npx tsc --noEmit

echo "==> Done. Then:"
echo "    git add src/app/operator/components/SpaceTeamPanel.tsx src/app/operator/types.ts src/app/operator/page.tsx PROJECT.md"
echo '    git commit -m "Operator UI for inviting space admins / zone publishers"'
echo "    git push"
