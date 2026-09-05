import React from 'react';

const bg = '#0A0A14';
const text = '#F0EBE1';
const border = 'rgba(255,255,255,0.07)';
const accent = '#E26D34';

export function Header({ fullName, spaceName, onAvatarClick, onMessagingClick, unreadCount }: {
  fullName: string; spaceName: string; onAvatarClick: () => void;
  onMessagingClick: () => void; unreadCount: number;
}) {
  const initials = fullName
    ? fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30, background: bg,
      borderBottom: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      {/* Avatar — top left like LinkedIn */}
      <button onClick={onAvatarClick} style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #D4AF37 0%, #E26D34 100%)',
        border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
        cursor: 'pointer', letterSpacing: 0.5, fontFamily: 'inherit',
      }}>
        {initials}
      </button>

      {/* Space name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {spaceName || 'Toruok'}
        </div>
      </div>

      {/* Notifications bell */}
      <button style={{ background: 'none', border: 'none', color: 'rgba(240,235,225,0.5)', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </button>

      {/* Messaging — top right like LinkedIn */}
      <button onClick={onMessagingClick} style={{
        position: 'relative', background: 'none', border: 'none',
        color: text, cursor: 'pointer', padding: 6, borderRadius: 8,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: accent, color: '#fff', borderRadius: 10,
            minWidth: 16, height: 16, fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
