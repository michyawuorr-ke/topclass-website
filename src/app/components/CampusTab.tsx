import React, { useState } from 'react';
import { Presence } from '../types';

const accent = '#E26D34';
const gold = '#D4AF37';
const teal = '#1D9E75';
const text = '#F0EBE1';
const muted = 'rgba(240,235,225,0.45)';
const border = 'rgba(255,255,255,0.08)';
const card = 'rgba(255,255,255,0.04)';

function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const i = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#D4AF37,#E26D34)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.33, color: '#fff',
    }}>{i}</div>
  );
}

export function CampusTab({
  presentPeople, profileId, throttled, triggerHandshake,
  visibilityMode, onChangeVisibility,
}: {
  presentPeople: Presence[]; profileId: string;
  throttled: Record<string, boolean>; triggerHandshake: (p: Presence) => void;
  visibilityMode: 'off' | 'department' | 'institution';
  onChangeVisibility: (m: 'off' | 'department' | 'institution') => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'department' | 'year' | 'skill'>('all');

  const others = presentPeople.filter(p =>
    p.profile_id !== profileId &&
    (!search.trim() || [p.profiles?.name, p.profiles?.domain, p.profiles?.title].some(f => f?.toLowerCase().includes(search.toLowerCase())))
  );

  const modes: { id: 'off' | 'department' | 'institution'; label: string; desc: string; color: string }[] = [
    { id: 'off', label: 'Hidden', desc: 'Not visible to anyone', color: muted },
    { id: 'department', label: 'Department', desc: 'Visible to your dept', color: gold },
    { id: 'institution', label: 'Campus-wide', desc: 'Visible to whole campus', color: teal },
  ];

  return (
    <div style={{ padding: '0 16px 16px', fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* Visibility toggle */}
      <div style={{ padding: '16px 0 12px' }}>
        <div style={{ fontSize: 13, color: muted, marginBottom: 10 }}>Your visibility</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {modes.map(m => (
            <button key={m.id} onClick={() => onChangeVisibility(m.id)} style={{
              flex: 1, padding: '10px 6px', borderRadius: 12, border: `1px solid ${visibilityMode === m.id ? m.color : border}`,
              background: visibilityMode === m.id ? `${m.color}15` : 'none',
              color: visibilityMode === m.id ? m.color : muted,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
            }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{m.label}</div>
              <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* WiFi presence note */}
      {visibilityMode !== 'off' && (
        <div style={{ background: `${teal}10`, border: `1px solid ${teal}25`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: muted, lineHeight: 1.6 }}>
          📶 Campus WiFi detected — your location updates automatically as you move between buildings.
        </div>
      )}

      {/* Search */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, department, skill…"
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`,
          color: text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* Count */}
      <div style={{ fontSize: 12, color: muted, marginBottom: 14, fontWeight: 600 }}>
        {others.length} {others.length === 1 ? 'person' : 'people'} visible on campus now
      </div>

      {/* Empty */}
      {others.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: muted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏛</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 6 }}>
            {visibilityMode === 'off' ? 'You\'re hidden' : 'No one visible yet'}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            {visibilityMode === 'off'
              ? 'Switch to Department or Campus-wide to see and be seen.'
              : 'Others will appear here as they join the space.'}
          </div>
        </div>
      )}

      {/* People cards — LinkedIn-style */}
      {others.map(p => {
        const name = p.profiles?.name || 'Unknown';
        const dept = p.profiles?.domain || '';
        const year = p.profiles?.title || '';
        const isThrottled = throttled[p.profile_id];
        return (
          <div key={p.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Avatar name={name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
                <div style={{ fontSize: 13, color: muted, marginTop: 2 }}>
                  {[year, dept].filter(Boolean).join(' · ')}
                </div>
                {p.need && (
                  <div style={{ fontSize: 12, color: muted, marginTop: 6, lineHeight: 1.5 }}>
                    <span style={{ color: gold, fontWeight: 600 }}>Looking for:</span> {p.need}
                  </div>
                )}
                {p.offer && (
                  <div style={{ fontSize: 12, color: muted, marginTop: 3, lineHeight: 1.5 }}>
                    <span style={{ color: teal, fontWeight: 600 }}>Offers:</span> {p.offer}
                  </div>
                )}
                {p.station && (
                  <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>📍 {p.station}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => triggerHandshake(p)}
              disabled={isThrottled}
              style={{
                marginTop: 12, width: '100%', padding: '9px', borderRadius: 10,
                background: isThrottled ? 'rgba(255,255,255,0.06)' : 'rgba(226,109,52,0.15)',
                border: `1px solid ${isThrottled ? border : accent + '44'}`,
                color: isThrottled ? muted : accent,
                fontWeight: 600, cursor: isThrottled ? 'default' : 'pointer',
                fontSize: 14, fontFamily: 'inherit',
              }}
            >
              {isThrottled ? 'Request sent' : 'Connect'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
