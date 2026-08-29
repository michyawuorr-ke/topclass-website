import React from 'react';

export function Header({ fullName, spaceName, onAvatarClick }: {
  fullName: string; spaceName: string; onAvatarClick: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
      <button onClick={onAvatarClick}
        style={{ width: 40, height: 40, borderRadius: 20, background: '#D4AF37', color: '#1C1C2E', border: 'none', fontWeight: 700, flexShrink: 0 }}>
        {fullName ? fullName[0].toUpperCase() : '?'}
      </button>
      <div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>You are in</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{spaceName || 'this space'}</div>
      </div>
    </div>
  );
}

