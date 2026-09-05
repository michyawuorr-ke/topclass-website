import React from 'react';
import { NavTab } from '../types';

const bg = '#0F0F18';
const accent = '#E26D34';
const muted = 'rgba(240,235,225,0.35)';
const border = 'rgba(255,255,255,0.06)';

const tabs: { id: NavTab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: 'discover',
    label: 'Discover',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? accent : 'none'} stroke={a ? accent : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    id: 'connections',
    label: 'Network',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? accent : 'none'} stroke={a ? accent : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'journey',
    label: 'Journey',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? accent : 'none'} stroke={a ? accent : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

export function BottomNav({ activeNav, setActiveNav }: { activeNav: NavTab; setActiveNav: (t: NavTab) => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: bg, borderTop: `1px solid ${border}`,
      display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(t => {
        const active = activeNav === t.id;
        return (
          <button key={t.id} onClick={() => setActiveNav(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3, padding: '10px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            color: active ? accent : muted,
          }}>
            {t.icon(active)}
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, fontFamily: 'inherit' }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
