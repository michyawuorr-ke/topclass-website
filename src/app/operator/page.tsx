'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOperatorRole, Org } from './hooks/useOperatorRole';
import { AuthGate } from './components/AuthGate';
import { OrgSetupForm } from './components/OrgSetupForm';
import { RequestAccessForm } from './components/RequestAccessForm';
import { SuperAdminView } from './components/SuperAdminView';
import { SpaceAdminView } from './components/SpaceAdminView';
import { ZoneOperatorView } from './components/ZoneOperatorView';
import { HODView } from './components/HODView';
import { LecturerView } from './components/LecturerView';

export default function OperatorPage() {
  const [rawSession, setSession]        = useState<any>(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [email, setEmail]               = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [orgForm, setOrgForm]           = useState({ name: '', description: '', website: '', contact_email: '', contact_phone: '', email_domain: '' });
  const [domainOrgs, setDomainOrgs]     = useState<Org[]>([]);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgCreating, setOrgCreating]   = useState(false);
  const [orgCreateError, setOrgCreateError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // The participant-facing app signs people in anonymously
  // (supabase.auth.signInAnonymously() in EntryFlow), and Supabase
  // sessions are shared across the whole site in one browser — not
  // scoped per page. If this browser ever visited the participant app
  // first, plain `session` here would be that anonymous session, and
  // everything below would treat it as a real signed-in operator.
  // Anonymous users get a real id but email: null, which is exactly
  // why org-creation attempts could silently end up owned by a
  // "nobody" that can never be found again on the next visit. `session`
  // is only ever used through this from here down.
  const session = rawSession && !rawSession.user?.is_anonymous ? rawSession : null;

  const { role, org, managedSpace, managedZones, managedTeams, loading: roleLoading, refetch } =
    useOperatorRole(session?.user?.id ?? null, session?.user?.email ?? null);

  // Domain-match: if no org found, check if their email domain matches an existing org
  useEffect(() => {
    if (!session || org || roleLoading) return;
    const domain = session.user.email?.split('@')[1]?.toLowerCase();
    if (!domain) return;
    supabase.from('organizations').select('*')
      .eq('email_domain', domain).eq('approved', true)
      .then(({ data }) => { if (data?.length) setDomainOrgs(data); });
  }, [session, org, roleLoading]);

  const sendMagicLink = async () => {
    if (!email.trim()) return;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/operator` },
    });
    if (!error) setMagicLinkSent(true);
    else window.alert(error.message);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/operator` },
    });
    if (error) window.alert(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setDomainOrgs([]);
    setShowCreateOrg(false);
  };

  const createOrg = async () => {
    setOrgCreateError('');
    if (!orgForm.name.trim()) { setOrgCreateError('Organization name is required.'); return; }
    if (!session) { setOrgCreateError('Not signed in — try refreshing the page.'); return; }
    setOrgCreating(true);
    const { error } = await supabase.from('organizations').insert({
      name: orgForm.name.trim(),
      owner_id: session.user.id,
      description: orgForm.description || null,
      website: orgForm.website || null,
      contact_email: orgForm.contact_email || null,
      contact_phone: orgForm.contact_phone || null,
      email_domain: orgForm.email_domain.trim().toLowerCase() || null,
    });
    if (error) { setOrgCreating(false); setOrgCreateError(error.message); return; }
    setOrgCreating(false);
    refetch();
  };

  // ── Loading ──
  if (authLoading || roleLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#13131F', color: '#F5EFE3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ opacity: 0.5 }}>Loading…</div>
      </div>
    );
  }

  // ── Not signed in ──
  if (!session) {
    return <AuthGate email={email} setEmail={setEmail} magicLinkSent={magicLinkSent} sendMagicLink={sendMagicLink} signInWithGoogle={signInWithGoogle} />;
  }

  // ── Signed in but no org — offer request access or create ──
  if (!org) {
    if (domainOrgs.length > 0 && !showCreateOrg) {
      return (
        <RequestAccessForm
          orgs={domainOrgs}
          userId={session.user.id}
          userEmail={session.user.email || ''}
          onSwitchToCreate={() => setShowCreateOrg(true)}
          onSignOut={signOut}
        />
      );
    }
    return <OrgSetupForm orgForm={orgForm} setOrgForm={setOrgForm} createOrg={createOrg} creating={orgCreating} error={orgCreateError} />;
  }

  // ── Route by role ──
  if (role === 'super_admin') {
    return <SuperAdminView org={org} signOut={signOut} />;
  }

  if (role === 'space_admin' && managedSpace) {
    return <SpaceAdminView org={org} space={managedSpace} signOut={signOut} />;
  }

  if (role === 'zone_operator' && managedZones.length > 0) {
    return <ZoneOperatorView org={org} space={managedSpace} zones={managedZones} signOut={signOut} />;
  }

  if (role === 'team_lead' && managedTeams.length > 0) {
    return <HODView org={org} space={managedSpace} teams={managedTeams} signOut={signOut} />;
  }

  if (role === 'lecturer') {
    return <LecturerView userId={session.user.id} signOut={signOut} />;
  }

  // ── Signed in, org exists, but no role assigned yet ──
  return (
    <div style={{ minHeight: '100vh', background: '#13131F', color: '#F5EFE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Access pending</div>
      <div style={{ opacity: 0.55, fontSize: 14, maxWidth: 320, lineHeight: 1.7 }}>
        Signed in as <strong>{session.user.email}</strong> but no space or zone has been assigned yet.
        Contact your super admin to get an invite.
      </div>
      <button onClick={signOut} style={{ marginTop: 24, background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#888', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 14 }}>
        Sign out
      </button>
    </div>
  );
}



