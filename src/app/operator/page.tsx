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

export default function OperatorPage() {
  const [session, setSession]           = useState<any>(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [email, setEmail]               = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [orgForm, setOrgForm]           = useState({ name: '', description: '', website: '', contact_email: '', contact_phone: '', email_domain: '' });
  const [domainOrgs, setDomainOrgs]     = useState<Org[]>([]);
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { role, org, managedSpace, managedZones, loading: roleLoading } =
    useOperatorRole(session?.user?.id ?? null);

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
    if (!orgForm.name.trim() || !session) return;
    const { error } = await supabase.from('organizations').insert({
      name: orgForm.name.trim(),
      owner_id: session.user.id,
      description: orgForm.description || null,
      website: orgForm.website || null,
      contact_email: orgForm.contact_email || null,
      contact_phone: orgForm.contact_phone || null,
      email_domain: orgForm.email_domain.trim().toLowerCase() || null,
    });
    if (error) { window.alert(`Could not create organization: ${error.message}`); return; }
    // Trigger re-resolution
    const { data } = await supabase.auth.getSession();
    setSession({ ...data.session });
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
    return <OrgSetupForm orgForm={orgForm} setOrgForm={setOrgForm} createOrg={createOrg} />;
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
