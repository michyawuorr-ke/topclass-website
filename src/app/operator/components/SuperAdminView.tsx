'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Org, Space, Member, SpaceAdmin, inputStyle, labelStyle } from '../types';
import { OperatorShell } from './OperatorShell';
import { StatGrid, Stat } from './StatGrid';
import { SectionHeader } from './SectionHeader';

type Tab = 'overview' | 'spaces' | 'team' | 'sso';

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  width: '100%', padding: '10px 12px', marginBottom: 10, borderRadius: 8,
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#F5EFE3', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit',
  ...extra,
});
const lbl: React.CSSProperties = { fontSize: 11, opacity: 0.5, marginBottom: 4, display: 'block', letterSpacing: 0.5 };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 };
const primaryBtn: React.CSSProperties = { width: '100%', padding: '11px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginBottom: 8 };
const ghostBtn: React.CSSProperties = { padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,80,80,0.3)', background: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 12 };

export function SuperAdminView({ org, signOut }: { org: Org; signOut: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [spaceAdminsBySpace, setSpaceAdminsBySpace] = useState<Record<string, SpaceAdmin[]>>({});
  const [zoneCounts, setZoneCounts] = useState<Record<string, number>>({});
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState('university');
  const [newSpaceCode, setNewSpaceCode] = useState('');
  const [newSpaceDomain, setNewSpaceDomain] = useState('');
  const [newDeanEmail, setNewDeanEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [ssoEmail, setSsoEmail] = useState(org.email_domain || '');
  const [ssoSaving, setSsoSaving] = useState(false);
  const [stats, setStats] = useState<Stat[]>([]);
  const [pendingApps, setPendingApps] = useState(0);

  useEffect(() => {
    loadAll();
  }, [org.id]);

  const loadAll = async () => {
    const { data: sp } = await supabase.from('spaces').select('*').eq('organization_id', org.id);
    const { data: mb } = await supabase.from('organization_members').select('*').eq('organization_id', org.id);
    setSpaces(sp || []);
    setMembers(mb || []);

    const spaceIds = (sp || []).map((s: any) => s.id);
    let users = 0, conns = 0, apps = 0;
    if (spaceIds.length > 0) {
      const [{ count: u }, { count: c }, { data: sa }, { data: zn }] = await Promise.all([
        supabase.from('presence').select('id', { count: 'exact', head: true }).in('space_id', spaceIds),
        supabase.from('connections').select('id', { count: 'exact', head: true }).in('space_id', spaceIds).eq('handshake_accepted', true),
        supabase.from('space_admins').select('*').in('space_id', spaceIds),
        supabase.from('zones').select('id, space_id').in('space_id', spaceIds),
      ]);
      const byspace: Record<string, SpaceAdmin[]> = {};
      (sa || []).forEach((a: any) => { (byspace[a.space_id] ||= []).push(a); });
      setSpaceAdminsBySpace(byspace);
      const zcounts: Record<string, number> = {};
      (zn || []).forEach((z: any) => { zcounts[z.space_id] = (zcounts[z.space_id] || 0) + 1; });
      setZoneCounts(zcounts);
      const { data: opps } = await supabase.from('opportunities').select('id').in('space_id', spaceIds);
      const oppIds = (opps || []).map((o: any) => o.id);
      if (oppIds.length > 0) {
        const { count: a } = await supabase.from('opportunity_applications').select('id', { count: 'exact', head: true }).in('opportunity_id', oppIds).eq('status', 'applied');
        apps = a || 0;
      }
      users = u || 0; conns = c || 0;
    }
    setPendingApps(apps);
    setStats([
      { label: 'Active users right now', value: users },
      { label: 'Total connections made', value: conns },
      { label: 'Spaces', value: (sp || []).length },
      { label: 'Pending applications', value: apps, accent: apps > 0 },
    ]);
  };

  const createSpace = async () => {
    if (!newSpaceName.trim()) return;
    const { data, error } = await supabase.from('spaces')
      .insert({
        name: newSpaceName.trim(), type: newSpaceType, organization_id: org.id,
        space_code: newSpaceCode.trim() || null,
        domain_restriction: newSpaceDomain.trim().toLowerCase() || null,
      })
      .select().single();
    if (error) { window.alert(error.message); return; }
    if (newDeanEmail.trim()) {
      const { error: deanErr } = await supabase.from('space_admins').insert({ space_id: data.id, invite_email: newDeanEmail.trim() });
      if (deanErr) window.alert(`Space created, but dean invite failed: ${deanErr.message}`);
    }
    setSpaces(prev => [...prev, data]);
    setNewSpaceName(''); setNewSpaceCode(''); setNewSpaceDomain(''); setNewDeanEmail('');
    loadAll();
  };

  const archiveSpace = async (id: string) => {
    if (!window.confirm('Archive this space? Participants will no longer see it.')) return;
    await supabase.from('spaces').delete().eq('id', id);
    setSpaces(prev => prev.filter(s => s.id !== id));
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;
    const { error } = await supabase.from('organization_members')
      .insert({ organization_id: org.id, invite_email: inviteEmail.trim(), role: inviteRole });
    if (error) { window.alert(error.message); return; }
    setInviteEmail('');
    const { data } = await supabase.from('organization_members').select('*').eq('organization_id', org.id);
    setMembers(data || []);
  };

  const saveSSO = async () => {
    setSsoSaving(true);
    const { error } = await supabase.from('organizations')
      .update({ email_domain: ssoEmail.trim().toLowerCase() || null }).eq('id', org.id);
    setSsoSaving(false);
    if (error) window.alert(error.message);
    else window.alert('Domain saved.');
  };

  const nav = [
    { id: 'overview', label: 'Overview', icon: '◈', badge: pendingApps },
    { id: 'spaces',   label: 'Spaces',   icon: '⬡' },
    { id: 'team',     label: 'Team',     icon: '👥' },
    { id: 'sso',      label: 'SSO / Domain', icon: '🔐' },
  ];

  return (
    <OperatorShell orgName={org.name} roleBadge="Super admin" roleColor="#D4AF37" nav={nav} activeTab={tab} onTab={t => setTab(t as Tab)} onSignOut={signOut}>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <>
          {!org.approved && (
            <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, lineHeight: 1.6 }}>
              ⚠️ Your organization is pending approval. Spaces won't appear to participants until approved.
            </div>
          )}
          <SectionHeader title="Org-wide metrics" />
          <StatGrid stats={stats} />

          <SectionHeader title="All spaces" />
          {spaces.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>No spaces yet. Create one in the Spaces tab.</p>}
          {spaces.map(s => (
            <div key={s.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 11, opacity: 0.45, marginTop: 2 }}>{s.type} · {s.id.slice(0, 8)}</div>
              </div>
              <button onClick={() => archiveSpace(s.id)} style={ghostBtn}>Archive</button>
            </div>
          ))}
        </>
      )}

      {/* ── Spaces ── */}
      {tab === 'spaces' && (
        <>
          <SectionHeader title="Space Creation Drawer" sub="Each School, faculty, or hub gets its own top-level Space, with its own code, domain binding, and delegated lead." />
          <label style={lbl}>Space name *</label>
          <input value={newSpaceName} onChange={e => setNewSpaceName(e.target.value)} placeholder="e.g. School of Business" style={inp()} />
          <label style={lbl}>Type</label>
          <select value={newSpaceType} onChange={e => setNewSpaceType(e.target.value)} style={inp()}>
            <option value="university">University / Faculty</option>
            <option value="innovation_hub">Innovation Hub</option>
          </select>
          <label style={lbl}>Space code</label>
          <input value={newSpaceCode} onChange={e => setNewSpaceCode(e.target.value)} placeholder="e.g. SOB" style={inp()} />
          <label style={lbl}>Domain binding</label>
          <input value={newSpaceDomain} onChange={e => setNewSpaceDomain(e.target.value)} placeholder="e.g. business.uonbi.ac.ke" style={inp()} />
          <label style={lbl}>Space Lead — Dean / Head of School email</label>
          <input value={newDeanEmail} onChange={e => setNewDeanEmail(e.target.value)} placeholder="dean@business.uonbi.ac.ke" style={inp()} />
          <button onClick={createSpace} style={primaryBtn}>Create space &amp; dispatch invite</button>
          <p style={{ fontSize: 11, opacity: 0.4, marginBottom: 24 }}>
            The Space Lead gets full control over this Space — its zones, teams, and content — the first time they sign in at /operator with that email.
          </p>

          <div style={{ marginTop: 8 }}>
            <SectionHeader title="Master Space Directory" sub="Every School created, its assigned lead, active zones, and status." />
            {spaces.map(s => {
              const leads = spaceAdminsBySpace[s.id] || [];
              return (
                <div key={s.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.4, marginTop: 3 }}>
                        {s.type}{s.space_code ? ` · ${s.space_code}` : ''}{s.domain_restriction ? ` · @${s.domain_restriction}` : ''}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                        Lead: {leads.length > 0 ? leads.map(l => l.invite_email).join(', ') : 'unassigned'}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
                        {zoneCounts[s.id] || 0} active zone{(zoneCounts[s.id] || 0) === 1 ? '' : 's'} ·{' '}
                        <span style={{ color: org.approved ? '#1D9E75' : '#D4AF37' }}>{org.approved ? 'Live' : 'Pending approval'}</span>
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.35, marginTop: 2 }}>
                        /?space={s.id}
                      </div>
                    </div>
                    <button onClick={() => archiveSpace(s.id)} style={ghostBtn}>Archive</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Team ── */}
      {tab === 'team' && (
        <>
          <SectionHeader title="Invite a super admin" sub="They manage all spaces, team, and SSO settings." />
          <label style={lbl}>Email *</label>
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="executive@university.edu" style={inp()} />
          <label style={lbl}>Role</label>
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={inp()}>
            <option value="admin">Admin — full org access</option>
            <option value="staff">Staff — space-level only</option>
          </select>
          <button onClick={inviteMember} style={primaryBtn}>Send invite</button>
          <p style={{ fontSize: 11, opacity: 0.4, marginBottom: 24 }}>They sign in at /operator with this email and are matched automatically.</p>

          <SectionHeader title="Organization members" />
          {members.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>Just you so far.</p>}
          {members.map(m => (
            <div key={m.id} style={card}>
              <div style={{ fontWeight: 600 }}>{m.invite_email}</div>
              <div style={{ fontSize: 12, opacity: 0.5, marginTop: 3 }}>
                {m.role} · {m.user_id ? '✓ Active' : 'Invited — not yet signed in'}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── SSO / Domain ── */}
      {tab === 'sso' && (
        <>
          <SectionHeader title="Email domain binding" sub="Only emails on this domain can claim space admin or zone operator invites." />
          <label style={lbl}>Verified domain (e.g. university.edu)</label>
          <input value={ssoEmail} onChange={e => setSsoEmail(e.target.value)} placeholder="university.edu" style={inp()} />
          <button onClick={saveSSO} disabled={ssoSaving} style={primaryBtn}>
            {ssoSaving ? 'Saving…' : 'Save domain'}
          </button>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.7, opacity: 0.65 }}>
            <strong>For full Google SSO:</strong> enable Google as an OAuth provider in your Supabase dashboard under Authentication → Providers → Google. Staff sign in with their institutional Google account and are matched to their invite automatically.<br /><br />
            <strong>Without a domain set:</strong> any email address can claim an invite — useful for pilot mode before committing to a domain.
          </div>
        </>
      )}
    </OperatorShell>
  );
}

