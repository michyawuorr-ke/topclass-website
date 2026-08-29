import React from 'react';

export function SpaceGate({ spaceInput, setSpaceInput, confirmSpaceCode }: {
  spaceInput: string; setSpaceInput: (v: string) => void; confirmSpaceCode: () => void;
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Toruok Space</h1>
      <p style={{ opacity: 0.7, marginBottom: 20, textAlign: 'center' }}>Enter or scan the space code for where you are</p>
      <input value={spaceInput} onChange={e => setSpaceInput(e.target.value)} placeholder="Space ID"
        style={{ padding: 12, borderRadius: 8, width: '100%', maxWidth: 320, marginBottom: 12, border: 'none' }} />
      <button onClick={confirmSpaceCode} style={{ padding: '12px 24px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>
        Enter Space
      </button>
    </div>
  );
}

