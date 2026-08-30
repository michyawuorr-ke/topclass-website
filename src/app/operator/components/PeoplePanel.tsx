import React, { useState } from 'react';

interface PresentPerson {
  id: string;
  need: string | null;
  offer: string | null;
  station: string | null;
  profiles?: { name: string; title: string; domain: string; capabilities?: string; standing_need?: string };
}

export function PeoplePanel({ people }: { people: PresentPerson[] }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q
    ? people.filter(p => {
        const name = p.profiles?.name?.toLowerCase() || '';
        const title = p.profiles?.title?.toLowerCase() || '';
        const domain = p.profiles?.domain?.toLowerCase() || '';
        return name.includes(q) || title.includes(q) || domain.includes(q);
      })
    : people;

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, role, or domain"
        style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: 'none' }} />
      {filtered.length === 0 && <p style={{ opacity: 0.5 }}>{people.length === 0 ? 'No one currently present.' : 'No matches.'}</p>}
      {filtered.map(p => (
        <div key={p.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{p.profiles?.name || 'Someone'}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{p.profiles?.title} · {p.profiles?.domain}</div>
          {p.station && <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>At: {p.station}</div>}
          {p.need && <div style={{ fontSize: 13, marginTop: 6 }}>Needs: {p.need}</div>}
          {p.offer && <div style={{ fontSize: 13 }}>Offers: {p.offer}</div>}
        </div>
      ))}
    </div>
  );
}

