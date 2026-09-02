import React from 'react';
import { inputStyle } from '../types';

export function AuthGate({ email, setEmail, magicLinkSent, sendMagicLink, signInWithGoogle }: {
  email: string; setEmail: (v: string) => void; magicLinkSent: boolean; sendMagicLink: () => void; signInWithGoogle: () => void;
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Toruok Space — Operator</h1>
      <p style={{ opacity: 0.7, marginBottom: 20, textAlign: 'center', maxWidth: 320 }}>Sign in to manage your space.</p>
      {magicLinkSent ? (
        <p>Check your email for a sign-in link.</p>
      ) : (
        <>
          <button onClick={signInWithGoogle} style={{ width: '100%', maxWidth: 320, padding: 12, borderRadius: 8, background: '#F5EFE3', color: '#1C1C2E', border: 'none', fontWeight: 600, marginBottom: 16 }}>
            Continue with Google
          </button>
          <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 16 }}>
            If your organization set an institutional domain, signing in with your Google Workspace account there is what unlocks any space admin or zone publisher access invited to that address.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 320, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 11, opacity: 0.5 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
          </div>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@organization.com" style={{ ...inputStyle, maxWidth: 320 }} />
          <button onClick={sendMagicLink} style={{ padding: '12px 24px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>
            Send sign-in link
          </button>
        </>
      )}
    </div>
  );
}
