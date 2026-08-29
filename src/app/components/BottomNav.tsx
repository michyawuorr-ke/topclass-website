import React from 'react';
import { NavTab } from '../types';

export function BottomNav({ activeNav, setActiveNav }: { activeNav: NavTab; setActiveNav: (t: NavTab) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', background: '#15151F', padding: '10px 0' }}>
      {(['discover', 'connections', 'journey'] as NavTab[]).map(tab => (
        <button key={tab} onClick={() => setActiveNav(tab)}
          style={{ flex: 1, background: 'none', border: 'none', color: activeNav === tab ? '#E26D34' : '#888', fontWeight: activeNav === tab ? 700 : 400 }}>
          {tab === 'discover' ? 'Discover' : tab === 'connections' ? 'Connections' : 'My Journey'}
        </button>
      ))}
    </div>
  );
}

