'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Org } from './types';
import { useOperatorRole } from './hooks/useOperatorRole';
import { AuthGate } from './components/AuthGate';
import { OrgSetupForm } from './components/OrgSetupForm';
import { RequestAccessForm } from './components/RequestAccessForm';
import { SuperAdminView } from './components/SuperAdminView';
import { SpaceAdminView } from './components/SpaceAdminView';
import { ZoneOperatorView } from './components/ZoneOperatorView';

export default function OperatorPage() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', description: '', website: '', contact_email: '', contact_phone: '', email_domain: '' });
  const [domainOrgs, setDomainOrgs] = useState<Org[]>([]);
  const [showCreateOrgForm, setShowCreateOrgForm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { role, org, managedSpace, managedZones, loading: roleLoading } = useOperatorRole(
    session?.user?.id || null,
    session?.user?.email || null
  );

  // Domain-match discovery for "request access" flow
  useEffect(() => {
    if (!session || org || roleLoading) return;
    const userEmail = session.user.email;
    const domain = userEmail?.split('@')[1]?.toLowerCase();
    if (!domain) return;
    supabase.from('organizations').select('*').eq('email_domain', domain).eq('approved', true)
      .then(({ data }) => { if (data && data.length) setDomainOrgs(data); });
  }, [session, org, roleLoading]);

  const sendMagicLink = async () => {
    if (!email.trim()) return;
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/operator` } });
    if (!error) setMagicLinkSent(true);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/operator` } });
    if (error) window.alert(`Google sign-in error: ${error.message}`);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setDomainOrgs([]);
    setShowCreateOrgForm(false);
  };

  const createOrg = async () => {
    if (!orgForm.name.trim() || !session) return;
    const { data, error } = await supabase.from('organizations')
      .insert({ name: orgForm.name.trim(), owner_id: session.user.id, description: orgForm.description || null, website: orgForm.website || null, contact_email: orgForm.contact_email || null, contact_phone: orgForm.contact_phone || null, email_domain: orgForm.email_domain.trim().toLowerCase() || null })
      .select().single();
    if (error) { window.alert(`Could not create organization: ${error.message}`); return; }
    // Re-trigger role resolution by refreshing session
    const { data: refreshed } = await supabase.auth.getSession();
    setSession(refreshed.session);
  };

  if (authLoading || roleLoading) {
    return <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}><div style={{ opacity: 0.5 }}>Loading…</div></div>;
  }

  if (!session) return <AuthGate email={email} setEmail={setEmail} magicLinkSent={magicLinkSent} sendMagicLink={sendMagicLink} signInWithGoogle={signInWithGoogle} />;

  // No org found — offer request access or create new
  if (!org) {
    if (domainOrgs.length > 0 && !showCreateOrgForm) {
      return <RequestAccessForm orgs={domainOrgs} userId={session.user.id} userEmail={session.user.email || ''} onSwitchToCreate={() => setShowCreateOrgForm(true)} onSignOut={signOut} />;
    }
    return <OrgSetupForm orgForm={orgForm} setOrgForm={setOrgForm} createOrg={createOrg} />;
  }

  // Route by resolved role
  if (role === 'super_admin') return <SuperAdminView org={org} signOut={signOut} />;

  if (role === 'space_admin' && managedSpace) return <SpaceAdminView org={org} space={managedSpace} signOut={signOut} />;

  if (role === 'zone_operator' && managedZones.length > 0) return <ZoneOperatorView org={org} space={managedSpace} zones={managedZones} signOut={signOut} />;

  // Authenticated, in an org, but no specific role assigned yet — show a waiting screen
  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: 32 }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Access pending</div>
      <div style={{ opacity: 0.55, fontSize: 14, textAlign: 'center', maxWidth: 320, lineHeight: 1.7 }}>
        You're signed in as <strong>{session.user.email}</strong> but haven't been assigned a space or zone yet. Contact your super admin to get an invite.
      </div>
      <button onClick={signOut} style={{ marginTop: 24, background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#888', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Sign out</button>
    </div>
  );
}
