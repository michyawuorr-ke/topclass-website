import React from 'react';

interface NavItem { id: string; label: string; icon: (active: boolean) => React.ReactNode; badge?: number; }

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

const NAV_HEIGHT = 62; // approximate rendered height of the bottom bar

export function OperatorShell({ orgName, spaceName, roleBadge, roleColor, nav, activeTab, onTab, onSignOut, children }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#13131F', color: '#F5EFE3', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar — identity/context only, no navigation lives up here anymore */}
      <div style={{ background: '#1C1C2E', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, height: 56, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orgName}</div>
          {spaceName && <div style={{ fontSize: 11, opacity: 0.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spaceName}</div>}
        </div>
        <div style={{ background: roleColor + '22', border: `1px solid ${roleColor}66`, color: roleColor, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {roleBadge}
        </div>
        <button onClick={onSignOut} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#888', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
          Sign out
        </button>
      </div>

      {/* Body — bottom padding reserves space so content never sits under the fixed nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', paddingBottom: NAV_HEIGHT + 24, maxWidth: 640, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </div>

      {/* Bottom nav — same fixed, equal-width, icon-over-label pattern as the participant app's BottomNav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1C1C2E',
        borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 50,
      }}>
        {nav.map(item => {
          const active = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => onTab(item.id)} style={{
              flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, padding: '9px 2px', position: 'relative',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              color: active ? '#E26D34' : 'rgba(245,239,227,0.4)',
            }}>
              <span style={{ lineHeight: 1, display: 'flex' }}>{item.icon(active)}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {item.label}
              </span>
              {item.badge != null && item.badge > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: '22%', background: '#E26D34', color: '#fff',
                  borderRadius: 8, fontSize: 9, fontWeight: 700, padding: '1px 5px', minWidth: 14, textAlign: 'center',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

