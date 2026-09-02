import React from 'react';

export function Header({ fullName, spaceName, onAvatarClick, onMessagingClick, unreadCount }: {
  fullName: string; spaceName: string; onAvatarClick: () => void;
  onMessagingClick: () => void; unreadCount: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={onAvatarClick}
        style={{ width: 38, height: 38, borderRadius: 19, background: '#D4AF37', color: '#1C1C2E', border: 'none', fontWeight: 700, fontSize: 16, flexShrink: 0, cursor: 'pointer' }}>
        {fullName ? fullName[0].toUpperCase() : '?'}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 0.5 }}>YOU ARE IN</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#F5EFE3' }}>{spaceName || 'this space'}</div>
      </div>

      <button onClick={onMessagingClick} style={{
        position: 'relative', background: 'none', border: 'none',
        color: '#F5EFE3', cursor: 'pointer', padding: 6, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#E26D34', color: '#fff',
            borderRadius: 10, minWidth: 16, height: 16,
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
