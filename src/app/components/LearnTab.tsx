import React, { useState } from 'react';
import { ResourceItem, CourseMaterial } from '../types';

const accent = '#E26D34';
const gold = '#D4AF37';
const teal = '#1D9E75';
const purple = '#8A6DE2';
const text = '#F0EBE1';
const muted = 'rgba(240,235,225,0.45)';
const border = 'rgba(255,255,255,0.08)';
const card = 'rgba(255,255,255,0.04)';

type LearnSub = 'materials' | 'resources';

function FileIcon({ type }: { type: string }) {
  const t = type?.toLowerCase() || '';
  if (t.includes('pdf')) return <span style={{ fontSize: 22 }}>📄</span>;
  if (t.includes('slide') || t.includes('ppt')) return <span style={{ fontSize: 22 }}>📊</span>;
  if (t.includes('video')) return <span style={{ fontSize: 22 }}>🎥</span>;
  if (t.includes('doc')) return <span style={{ fontSize: 22 }}>📝</span>;
  return <span style={{ fontSize: 22 }}>📎</span>;
}

export function LearnTab({ materials, resources }: {
  materials: CourseMaterial[];
  resources: ResourceItem[];
}) {
  const [sub, setSub] = useState<LearnSub>('materials');
  const [search, setSearch] = useState('');

  // Group materials by unit
  const byUnit: Record<string, CourseMaterial[]> = {};
  materials.forEach(m => {
    const key = m.unit_code ? `${m.unit_code}: ${m.unit_name || ''}` : (m.unit_name || 'General');
    (byUnit[key] ||= []).push(m);
  });

  const filteredResources = resources.filter(r =>
    !search.trim() || r.name.toLowerCase().includes(search.toLowerCase()) || (r.owner || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '0 16px 16px', fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* Sub-tab pills */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 0 14px' }}>
        {(['materials', 'resources'] as LearnSub[]).map(s => (
          <button key={s} onClick={() => setSub(s)} style={{
            padding: '9px 20px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13,
            background: sub === s ? accent : 'rgba(255,255,255,0.08)',
            color: sub === s ? '#fff' : text,
            fontWeight: sub === s ? 600 : 400,
          }}>
            {s === 'materials' ? 'Course Materials' : 'Resources'}
          </button>
        ))}
      </div>

      {/* Materials */}
      {sub === 'materials' && (
        <>
          {Object.keys(byUnit).length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: muted }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 6 }}>No materials yet</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>Your lecturers will upload course materials here.</div>
            </div>
          )}
          {Object.entries(byUnit).map(([unit, items]) => (
            <div key={unit} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: accent, fontWeight: 700, marginBottom: 10, letterSpacing: 0.5 }}>{unit.toUpperCase()}</div>
              {items.map(m => (
                <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FileIcon type={m.file_type} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: text }}>{m.title}</div>
                      {m.uploader_name && <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>by {m.uploader_name}</div>}
                      <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{new Date(m.uploaded_at).toLocaleDateString()}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          ))}
        </>
      )}

      {/* Resources */}
      {sub === 'resources' && (
        <>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search resources…"
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12, marginBottom: 16,
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`,
              color: text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }} />

          {filteredResources.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: muted }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔭</div>
              <div style={{ fontSize: 14 }}>No resources found</div>
            </div>
          )}

          {filteredResources.map(r => (
            <div key={r.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
              {r.image_url && <img src={r.image_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />}
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{r.name}</div>
              {r.owner && <div style={{ fontSize: 13, color: muted, marginBottom: 4 }}>{r.owner}</div>}
              {r.description && <div style={{ fontSize: 13, color: muted, lineHeight: 1.6, marginBottom: 6 }}>{r.description}</div>}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: muted }}>
                {r.availability && <span>🕐 {r.availability}</span>}
                {r.capacity && <span>👥 {r.capacity}</span>}
                {r.zones?.name && <span>📍 {r.zones.name}</span>}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
