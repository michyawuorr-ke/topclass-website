'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface NavItem { id: string; label: string; icon: (active: boolean) => React.ReactNode; badge?: number; }

interface Props {
  orgName: string;
  spaceName?: string;
  roleBadge: string;
  roleColor: string;
  nav: NavItem[];
  activeTab: string;
  onTab: (id: string) => void;
  onSignOut: () => void;
  children: React.ReactNode;
  // The org-level Super Admin represents the institution itself, not a
  // person other people need to discover or connect with — so it's the
  // one dashboard that skips the profile prompt. Every other role
  // (Space Admin, HOD, lecturer) is a real person and gets one.
  showProfile?: boolean;
}

interface Profile { id: string; name: string; title: string | null; domain: string | null; phone: string | null; linkedin: string | null; }

const NAV_HEIGHT = 62; // approximate rendered height of the bottom bar

export function OperatorShell({ orgName, spaceName, roleBadge, roleColor, nav, activeTab, onTab, onSignOut, children, showProfile = true }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', title: '', domain: '', phone: '', linkedin: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!showProfile) return;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) { setProfileChecked(true); return; }
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle().then(({ data: p }) => {
        setProfile(p);
        if (p) setForm({ name: p.name || '', title: p.title || '', domain: p.domain || '', phone: p.phone || '', linkedin: p.linkedin || '' });
        setProfileChecked(true);
      });
    });
  }, [showProfile]);

  const openEditor = () => {
    if (profile) setForm({ name: profile.name || '', title: profile.title || '', domain: profile.domain || '', phone: profile.phone || '', linkedin: profile.linkedin || '' });
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!userId || !form.name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('profiles').upsert({
      id: userId, name: form.name.trim(), title: form.title || null,
      domain: form.domain || null, phone: form.phone || null, linkedin: form.linkedin || null,
    }).select().single();
    setSaving(false);
    if (error) { window.alert(error.message); return; }
    setProfile(data);
    setEditing(false);
  };

  const initial = profile?.name?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ minHeight: '100vh', background: '#13131F', color: '#F5EFE3', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar — identity/context only, no navigation lives up here anymore */}
      <div style={{ background: '#1C1C2E', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, height: 56, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orgName}</div>
          {spaceName && <div style={{ fontSize: 11, opacity: 0.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spaceName}</div>}
        </div>
        <div style={{ background: roleColor + '22', border: `1px solid ${roleColor}66`, color: roleColor, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {roleBadge}
        </div>
        {showProfile && profileChecked && (
          <button onClick={openEditor} title={profile ? 'Edit my profile' : 'Complete my profile'} style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
            background: profile ? '#3A3A52' : 'transparent',
            border: profile ? 'none' : '1.5px dashed #D4AF37',
            color: profile ? '#F5EFE3' : '#D4AF37',
            fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {profile ? initial : '!'}
          </button>
        )}
        <button onClick={onSignOut} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#888', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
          Sign out
        </button>
      </div>

      {showProfile && profileChecked && !profile && !editing && (
        <div onClick={openEditor} style={{ background: 'rgba(212,175,55,0.12)', borderBottom: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', padding: '9px 20px', fontSize: 12.5, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span>You don't have a profile yet — add your name so people can recognize you.</span>
          <span style={{ fontWeight: 700 }}>Set up →</span>
        </div>
      )}

      {/* Body — bottom padding reserves space so content never sits under the fixed nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', paddingBottom: NAV_HEIGHT + 24, maxWidth: 640, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </div>

      {/* Bottom nav — same fixed, equal-width, icon-over-label pattern as the participant app's BottomNav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1C1C2E',
        borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 50,
      }}>
        {nav.map(item => {
          const active = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => onTab(item.id)} style={{
              flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, padding: '9px 2px', position: 'relative',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              color: active ? '#E26D34' : 'rgba(245,239,227,0.4)',
            }}>
              <span style={{ lineHeight: 1, display: 'flex' }}>{item.icon(active)}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {item.label}
              </span>
              {item.badge != null && item.badge > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: '22%', background: '#E26D34', color: '#fff',
                  borderRadius: 8, fontSize: 9, fontWeight: 700, padding: '1px 5px', minWidth: 14, textAlign: 'center',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Profile editor — same `profiles` table a participant's own profile lives in,
          so an HOD/lecturer set up here is the same identity that can show up in
          People/Network on the participant side, not a separate admin-only record. */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setEditing(false)}>
          <div style={{ background: '#1C1C2E', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{profile ? 'Edit my profile' : 'Set up my profile'}</div>
                <div style={{ fontSize: 12, opacity: 0.5, marginTop: 3 }}>Visible to others in the space, same as any participant's profile</div>
              </div>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', color: 'rgba(245,239,227,0.5)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <label style={fieldLbl}>Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Dr. Amina Wanjiru" style={fieldInp} />
            <label style={fieldLbl}>Title / role</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior Lecturer, Department of Sociology" style={fieldInp} />
            <label style={fieldLbl}>Field / domain</label>
            <input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="e.g. Urban Sociology" style={fieldInp} />
            <label style={fieldLbl}>Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={fieldInp} />
            <label style={fieldLbl}>LinkedIn</label>
            <input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." style={fieldInp} />

            <button onClick={saveProfile} disabled={!form.name.trim() || saving} style={{
              width: '100%', padding: 13, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none',
              fontWeight: 600, fontSize: 14, cursor: !form.name.trim() || saving ? 'default' : 'pointer',
              opacity: !form.name.trim() || saving ? 0.5 : 1, marginTop: 4,
            }}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const fieldLbl: React.CSSProperties = { fontSize: 11, color: 'rgba(245,239,227,0.45)', marginBottom: 4, display: 'block', letterSpacing: 0.5 };
const fieldInp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', marginBottom: 14, borderRadius: 8,
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#F5EFE3', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit',
};

