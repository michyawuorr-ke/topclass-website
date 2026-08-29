import React from 'react';
import { Org, Space, SPACE_TYPES, inputStyle } from '../types';

export function SpacesList({ org, spaces, setActiveSpace, newSpaceName, setNewSpaceName, newSpaceType, setNewSpaceType, createSpace, signOut }: {
  org: Org; spaces: Space[]; setActiveSpace: (s: Space) => void;
  newSpaceName: string; setNewSpaceName: (v: string) => void;
  newSpaceType: string; setNewSpaceType: (v: string) => void;
  createSpace: () => void; signOut: () => void;
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', padding: 20, fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 18 }}>{org.name}</h1>
        <button onClick={signOut} style={{ background: 'none', border: 'none', color: '#E26D34', fontSize: 13 }}>Sign out</button>
      </div>

      {!org.approved && (
        <div style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13 }}>
          Pending approval. Your spaces and content are saved, but participants won't see them until your organization is approved.
        </div>
      )}

      <h2 style={{ fontSize: 14, opacity: 0.6, marginBottom: 10 }}>Your spaces</h2>
      {spaces.length === 0 && <p style={{ opacity: 0.5, marginBottom: 16 }}>No spaces yet — create your first one below.</p>}
      {spaces.map(s => (
        <div key={s.id} onClick={() => setActiveSpace(s)}
          style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10, cursor: 'pointer' }}>
          <div style={{ fontWeight: 600 }}>{s.name}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{s.type} · id: {s.id}</div>
        </div>
      ))}

      <h2 style={{ fontSize: 14, opacity: 0.6, margin: '20px 0 10px' }}>Add a space</h2>
      <input value={newSpaceName} onChange={e => setNewSpaceName(e.target.value)} placeholder="Space name" style={inputStyle} />
      <select value={newSpaceType} onChange={e => setNewSpaceType(e.target.value)} style={inputStyle}>
        {SPACE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <button onClick={createSpace} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Create space</button>
    </div>
  );
}

