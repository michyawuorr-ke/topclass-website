'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Org, Space, Zone, Item, Member, emptyOpportunity, emptyResource, emptyActivity } from './types';
import { AuthGate } from './components/AuthGate';
import { OrgSetupForm } from './components/OrgSetupForm';
import { SpacesList } from './components/SpacesList';
import { TeamPanel } from './components/TeamPanel';
import { ZonesPanel } from './components/ZonesPanel';
import { OpportunitiesPanel } from './components/OpportunitiesPanel';
import { ResourcesPanel } from './components/ResourcesPanel';
import { ActivitiesPanel } from './components/ActivitiesPanel';

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
    if (!error && data) setOrg(data);
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
    await supabase.from('organization_members').insert({
      organization_id: org.id, invite_email: inviteEmail.trim(), role: inviteRole,
    });
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
        {(['zones', 'opportunities', 'resources', 'activities'] as ContentTab[]).map(tab => (
          <button key={tab} onClick={() => setContentTab(tab)}
            style={{ padding: '8px 14px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', background: contentTab === tab ? '#D4AF37' : 'rgba(255,255,255,0.08)', color: contentTab === tab ? '#1C1C2E' : '#F5EFE3' }}>
            {tab === 'zones' ? 'Rooms / Zones' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {contentTab === 'zones' && <ZonesPanel zones={zones} zoneForm={zoneForm} setZoneForm={setZoneForm} addZone={addZone} />}
      {contentTab === 'opportunities' && <OpportunitiesPanel opportunities={opportunities} oppForm={oppForm} setOppForm={setOppForm} addOpportunity={addOpportunity} zones={zones} />}
      {contentTab === 'resources' && <ResourcesPanel resources={resources} resForm={resForm} setResForm={setResForm} addResource={addResource} zones={zones} />}
      {contentTab === 'activities' && <ActivitiesPanel activities={activities} actForm={actForm} setActForm={setActForm} addActivity={addActivity} zones={zones} />}
    </div>
  );
}

