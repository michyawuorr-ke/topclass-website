import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const accent = '#E26D34';
const gold = '#D4AF37';
const text = '#F0EBE1';
const muted = 'rgba(240,235,225,0.45)';
const border = 'rgba(255,255,255,0.08)';
const panel = '#17172A';

const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, marginBottom: 10,
  background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`,
  color: text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const lbl: React.CSSProperties = { fontSize: 11, color: muted, marginBottom: 6, display: 'block', letterSpacing: 0.4 };

export function ProfilePanel({
  fullName, setFullName, role, setRole, domain, setDomain,
  capabilities, setCapabilities, standingNeed, setStandingNeed,
  userPhone, setUserPhone, userLinkedin, setUserLinkedin,
  showContactSharing, setShowContactSharing,
  onSave, onClose, onSignOut,
}: {
  fullName: string; setFullName: (v: string) => void;
  role: string; setRole: (v: string) => void;
  domain: string; setDomain: (v: string) => void;
  capabilities: string; setCapabilities: (v: string) => void;
  standingNeed: string; setStandingNeed: (v: string) => void;
  userPhone: string; setUserPhone: (v: string) => void;
  userLinkedin: string; setUserLinkedin: (v: string) => void;
  showContactSharing: boolean; setShowContactSharing: (v: boolean) => void;
  onSave: () => void; onClose: () => void; onSignOut: () => void;
}) {
  const [contactOpen, setContactOpen] = useState(showContactSharing);
  const initials = fullName ? fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex' }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={onClose} />

      {/* Slide-in from left — like LinkedIn */}
      <div style={{
        position: 'relative', background: panel, width: '85%', maxWidth: 360,
        height: '100%', overflowY: 'auto', padding: '0 0 40px',
        fontFamily: '"Inter", system-ui, sans-serif',
        animation: 'slideInLeft 0.25s ease',
      }}>
        {/* Header / banner */}
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: '48px 20px 20px', position: 'relative' }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', color: muted, fontSize: 22, cursor: 'pointer',
          }}>×</button>

          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg,#D4AF37,#E26D34)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 26, color: '#fff', marginBottom: 12,
          }}>{initials}</div>

          <div style={{ fontWeight: 700, fontSize: 20 }}>{fullName || 'Your name'}</div>
          <div style={{ fontSize: 13, color: muted, marginTop: 3 }}>{role || 'Student'} {domain ? `· ${domain}` : ''}</div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          {/* Profile fields */}
          <div style={{ fontSize: 11, color: accent, fontWeight: 700, marginBottom: 14, letterSpacing: 0.5 }}>EDIT PROFILE</div>

          <label style={lbl}>Full name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={inp} />

          <label style={lbl}>Year & course</label>
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. 3rd year, BSc Sociology" style={inp} />

          <label style={lbl}>Department / field</label>
          <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. School of Humanities" style={inp} />

          <label style={lbl}>What you can help with</label>
          <textarea value={capabilities} onChange={e => setCapabilities(e.target.value)}
            placeholder="e.g. statistics, research design, Swahili translation…"
            style={{ ...inp, minHeight: 70, resize: 'none' }} />

          <label style={lbl}>What you're looking for</label>
          <textarea value={standingNeed} onChange={e => setStandingNeed(e.target.value)}
            placeholder="e.g. a study group for SOC 201, internship leads…"
            style={{ ...inp, minHeight: 70, resize: 'none' }} />

          {/* Contact — collapsible */}
          <div onClick={() => setContactOpen(o => !o)} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 0', borderTop: `1px solid ${border}`, cursor: 'pointer', marginTop: 4,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Contact details</div>
              <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>Only shared when you approve a contact request</div>
            </div>
            <span style={{ color: muted, fontSize: 18 }}>{contactOpen ? '−' : '+'}</span>
          </div>
          {contactOpen && (
            <>
              <label style={lbl}>Phone number</label>
              <input value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="+254 7XX XXX XXX" style={inp} />
              <label style={lbl}>LinkedIn profile URL</label>
              <input value={userLinkedin} onChange={e => setUserLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" style={inp} />
            </>
          )}

          {/* Save */}
          <button onClick={onSave} style={{
            width: '100%', padding: '13px', borderRadius: 12,
            background: accent, color: '#fff', border: 'none',
            fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
            marginTop: 16, marginBottom: 10,
          }}>Save profile</button>

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${border}`, margin: '16px 0' }} />

          {/* Sign out */}
          <button onClick={onSignOut} style={{
            width: '100%', padding: '13px', borderRadius: 12,
            background: 'none', border: `1px solid rgba(255,80,80,0.25)`,
            color: '#ff6b6b', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Sign out</button>
        </div>
      </div>

      <style>{`@keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}
