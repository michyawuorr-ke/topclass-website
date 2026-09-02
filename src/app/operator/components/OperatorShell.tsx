import React from 'react';

interface NavItem { id: string; label: string; icon: string; badge?: number; }

interface Props {
  orgName: string;
  spaceName?: string;
  roleBadge: string;
  roleColor: string;
  nav: NavItem[];
  activeTab: string;
  onTab: (id: string) => void;
  onSignOut: () => void;
  children: React.ReactNode;
}

export function OperatorShell({ orgName, spaceName, roleBadge, roleColor, nav, activeTab, onTab, onSignOut, children }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#13131F', color: '#F5EFE3', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: '#1C1C2E', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, height: 56, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{orgName}</div>
          {spaceName && <div style={{ fontSize: 11, opacity: 0.45 }}>{spaceName}</div>}
        </div>
        <div style={{ background: roleColor + '22', border: `1px solid ${roleColor}66`, color: roleColor, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
          {roleBadge}
        </div>
        <button onClick={onSignOut} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#888', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>
          Sign out
        </button>
      </div>

      {/* Nav tabs */}
      <div style={{ background: '#1C1C2E', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 16px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => onTab(item.id)} style={{
            padding: '13px 14px', border: 'none', background: 'none', cursor: 'pointer',
            color: activeTab === item.id ? '#F5EFE3' : 'rgba(245,239,227,0.45)',
            borderBottom: activeTab === item.id ? '2px solid #E26D34' : '2px solid transparent',
            fontSize: 13, fontWeight: activeTab === item.id ? 600 : 400,
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'color 0.15s',
          }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
            {item.badge != null && item.badge > 0 && (
              <span style={{ background: '#E26D34', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 16, textAlign: 'center' }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', maxWidth: 640, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </div>
    </div>
  );
}
