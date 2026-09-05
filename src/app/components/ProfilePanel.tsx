import React, { useState } from 'react';

const bg = '#17172A';
const accent = '#E26D34';
const gold = '#D4AF37';
const text = '#F0EBE1';
const muted = 'rgba(240,235,225,0.45)';
const border = 'rgba(255,255,255,0.08)';

const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, marginBottom: 10,
  background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`,
  color: text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

export function ProfilePanel({
  fullName, setFullName, role, setRole, domain, setDomain,
  capabilities, setCapabilities, standingNeed, setStandingNeed,
  userPhone, setUserPhone, userLinkedin, setUserLinkedin,
  showContactSharing, setShowContactSharing, onSave, onClose,
}: {
  fullName: string; setFullName: (v: string) => void;
  role: string; setRole: (v: string) => void;
  domain: string; setDomain: (v: string) => void;
  capabilities: string; setCapabilities: (v: string) => void;
  standingNeed: string; setStandingNeed: (v: string) => void;
  userPhone: string; setUserPhone: (v: string) => void;
  userLinkedin: string; setUserLinkedin: (v: string) => void;
  showContactSharing: boolean; setShowContactSharing: (v: boolean) => void;
  onSave: () => void; onClose: () => void;
}) {
  const initials = fullName ? fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 40, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}>
      <div style={{
        background: bg, width: '100%', maxHeight: '90dvh', overflowY: 'auto',
        borderRadius: '20px 20px 0 0', padding: '24px 20px 40px',
        fontFamily: '"Inter", system-ui, sans-serif',
      }} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 24px' }} />

        {/* Avatar + name preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4AF37, #E26D34)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 20, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{fullName || 'Your name'}</div>
            <div style={{ fontSize: 13, color: muted, marginTop: 2 }}>{role || 'Student'}</div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ fontSize: 11, color: muted, marginBottom: 8, letterSpacing: 0.5 }}>Name</div>
        <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" style={inp} />

        <div style={{ fontSize: 11, color: muted, marginBottom: 8, letterSpacing: 0.5 }}>Year / role</div>
        <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. 3rd year, Sociology" style={inp} />

        <div style={{ fontSize: 11, color: muted, marginBottom: 8, letterSpacing: 0.5 }}>Field / department</div>
        <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. Sociology, Computer Science" style={inp} />

        <div style={{ fontSize: 11, color: muted, marginBottom: 8, letterSpacing: 0.5 }}>What you can help with</div>
        <textarea value={capabilities} onChange={e => setCapabilities(e.target.value)}
          placeholder="e.g. research methods, coding, essay editing…"
          style={{ ...inp, minHeight: 60, resize: 'none' }} />

        <div style={{ fontSize: 11, color: muted, marginBottom: 8, letterSpacing: 0.5 }}>What you're looking for</div>
        <textarea value={standingNeed} onChange={e => setStandingNeed(e.target.value)}
          placeholder="e.g. a study group, internship leads, mentorship…"
          style={{ ...inp, minHeight: 60, resize: 'none' }} />

        {/* Contact — collapsed by default */}
        <div onClick={() => setShowContactSharing(!showContactSharing)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${border}`, cursor: 'pointer', marginTop: 4 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Contact details</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>Only shared when you approve a request</div>
          </div>
          <span style={{ color: muted, fontSize: 16 }}>{showContactSharing ? '−' : '+'}</span>
        </div>
        {showContactSharing && (
          <>
            <input value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="Phone number" style={inp} />
            <input value={userLinkedin} onChange={e => setUserLinkedin(e.target.value)} placeholder="LinkedIn URL" style={inp} />
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onSave} style={{
            flex: 1, padding: '13px', borderRadius: 12,
            background: accent, color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}>Save</button>
          <button onClick={onClose} style={{
            flex: 1, padding: '13px', borderRadius: 12,
            background: 'rgba(255,255,255,0.07)', color: text, border: 'none', fontSize: 15, cursor: 'pointer',
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
