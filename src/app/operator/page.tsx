'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Org { id: string; name: string; owner_id: string; approved: boolean; }
interface Space { id: string; organization_id: string; name: string; type: string; }
interface Item { id: string; space_id: string; title?: string; name?: string; [key: string]: any; }

const SPACE_TYPES = ['hotel', 'school', 'cafe', 'library', 'coworking', 'university'];

export default function OperatorDashboard() {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [org, setOrg] = useState<Org | null>(null);
  const [orgNameInput, setOrgNameInput] = useState('');

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState(SPACE_TYPES[0]);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);

  type ContentTab = 'opportunities' | 'resources' | 'activities';
  const [contentTab, setContentTab] = useState<ContentTab>('opportunities');
  const [opportunities, setOpportunities] = useState<Item[]>([]);
  const [resources, setResources] = useState<Item[]>([]);
  const [activities, setActivities] = useState<Item[]>([]);

  const [formTitle, setFormTitle] = useState('');
  const [formSecondary, setFormSecondary] = useState(''); // provider / owner / host
  const [formDetail, setFormDetail] = useState(''); // eligibility / availability / purpose

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
    if (!orgNameInput.trim() || !session) return;
    const { data, error } = await supabase.from('organizations')
      .insert({ name: orgNameInput.trim(), owner_id: session.user.id })
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

  // ---- Content (Opportunities / Resources / Activities) ----
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
    if (activeSpace) fetchContent(activeSpace);
  }, [activeSpace]);

  const addContent = async () => {
    if (!formTitle.trim() || !activeSpace) return;
    if (contentTab === 'opportunities') {
      await supabase.from('opportunities').insert({
        space_id: activeSpace.id, title: formTitle, provider: formSecondary, eligibility: formDetail,
      });
    } else if (contentTab === 'resources') {
      await supabase.from('resources').insert({
        space_id: activeSpace.id, name: formTitle, owner: formSecondary, availability: formDetail,
      });
    } else {
      await supabase.from('activities').insert({
        space_id: activeSpace.id, title: formTitle, host: formSecondary, purpose: formDetail,
      });
    }
    setFormTitle(''); setFormSecondary(''); setFormDetail('');
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
              style={{ padding: 12, borderRadius: 8, width: '100%', maxWidth: 320, marginBottom: 12, border: 'none' }} />
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
      <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: 20, marginBottom: 12 }}>Set up your organization</h1>
        <input value={orgNameInput} onChange={e => setOrgNameInput(e.target.value)} placeholder="Organization name"
          style={{ padding: 12, borderRadius: 8, width: '100%', maxWidth: 320, marginBottom: 12, border: 'none' }} />
        <button onClick={createOrg} style={{ padding: '12px 24px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Create</button>
      </div>
    );
  }

  if (!activeSpace) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', padding: 20, fontFamily: 'sans-serif' }}>
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
        <input value={newSpaceName} onChange={e => setNewSpaceName(e.target.value)} placeholder="Space name"
          style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
        <select value={newSpaceType} onChange={e => setNewSpaceType(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }}>
          {SPACE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={createSpace} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Create space</button>
      </div>
    );
  }

  const currentList = contentTab === 'opportunities' ? opportunities : contentTab === 'resources' ? resources : activities;

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', padding: 20, fontFamily: 'sans-serif' }}>
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

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['opportunities', 'resources', 'activities'] as ContentTab[]).map(tab => (
          <button key={tab} onClick={() => setContentTab(tab)}
            style={{ padding: '8px 14px', borderRadius: 20, border: 'none', background: contentTab === tab ? '#D4AF37' : 'rgba(255,255,255,0.08)', color: contentTab === tab ? '#1C1C2E' : '#F5EFE3' }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {currentList.map(item => (
        <div key={item.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{item.title || item.name}</div>
        </div>
      ))}

      <h2 style={{ fontSize: 14, opacity: 0.6, margin: '16px 0 10px' }}>
        Add {contentTab === 'opportunities' ? 'an opportunity' : contentTab === 'resources' ? 'a resource' : 'an activity'}
      </h2>
      <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Title / name"
        style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
      <input value={formSecondary} onChange={e => setFormSecondary(e.target.value)}
        placeholder={contentTab === 'opportunities' ? 'Provider' : contentTab === 'resources' ? 'Owner' : 'Host'}
        style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
      <input value={formDetail} onChange={e => setFormDetail(e.target.value)}
        placeholder={contentTab === 'opportunities' ? 'Eligibility' : contentTab === 'resources' ? 'Availability' : 'Purpose'}
        style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: 'none' }} />
      <button onClick={addContent} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Add</button>
    </div>
  );
}

