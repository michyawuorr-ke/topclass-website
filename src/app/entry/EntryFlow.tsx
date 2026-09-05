'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { EntryConfig } from './types';

// ── Design tokens ─────────────────────────────────────────────────────────────
const bg    = '#0F0F18';
const panel = '#17172A';
const accent = '#E26D34';
const gold   = '#D4AF37';
const text   = '#F0EBE1';
const muted  = 'rgba(240,235,225,0.45)';
const border = 'rgba(255,255,255,0.08)';

const fullScreen: React.CSSProperties = {
  minHeight: '100dvh', background: bg, color: text,
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', padding: '32px 20px',
  fontFamily: '"Inter", system-ui, sans-serif',
};

const wrap: React.CSSProperties = { width: '100%', maxWidth: 360 };

const inp: React.CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 12,
  background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`,
  color: text, fontSize: 15, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', marginBottom: 10,
};

const primaryBtn = (disabled = false): React.CSSProperties => ({
  width: '100%', padding: '14px', borderRadius: 12,
  background: disabled ? 'rgba(255,255,255,0.08)' : accent,
  color: disabled ? muted : '#fff',
  border: 'none', fontWeight: 600, fontSize: 15,
  fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer',
  marginBottom: 10, transition: 'background 0.2s',
});

const ghostBtn: React.CSSProperties = {
  width: '100%', padding: '13px', borderRadius: 12,
  background: 'none', border: `1px solid ${border}`,
  color: text, fontWeight: 500, fontSize: 14,
  fontFamily: 'inherit', cursor: 'pointer', marginBottom: 8,
};

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 32 }}>
      <div style={{ height: 2, width: `${(step / total) * 100}%`, background: accent, borderRadius: 2, transition: 'width 0.4s ease' }} />
    </div>
  );
}

type Step = 'auth' | 'verify' | 'profile' | 'done';

interface EntryFlowProps {
  config: EntryConfig;
  spaceId: string;
  onComplete: (profileId: string, profileData: Record<string, string>) => void;
}

export default function EntryFlow({ config, spaceId, onComplete }: EntryFlowProps) {
  const [step, setStep] = useState<Step>('auth');
  const [profileId, setProfileId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile — just name and year
  const [name, setName] = useState('');
  const [year, setYear] = useState('');

  const P = config.primary_color || accent;

  // Restore existing session
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return;
      const uid = data.session.user.id;
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (prof?.name) {
        onComplete(uid, { full_name: prof.name, title: prof.title || '', domain: prof.domain || '' });
      } else {
        setProfileId(uid);
        setStep('profile');
      }
    });
  }, []);

  const goToProfile = (uid: string) => { setProfileId(uid); setStep('profile'); };

  const signInAnon = async () => {
    setLoading(true); setError('');
    const { data, error: e } = await supabase.auth.signInAnonymously();
    setLoading(false);
    if (e || !data.user) { setError('Could not start a session.'); return; }
    goToProfile(data.user.id);
  };

  const sendMagicLink = async () => {
    if (!email.trim()) { setError('Enter your email.'); return; }
    setLoading(true); setError('');
    const { error: e } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setMagicSent(true);
  };

  const sendPhoneOtp = async () => {
    if (!phone.trim()) { setError('Enter your phone number.'); return; }
    setLoading(true); setError('');
    const { error: e } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setStep('verify');
  };

  const verifyOtp = async () => {
    if (!otp.trim()) { setError('Enter the code.'); return; }
    setLoading(true); setError('');
    const { data, error: e } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: otp.trim(), type: 'sms' });
    setLoading(false);
    if (e || !data.user) { setError('Wrong code. Try again.'); return; }
    goToProfile(data.user.id);
  };

  const saveProfile = async () => {
    if (!name.trim()) { setError('Enter your name.'); return; }
    setLoading(true); setError('');
    await supabase.from('profiles').upsert({
      id: profileId,
      name: name.trim(),
      title: year ? `Year ${year} student` : 'Student',
      domain: '',
      role_type: 'student',
    });
    setLoading(false);
    onComplete(profileId, { full_name: name.trim(), title: year ? `Year ${year} student` : 'Student', domain: '' });
  };

  // ── Auth step ──────────────────────────────────────────────────────────────
  if (step === 'auth') {
    const hasMethods = config.auth_methods || [];
    const usePhone = hasMethods.includes('phone_otp');
    const useEmail = hasMethods.includes('email_magic') || hasMethods.includes('institutional');
    const useAnon  = hasMethods.includes('anonymous') || hasMethods.includes('qr_entry');

    return (
      <div style={fullScreen}>
        <div style={wrap}>
          <ProgressBar step={1} total={2} />

          {config.org_logo_url && (
            <img src={config.org_logo_url} alt="" style={{ width: 48, height: 48, borderRadius: 10, marginBottom: 20, objectFit: 'contain' }} />
          )}

          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, lineHeight: 1.2 }}>
            {config.welcome_headline || `Welcome to ${config.space_name || 'this space'}`}
          </div>
          <div style={{ fontSize: 14, color: muted, marginBottom: 32, lineHeight: 1.6 }}>
            {config.welcome_subtext || 'Sign in to see who else is here and what\'s happening.'}
          </div>

          {usePhone && !magicSent && (
            <>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 700 000 000"
                type="tel" style={inp} onKeyDown={e => e.key === 'Enter' && sendPhoneOtp()} />
              <button onClick={sendPhoneOtp} disabled={loading} style={primaryBtn(loading)}>
                {loading ? 'Sending…' : 'Continue with phone'}
              </button>
            </>
          )}

          {useEmail && !magicSent && !usePhone && (
            <>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@students.university.ac.ke"
                type="email" style={inp} onKeyDown={e => e.key === 'Enter' && sendMagicLink()} />
              <button onClick={sendMagicLink} disabled={loading} style={primaryBtn(loading)}>
                {loading ? 'Sending…' : 'Continue with email'}
              </button>
            </>
          )}

          {magicSent && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Check your inbox</div>
              <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>
                We sent a sign-in link to <strong style={{ color: text }}>{email || phone}</strong>. Tap it to continue.
              </div>
            </div>
          )}

          {useAnon && !magicSent && (
            <button onClick={signInAnon} disabled={loading} style={ghostBtn}>
              {loading ? '…' : 'Continue without signing in'}
            </button>
          )}

          {error && <div style={{ color: '#FF6B6B', fontSize: 13, textAlign: 'center', marginTop: 4 }}>{error}</div>}
        </div>
      </div>
    );
  }

  // ── OTP verify step ────────────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <div style={fullScreen}>
        <div style={wrap}>
          <ProgressBar step={1} total={2} />
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Enter the code</div>
          <div style={{ fontSize: 14, color: muted, marginBottom: 28 }}>Sent to {phone}</div>
          <input
            value={otp} onChange={e => setOtp(e.target.value)}
            placeholder="000000" type="number"
            style={{ ...inp, textAlign: 'center', fontSize: 28, letterSpacing: '0.3em', fontWeight: 700 }}
            onKeyDown={e => e.key === 'Enter' && verifyOtp()}
          />
          <button onClick={verifyOtp} disabled={loading} style={primaryBtn(loading)}>
            {loading ? 'Checking…' : 'Verify'}
          </button>
          <button onClick={() => setStep('auth')} style={ghostBtn}>Change number</button>
          {error && <div style={{ color: '#FF6B6B', fontSize: 13, textAlign: 'center' }}>{error}</div>}
        </div>
      </div>
    );
  }

  // ── Profile step — just name + year ────────────────────────────────────────
  if (step === 'profile') {
    const years = ['1st', '2nd', '3rd', '4th', '5th', 'Postgraduate', 'Alumni', 'Staff'];
    return (
      <div style={fullScreen}>
        <div style={wrap}>
          <ProgressBar step={2} total={2} />
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Quick intro</div>
          <div style={{ fontSize: 14, color: muted, marginBottom: 28, lineHeight: 1.6 }}>
            Just enough so others know who you are.
          </div>

          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
            style={inp} autoFocus onKeyDown={e => e.key === 'Enter' && saveProfile()} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {years.map(y => (
              <button key={y} onClick={() => setYear(y === year ? '' : y)} style={{
                padding: '10px 0', borderRadius: 10,
                background: year === y ? `${accent}22` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${year === y ? accent : border}`,
                color: year === y ? accent : muted,
                fontWeight: year === y ? 600 : 400,
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>{y}</button>
            ))}
          </div>

          {error && <div style={{ color: '#FF6B6B', fontSize: 13, marginBottom: 10 }}>{error}</div>}

          <button onClick={saveProfile} disabled={loading || !name.trim()} style={primaryBtn(loading || !name.trim())}>
            {loading ? 'Entering…' : 'Enter space'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
