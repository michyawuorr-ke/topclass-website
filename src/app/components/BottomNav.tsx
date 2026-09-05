import React from 'react';
import { NavTab } from '../types';

const bg = '#0A0A14';
const accent = '#E26D34';
const muted = 'rgba(240,235,225,0.35)';
const border = 'rgba(255,255,255,0.06)';

const tabs: { id: NavTab; label: string; icon: (a: boolean) => React.ReactNode }[] = [
  {
    id: 'home', label: 'Home',
    icon: a => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? accent : 'none'} stroke={a ? accent : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'campus', label: 'Campus',
    icon: a => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? accent : 'none'} stroke={a ? accent : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    id: 'learn', label: 'Learn',
    icon: a => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? accent : 'none'} stroke={a ? accent : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    id: 'network', label: 'Network',
    icon: a => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? accent : 'none'} stroke={a ? accent : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

export function BottomNav({ activeNav, setActiveNav }: { activeNav: NavTab; setActiveNav: (t: NavTab) => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, background: bg,
      borderTop: `1px solid ${border}`, display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(t => {
        const active = activeNav === t.id;
        return (
          <button key={t.id} onClick={() => setActiveNav(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3, padding: '10px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            color: active ? accent : muted, fontFamily: 'inherit',
          }}>
            {t.icon(active)}
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
