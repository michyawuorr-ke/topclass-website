'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { EntryConfig, AuthMethod, ProfileFieldConfig, PresenceFieldConfig } from './types';

// ── Styles ────────────────────────────────────────────────────────────────────
const screen = (bg: string): React.CSSProperties => ({
  minHeight: '100vh',
  background: bg,
  color: '#F5EFE3',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  fontFamily: 'sans-serif',
});

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 380,
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

const inputSt = (primary: string): React.CSSProperties => ({
  width: '100%',
  padding: '12px 14px',
  marginBottom: 10,
  borderRadius: 10,
  border: `1.5px solid rgba(255,255,255,0.12)`,
  background: 'rgba(255,255,255,0.07)',
  color: '#F5EFE3',
  fontFamily: 'inherit',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
});

const selectSt = (primary: string): React.CSSProperties => ({
  ...inputSt(primary),
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
});

const labelSt: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.55,
  marginBottom: 4,
  display: 'block',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const helpSt: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.45,
  marginTop: -6,
  marginBottom: 10,
};

const btn = (primary: string, outline = false): React.CSSProperties => ({
  width: '100%',
  padding: '13px 0',
  borderRadius: 10,
  border: outline ? `1.5px solid ${primary}` : 'none',
  background: outline ? 'transparent' : primary,
  color: outline ? primary : '#fff',
  fontFamily: 'inherit',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 4,
});

const stepDots = (total: number, current: number, primary: string) => (
  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        width: i === current ? 20 : 7,
        height: 7,
        borderRadius: 4,
        background: i === current ? primary : 'rgba(255,255,255,0.2)',
        transition: 'all 0.3s',
      }} />
    ))}
  </div>
);

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 'auth' | 'verify' | 'role' | 'profile' | 'presence' | 'done';

interface EntryFlowProps {
  config: EntryConfig;
  spaceId: string;
  onComplete: (profileId: string, profileData: Record<string, string>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EntryFlow({ config, spaceId, onComplete }: EntryFlowProps) {
  const [step, setStep] = useState<Step>('auth');
  const [authMethod, setAuthMethod] = useState<AuthMethod>(config.auth_methods[0]);
  const [profileId, setProfileId] = useState('');

  // Auth state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Role
  const [selectedRole, setSelectedRole] = useState('');

  // Profile fields — keyed by ProfileFieldKey
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});

  // Presence fields
  const [presenceValues, setPresenceValues] = useState<Record<string, string>>({});

  const P = config.primary_color;
  const BG = config.background_color;

  // ── Restore existing session on mount ────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const uid = session.user.id;
        setProfileId(uid);
        // Check if they already have a profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single();
        if (prof?.name) {
          // Returning user — hydrate and skip straight to done
          const vals: Record<string, string> = {
            full_name: prof.name || '',
            title: prof.title || '',
            domain: prof.domain || '',
            capabilities: prof.capabilities || '',
            standing_need: prof.standing_need || '',
            phone: prof.phone || '',
            linkedin: prof.linkedin || '',
          };
          setProfileValues(vals);
          onComplete(uid, vals);
        } else {
          // Session exists but no profile yet
          goToFirstStep(uid);
        }
      }
    };
    restore();
  }, []);

  const goToFirstStep = (uid: string) => {
    setProfileId(uid);
    const selfSelectableRoles = config.roles.filter(r => r.is_self_selectable);
    if (selfSelectableRoles.length > 1) {
      setStep('role');
    } else {
      if (selfSelectableRoles.length === 1) setSelectedRole(selfSelectableRoles[0].key);
      setStep('profile');
    }
  };

  // ── AUTH HANDLERS ─────────────────────────────────────────────────────────

  const handleAnonymous = async () => {
    setLoading(true);
    setAuthError('');
    const { data, error } = await supabase.auth.signInAnonymously();
    setLoading(false);
    if (error || !data.user) { setAuthError('Could not start a session. Check your connection.'); return; }
    goToFirstStep(data.user.id);
  };

  const handleMagicLink = async () => {
    if (!email.trim()) { setAuthError('Enter your email address.'); return; }
    setLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (error) { setAuthError(error.message); return; }
    setMagicSent(true);
  };

  const handlePhoneOtp = async () => {
    if (!phone.trim()) { setAuthError('Enter your phone number.'); return; }
    setLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    setLoading(false);
    if (error) { setAuthError(error.message); return; }
    setOtpSent(true);
    setStep('verify');
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setAuthError('Enter the code from your SMS.'); return; }
    setLoading(true);
    setAuthError('');
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: otp.trim(),
      type: 'sms',
    });
    setLoading(false);
    if (error || !data.user) { setAuthError('Invalid code. Try again.'); return; }
    goToFirstStep(data.user.id);
  };

  const handleInstitutional = async () => {
    if (!email.trim()) { setAuthError('Enter your institutional email.'); return; }
    // Validate domain if org has one set
    // For now send magic link — institutional domain validation
    // can be added when operator configures allowed_domains
    setLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (error) { setAuthError(error.message); return; }
    setMagicSent(true);
  };

  const handleInviteCode = async () => {
    if (!inviteCode.trim()) { setAuthError('Enter your invite code.'); return; }
    setLoading(true);
    setAuthError('');
    // Look up the invite code in spaces or a future invite_codes table
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode.trim().toUpperCase())
      .eq('space_id', spaceId)
      .single();
    setLoading(false);
    if (error || !data) { setAuthError('Code not recognised. Check and try again.'); return; }
    // Valid code — sign in anonymously then mark them as invite-verified
    const { data: anonData } = await supabase.auth.signInAnonymously();
    if (anonData.user) goToFirstStep(anonData.user.id);
  };

  const handleQrEntry = async () => {
    // QR entry: the space URL already contained the spaceId
    // Just create an anonymous session
    await handleAnonymous();
  };

  // ── PROFILE SAVE ─────────────────────────────────────────────────────────
  const saveProfile = async () => {
    // Validate required fields
    const missing = config.profile_fields
      .filter(f => f.required && !profileValues[f.key]?.trim())
      .map(f => f.label);
    if (missing.length > 0) {
      setAuthError(`Please fill in: ${missing.join(', ')}`);
      return;
    }
    setLoading(true);
    setAuthError('');

    await supabase.from('profiles').upsert({
      id: profileId,
      name: profileValues['full_name'] || '',
      title: profileValues['title'] || '',
      domain: profileValues['domain'] || '',
      capabilities: profileValues['capabilities'] || '',
      standing_need: profileValues['standing_need'] || '',
      phone: profileValues['phone'] || '',
      linkedin: profileValues['linkedin'] || '',
      // Store remaining custom fields as JSON in a metadata column
      metadata: JSON.stringify(
        Object.fromEntries(
          Object.entries(profileValues).filter(([k]) =>
            !['full_name','title','domain','capabilities','standing_need','phone','linkedin'].includes(k)
          )
        )
      ),
      role_type: selectedRole || config.roles[0]?.key || 'member',
    });

    setLoading(false);

    if (config.presence_enabled && config.presence_fields.length > 0) {
      setStep('presence');
    } else {
      onComplete(profileId, profileValues);
    }
  };

  // ── PRESENCE SAVE ─────────────────────────────────────────────────────────
  const savePresence = async () => {
    const requiredMissing = config.presence_fields
      .filter(f => f.required && !presenceValues[f.key]?.trim())
      .map(f => f.label);
    if (requiredMissing.length > 0) {
      setAuthError(`Please fill in: ${requiredMissing.join(', ')}`);
      return;
    }
    setLoading(true);
    await supabase.from('presence').upsert({
      id: profileId,
      profile_id: profileId,
      space_id: spaceId,
      need: presenceValues['need'] || '',
      offer: presenceValues['offer'] || '',
      station: presenceValues['station'] || presenceValues['session_goal'] || '',
      intent: presenceValues['intent'] || presenceValues['availability'] || '',
      last_seen: new Date().toISOString(),
    });
    setLoading(false);
    onComplete(profileId, { ...profileValues, ...presenceValues });
  };

  const skipPresence = () => {
    onComplete(profileId, profileValues);
  };

  // ── RENDER FIELD ─────────────────────────────────────────────────────────
  const renderField = (
    field: ProfileFieldConfig | PresenceFieldConfig,
    values: Record<string, string>,
    setter: (v: Record<string, string>) => void
  ) => {
    const pf = field as ProfileFieldConfig;
    const val = values[field.key] || '';
    const onChange = (v: string) => setter({ ...values, [field.key]: v });

    return (
      <div key={field.key}>
        <label style={labelSt}>{field.label}{(pf.required) ? ' *' : ''}</label>
        {pf.input_type === 'select' && pf.options ? (
          <select
            value={val}
            onChange={e => onChange(e.target.value)}
            style={selectSt(P)}
          >
            <option value="">Select…</option>
            {pf.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={pf.input_type || 'text'}
            value={val}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            style={inputSt(P)}
          />
        )}
        {field.help_text && <div style={helpSt}>{field.help_text}</div>}
      </div>
    );
  };

  // ── METHOD LABEL MAP ─────────────────────────────────────────────────────
  const methodLabel: Record<AuthMethod, string> = {
    anonymous:     'Continue without signing in',
    email_magic:   'Sign in with email',
    phone_otp:     'Sign in with phone',
    institutional: 'Sign in with institutional email',
    invite_code:   'Enter invite code',
    qr_entry:      'Continue',
  };

  // ── TOTAL STEPS (for dots) ────────────────────────────────────────────────
  const totalSteps = (() => {
    let n = 1; // auth
    if (config.roles.filter(r => r.is_self_selectable).length > 1) n++;
    n++; // profile
    if (config.presence_enabled && config.presence_fields.length > 0) n++;
    return n;
  })();

  const stepIndex: Record<Step, number> = {
    auth: 0,
    verify: 0,
    role: 1,
    profile: config.roles.filter(r => r.is_self_selectable).length > 1 ? 2 : 1,
    presence: totalSteps - 1,
    done: totalSteps,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: AUTH
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'auth') {
    const selfMethods = config.auth_methods;

    return (
      <div style={screen(BG)}>
        <div style={card}>
          {stepDots(totalSteps, 0, P)}

          {config.org_logo_url && (
            <img src={config.org_logo_url} alt={config.org_name}
              style={{ width: 56, height: 56, borderRadius: 12, marginBottom: 16, alignSelf: 'center', objectFit: 'contain' }} />
          )}

          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
            {config.welcome_headline || 'Welcome'}
          </h1>
          <p style={{ fontSize: 14, opacity: 0.6, textAlign: 'center', marginBottom: 32, lineHeight: 1.5 }}>
            {config.welcome_subtext}
          </p>

          {/* Primary method */}
          {selfMethods[0] === 'anonymous' || selfMethods[0] === 'qr_entry' ? (
            <button onClick={selfMethods[0] === 'qr_entry' ? handleQrEntry : handleAnonymous}
              disabled={loading} style={btn(P)}>
              {loading ? 'Starting…' : methodLabel[selfMethods[0]]}
            </button>
          ) : selfMethods[0] === 'phone_otp' ? (
            <>
              <label style={labelSt}>Phone number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+254 700 000 000" style={inputSt(P)}
                onKeyDown={e => e.key === 'Enter' && handlePhoneOtp()} />
              <button onClick={handlePhoneOtp} disabled={loading} style={btn(P)}>
                {loading ? 'Sending…' : 'Send verification code'}
              </button>
            </>
          ) : selfMethods[0] === 'email_magic' || selfMethods[0] === 'institutional' ? (
            magicSent ? (
              <div style={{ textAlign: 'center', lineHeight: 1.6, opacity: 0.8 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
                <p>Check your email for a sign-in link. You can close this tab and open the link from your email.</p>
              </div>
            ) : (
              <>
                <label style={labelSt}>
                  {selfMethods[0] === 'institutional' ? 'Institutional email' : 'Email address'}
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={selfMethods[0] === 'institutional' ? 'you@students.uonbi.ac.ke' : 'you@example.com'}
                  style={inputSt(P)}
                  onKeyDown={e => e.key === 'Enter' && (selfMethods[0] === 'institutional' ? handleInstitutional() : handleMagicLink())} />
                <button
                  onClick={selfMethods[0] === 'institutional' ? handleInstitutional : handleMagicLink}
                  disabled={loading} style={btn(P)}>
                  {loading ? 'Sending…' : 'Send sign-in link'}
                </button>
              </>
            )
          ) : selfMethods[0] === 'invite_code' ? (
            <>
              <label style={labelSt}>Invite code</label>
              <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                placeholder="e.g. SPARK24" style={inputSt(P)}
                onKeyDown={e => e.key === 'Enter' && handleInviteCode()} />
              <button onClick={handleInviteCode} disabled={loading} style={btn(P)}>
                {loading ? 'Checking…' : 'Continue'}
              </button>
            </>
          ) : null}

          {/* Secondary methods */}
          {selfMethods.slice(1).map(method => (
            <button key={method}
              onClick={() => {
                setAuthMethod(method);
                if (method === 'anonymous') handleAnonymous();
              }}
              style={{ ...btn(P, true), marginTop: 10, fontSize: 13 }}>
              {methodLabel[method]}
            </button>
          ))}

          {authError && (
            <div style={{ marginTop: 12, color: '#FF6B6B', fontSize: 13, textAlign: 'center' }}>
              {authError}
            </div>
          )}

          {config.allow_anonymous_browse && (
            <button onClick={skipPresence}
              style={{ background: 'none', border: 'none', color: P, cursor: 'pointer', marginTop: 16, fontSize: 13, textDecoration: 'underline', alignSelf: 'center' }}>
              Browse without signing in
            </button>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: VERIFY OTP
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'verify') {
    return (
      <div style={screen(BG)}>
        <div style={card}>
          {stepDots(totalSteps, 0, P)}
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Check your messages</h2>
          <p style={{ fontSize: 14, opacity: 0.6, textAlign: 'center', marginBottom: 28 }}>
            We sent a 6-digit code to <strong>{phone}</strong>
          </p>
          <label style={labelSt}>Verification code</label>
          <input type="number" value={otp} onChange={e => setOtp(e.target.value)}
            placeholder="000000" style={{ ...inputSt(P), letterSpacing: '0.3em', fontSize: 22, textAlign: 'center' }}
            onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} />
          <button onClick={handleVerifyOtp} disabled={loading} style={btn(P)}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button onClick={() => { setStep('auth'); setOtpSent(false); setOtp(''); }}
            style={{ ...btn(P, true), marginTop: 10, fontSize: 13 }}>
            Change number
          </button>
          {authError && <div style={{ marginTop: 12, color: '#FF6B6B', fontSize: 13, textAlign: 'center' }}>{authError}</div>}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: ROLE SELECTION
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'role') {
    const selfSelectableRoles = config.roles.filter(r => r.is_self_selectable);
    return (
      <div style={screen(BG)}>
        <div style={card}>
          {stepDots(totalSteps, stepIndex.role, P)}
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Who are you here as?</h2>
          <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 24 }}>
            This helps us show you the most relevant people and opportunities.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selfSelectableRoles.map(role => (
              <button key={role.key}
                onClick={() => { setSelectedRole(role.key); setStep('profile'); }}
                style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  border: `1.5px solid ${selectedRole === role.key ? P : 'rgba(255,255,255,0.15)'}`,
                  background: selectedRole === role.key ? `${P}22` : 'rgba(255,255,255,0.05)',
                  color: '#F5EFE3',
                  fontFamily: 'inherit',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}>
                <span>{role.label}</span>
                {role.description && <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.55 }}>{role.description}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: PROFILE
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'profile') {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: '#F5EFE3', fontFamily: 'sans-serif', padding: '24px 24px 80px' }}>
        <div style={{ maxWidth: 380, margin: '0 auto' }}>
          {stepDots(totalSteps, stepIndex.profile, P)}

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {config.profile_step_label}
          </h2>
          <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
            Fields marked * are required.
          </p>

          {config.profile_fields.map(field =>
            renderField(field, profileValues, setProfileValues)
          )}

          {authError && <div style={{ marginBottom: 12, color: '#FF6B6B', fontSize: 13 }}>{authError}</div>}

          <button onClick={saveProfile} disabled={loading} style={btn(P)}>
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: PRESENCE / INTENT
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'presence') {
    return (
      <div style={screen(BG)}>
        <div style={card}>
          {stepDots(totalSteps, stepIndex.presence, P)}

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {config.presence_step_label}
          </h2>
          <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
            This is visible to others in the space while you are here.{' '}
            {config.allow_presence_opt_out && 'You can skip this to stay invisible.'}
          </p>

          {config.presence_fields.map(field =>
            renderField(
              field as any,
              presenceValues,
              setPresenceValues
            )
          )}

          {authError && <div style={{ marginBottom: 12, color: '#FF6B6B', fontSize: 13 }}>{authError}</div>}

          <button onClick={savePresence} disabled={loading} style={btn(P)}>
            {loading ? 'Entering…' : 'Enter the space'}
          </button>

          {config.allow_presence_opt_out && (
            <button onClick={skipPresence}
              style={{ background: 'none', border: 'none', color: P, cursor: 'pointer', marginTop: 14, fontSize: 13, textDecoration: 'underline', alignSelf: 'center', display: 'block', width: '100%', textAlign: 'center' }}>
              Enter without being visible
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
