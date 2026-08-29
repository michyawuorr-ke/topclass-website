import React from 'react';

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
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 40 }}>
      <div style={{ background: '#1C1C2E', width: '100%', maxHeight: '85vh', overflowY: 'auto', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 }}>
        <h3 style={{ marginBottom: 4 }}>Profile</h3>
        <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 16 }}>Just enough for people and matches to recognize you — not a full résumé.</p>

        <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 6 }}>IDENTITY</div>
        <input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
        <input placeholder="Role (e.g. Product Designer, Final-year student)" value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
        <input placeholder="Domain / field" value={domain} onChange={e => setDomain(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 8, border: 'none' }} />

        <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 6 }}>CAPABILITIES</div>
        <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>What can you generally help with, across any space?</p>
        <textarea placeholder="e.g. UX feedback, fundraising advice, tutoring in statistics"
          value={capabilities} onChange={e => setCapabilities(e.target.value)}
          style={{ width: '100%', minHeight: 60, padding: 10, marginBottom: 16, borderRadius: 8, border: 'none', fontFamily: 'inherit' }} />

        <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 6 }}>STANDING INTEREST</div>
        <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>What are you generally looking for, wherever you go?</p>
        <textarea placeholder="e.g. a technical co-founder, mentorship in public speaking"
          value={standingNeed} onChange={e => setStandingNeed(e.target.value)}
          style={{ width: '100%', minHeight: 60, padding: 10, marginBottom: 16, borderRadius: 8, border: 'none', fontFamily: 'inherit' }} />

        <div onClick={() => setShowContactSharing(!showContactSharing)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1 }}>CONTACT & SHARING</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>Only shared with someone once you approve their request</div>
          </div>
          <span style={{ opacity: 0.6 }}>{showContactSharing ? '▲' : '▼'}</span>
        </div>
        {showContactSharing && (
          <div style={{ marginTop: 10 }}>
            <input placeholder="Phone" value={userPhone} onChange={e => setUserPhone(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
            <input placeholder="LinkedIn" value={userLinkedin} onChange={e => setUserLinkedin(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onSave} style={{ flex: 1, padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Save</button>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3', border: 'none' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

