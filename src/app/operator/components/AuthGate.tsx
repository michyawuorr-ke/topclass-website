import React from 'react';
import { inputStyle } from '../types';

export function AuthGate({ email, setEmail, magicLinkSent, sendMagicLink }: {
  email: string; setEmail: (v: string) => void; magicLinkSent: boolean; sendMagicLink: () => void;
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Toruok Space — Operator</h1>
      <p style={{ opacity: 0.7, marginBottom: 20, textAlign: 'center', maxWidth: 320 }}>Sign in with your email to manage your space.</p>
      {magicLinkSent ? (
        <p>Check your email for a sign-in link.</p>
      ) : (
        <>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@organization.com" style={{ ...inputStyle, maxWidth: 320 }} />
          <button onClick={sendMagicLink} style={{ padding: '12px 24px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>
            Send sign-in link
          </button>
        </>
      )}
    </div>
  );
}

