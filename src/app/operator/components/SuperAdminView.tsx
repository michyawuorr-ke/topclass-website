'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Org, Space, Member, inputStyle, labelStyle } from '../types';
import { SpacesList } from './SpacesList';
import { TeamPanel } from './TeamPanel';

const S = {
  wrap: { minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', fontFamily: 'sans-serif' } as React.CSSProperties,
  header: { padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
  badge: { background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 } as React.CSSProperties,
  tabs: { display: 'flex', gap: 8, padding: '14px 20px 0', overflowX: 'auto' as any },
  tab: (active: boolean): React.CSSProperties => ({ padding: '8px 16px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', cursor: 'pointer', background: active ? '#D4AF37' : 'rgba(255,255,255,0.08)', color: active ? '#1C1C2E' : '#F5EFE3', fontWeight: active ? 600 : 400 }),
  body: { padding: 20, maxWidth: 540, margin: '0 auto' } as React.CSSProperties,
  card: { background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 10 } as React.CSSProperties,
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 } as React.CSSProperties,
  stat: { background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 } as React.CSSProperties,
  signOut: { background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#888', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 } as React.CSSProperties,
};

type Tab = 'overview' | 'spaces' | 'team' | 'sso';

export function SuperAdminView({ org, signOut }: { org: Org; signOut: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState('university');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [globalStats, setGlobalStats] = useState({ totalUsers: 0, totalConnections: 0, totalSpaces: 0, pendingApps: 0 });
  const [ssoForm, setSsoForm] = useState({ email_domain: org.email_domain || '' });
  const [ssoSaving, setSsoSaving] = useState(false);

  useEffect(() => {
    supabase.from('spaces').select('*').eq('organization_id', org.id)
      .then(({ data }) => setSpaces(data || []));
    supabase.from('organization_members').select('*').eq('organization_id', org.id)
      .then(({ data }) => setMembers(data || []));
    fetchGlobalStats();
  }, [org.id]);

  const fetchGlobalStats = async () => {
    const { data: spaceRows } = await supabase.from('spaces').select('id').eq('organization_id', org.id);
    const spaceIds = (spaceRows || []).map((s: any) => s.id);
    const total = spaceIds.length;
    let users = 0, conns = 0, apps = 0;
    if (spaceIds.length > 0) {
      const { count: u } = await supabase.from('presence').select('id', { count: 'exact', head: true }).in('space_id', spaceIds);
      const { count: c } = await supabase.from('connections').select('id', { count: 'exact', head: true }).in('space_id', spaceIds).eq('handshake_accepted', true);
      const { data: opps } = await supabase.from('opportunities').select('id').in('space_id', spaceIds);
      const oppIds = (opps || []).map((o: any) => o.id);
      if (oppIds.length > 0) {
        const { count: a } = await supabase.from('opportunity_applications').select('id', { count: 'exact', head: true }).in('opportunity_id', oppIds).eq('status', 'applied');
        apps = a || 0;
      }
      users = u || 0; conns = c || 0;
    }
    setGlobalStats({ totalUsers: users, totalConnections: conns, totalSpaces: total, pendingApps: apps });
  };

  const createSpace = async () => {
    if (!newSpaceName.trim()) return;
    const { data, error } = await supabase.from('spaces')
      .insert({ name: newSpaceName.trim(), type: newSpaceType, organization_id: org.id })
      .select().single();
    if (error) { window.alert(error.message); return; }
    setSpaces(prev => [...prev, data]);
    setNewSpaceName('');
  };

  const archiveSpace = async (spaceId: string) => {
    if (!window.confirm('Archive this space? Participants will no longer see it.')) return;
    await supabase.from('spaces').delete().eq('id', spaceId);
    setSpaces(prev => prev.filter(s => s.id !== spaceId));
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;
    const { error } = await supabase.from('organization_members').insert({
      organization_id: org.id, invite_email: inviteEmail.trim(), role: inviteRole,
    });
    if (error) { window.alert(error.message); return; }
    setInviteEmail('');
    supabase.from('organization_members').select('*').eq('organization_id', org.id)
      .then(({ data }) => setMembers(data || []));
  };

  const saveSSO = async () => {
    setSsoSaving(true);
    const { error } = await supabase.from('organizations').update({ email_domain: ssoForm.email_domain.trim().toLowerCase() || null }).eq('id', org.id);
    setSsoSaving(false);
    if (error) window.alert(error.message);
    else window.alert('SSO domain saved.');
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{org.name}</div>
          <div style={{ fontSize: 12, opacity: 0.5 }}>Super admin</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={S.badge}>Super admin</span>
          <button style={S.signOut} onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div style={S.tabs}>
        {(['overview', 'spaces', 'team', 'sso'] as Tab[]).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'sso' ? 'SSO / Domain' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={S.body}>
        {/* ── Overview ── */}
        {tab === 'overview' && (
          <>
            <div style={{ marginTop: 20, marginBottom: 6, fontSize: 11, opacity: 0.5, letterSpacing: 1 }}>ORG-WIDE METRICS</div>
            <div style={S.statGrid}>
              {[
                { label: 'Active users', value: globalStats.totalUsers },
                { label: 'Total connections', value: globalStats.totalConnections },
                { label: 'Spaces', value: globalStats.totalSpaces },
                { label: 'Pending applications', value: globalStats.pendingApps },
              ].map(({ label, value }) => (
                <div key={label} style={S.stat}>
                  <div style={{ fontSize: 30, fontWeight: 700 }}>{value}</div>
                  <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
            {!org.approved && (
              <div style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 10, padding: 14, fontSize: 13 }}>
                Your organization is pending approval. Spaces won't be visible to participants yet.
              </div>
            )}
            <div style={{ marginTop: 20, fontSize: 11, opacity: 0.5, letterSpacing: 1, marginBottom: 10 }}>SPACES</div>
            {spaces.map(s => (
              <div key={s.id} style={{ ...S.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>{s.type} · ID: {s.id.slice(0, 8)}</div>
                </div>
                <button onClick={() => archiveSpace(s.id)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#888', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Archive</button>
              </div>
            ))}
          </>
        )}

        {/* ── Spaces ── */}
        {tab === 'spaces' && (
          <>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1, marginBottom: 10 }}>CREATE SPACE</div>
              <label style={labelStyle}>Space name *</label>
              <input value={newSpaceName} onChange={e => setNewSpaceName(e.target.value)}
                placeholder="School of Business" style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3' }} />
              <label style={labelStyle}>Type</label>
              <select value={newSpaceType} onChange={e => setNewSpaceType(e.target.value)}
                style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3' }}>
                <option value="university">University / Faculty</option>
                <option value="innovation_hub">Innovation Hub</option>
              </select>
              <button onClick={createSpace} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}>
                Create space
              </button>

              <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1, marginBottom: 10 }}>ALL SPACES</div>
              {spaces.map(s => (
                <div key={s.id} style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{s.type}</div>
                      <div style={{ fontSize: 11, opacity: 0.4, marginTop: 2 }}>
                        Participant link: {typeof window !== 'undefined' ? window.location.origin : ''}/?space={s.id}
                      </div>
                    </div>
                    <button onClick={() => archiveSpace(s.id)} style={{ background: 'none', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Archive</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Team ── */}
        {tab === 'team' && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1, marginBottom: 6 }}>INVITE SUPER ADMIN</div>
            <p style={{ fontSize: 12, opacity: 0.55, marginBottom: 12 }}>
              Super admins manage all spaces, team, and SSO settings for your organization.
            </p>
            <label style={labelStyle}>Email *</label>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="executive@university.edu"
              style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3' }} />
            <label style={labelStyle}>Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3' }}>
              <option value="admin">Admin</option>
              <option value="staff">Staff (space-level only)</option>
            </select>
            <button onClick={inviteMember} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}>
              Send invite
            </button>

            <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1, marginBottom: 10 }}>ORGANIZATION MEMBERS</div>
            {members.length === 0 && <p style={{ opacity: 0.4, fontSize: 13 }}>Just you so far.</p>}
            {members.map(m => (
              <div key={m.id} style={S.card}>
                <div style={{ fontWeight: 600 }}>{m.invite_email}</div>
                <div style={{ fontSize: 12, opacity: 0.55 }}>{m.role} · {m.user_id ? 'Active' : 'Invited — not yet signed in'}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── SSO / Domain ── */}
        {tab === 'sso' && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1, marginBottom: 6 }}>EMAIL DOMAIN BINDING</div>
            <p style={{ fontSize: 13, opacity: 0.65, marginBottom: 16, lineHeight: 1.6 }}>
              Locking to a domain means only emails ending in <strong>@your-domain</strong> can claim
              space admin or zone operator invites. Leave blank to allow any email.
            </p>
            <label style={labelStyle}>Verified domain (e.g. university.edu)</label>
            <input
              value={ssoForm.email_domain}
              onChange={e => setSsoForm({ email_domain: e.target.value })}
              placeholder="university.edu"
              style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3' }}
            />
            <button onClick={saveSSO} disabled={ssoSaving} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}>
              {ssoSaving ? 'Saving…' : 'Save domain'}
            </button>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, fontSize: 12, opacity: 0.6, lineHeight: 1.7 }}>
              <strong>Note:</strong> For full SSO (single sign-on), enable Google OAuth in your Supabase dashboard under Authentication → Providers → Google. Staff sign in with their institutional Google account and are matched automatically to their invite.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
